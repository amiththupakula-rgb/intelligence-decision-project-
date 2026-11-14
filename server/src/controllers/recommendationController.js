import { dbService } from '../services/storage/databaseService.js';
import { geminiService } from '../services/ai/geminiService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const recommendationController = {
  async generate(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const alternatives = await dbService.listAlternatives(userId, projectId);
      const evaluation = await dbService.getLatestEvaluation(userId, projectId);
      const risks = await dbService.listRisks(userId, projectId);
      const analyses = await dbService.listAnalyses(userId, projectId);

      if (alternatives.length < 2) {
        throw new ValidationError('A recommendation requires at least two alternatives to evaluate.');
      }
      if (!evaluation) {
        throw new ValidationError('Please run the Multi-Criteria Evaluation before generating a final recommendation.');
      }

      // Collect evidence pool
      const evidencePool = [];
      analyses.forEach(a => {
        if (a.evidence_references && Array.isArray(a.evidence_references)) {
          evidencePool.push(...a.evidence_references);
        }
      });
      if (evaluation.calculation_metadata?.evidenceReferences) {
        evidencePool.push(...evaluation.calculation_metadata.evidenceReferences);
      }

      // Generate explainable recommendation with Gemini
      const aiResult = await geminiService.generateRecommendation(
        project,
        alternatives,
        evaluation,
        risks,
        evidencePool
      );

      const recData = aiResult.data;

      // Save recommendation to database
      const saved = await dbService.saveRecommendation(userId, projectId, {
        recommended_alternative_id: recData.recommended_alternative_id,
        recommendation_type: recData.recommendation_type,
        recommendation_summary: recData.recommendation_summary,
        explanation: {
          reasoning: recData.reasoning,
          advantages: recData.advantages,
          disadvantages: recData.disadvantages,
          alternative_options: recData.alternative_options,
          conditions_for_reassessment: recData.conditions_for_reassessment,
        },
        supporting_evidence: recData.reasoning.flatMap(r => r.evidence_ids || []),
        risks: recData.risks,
        assumptions: recData.assumptions,
        uncertainties: recData.uncertainties,
        confidence_level: recData.confidence_level,
        model_name: aiResult.modelUsed,
        prompt_version: aiResult.promptVersion,
      });

      await dbService.logActivity(userId, projectId, 'RECOMMENDATION_GENERATED', `Generated recommendation: ${recData.recommendation_type.toUpperCase()} recommendation for alternative ${recData.recommended_alternative_id || 'N/A'}`);

      return res.status(201).json({
        success: true,
        message: 'Explainable AI recommendation generated successfully',
        data: saved,
        meta: {
          isAIGenerated: aiResult.isAIGenerated,
          modelUsed: aiResult.modelUsed,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const recommendations = await dbService.listRecommendations(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Recommendations retrieved',
        data: recommendations,
        meta: { count: recommendations.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const projects = await dbService.listProjects(userId);
      let found = null;
      for (const p of projects) {
        const recs = await dbService.listRecommendations(userId, p.id);
        const match = recs.find(r => r.id === req.params.id);
        if (match) {
          found = match;
          break;
        }
      }
      if (!found) throw new NotFoundError('Recommendation not found');
      return res.json({
        success: true,
        message: 'Recommendation retrieved',
        data: found,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async submitFeedback(req, res, next) {
    try {
      const userId = req.user.id;
      const { rating, feedback } = req.body;
      // In production, can store in a feedback table
      await dbService.logActivity(userId, null, 'RECOMMENDATION_FEEDBACK', `User feedback: rating ${rating || 'N/A'}, notes: ${feedback || 'None'}`);
      return res.json({
        success: true,
        message: 'Recommendation feedback recorded',
        data: { acknowledged: true },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
