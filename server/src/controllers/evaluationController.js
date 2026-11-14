import { dbService } from '../services/storage/databaseService.js';
import { evaluateAlternatives } from '../services/evaluation/mcdaEngine.js';
import { geminiService } from '../services/ai/geminiService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const evaluationController = {
  async evaluate(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const alternatives = await dbService.listAlternatives(userId, projectId);
      const criteria = await dbService.listCriteria(userId, projectId);

      if (alternatives.length < 2) {
        throw new ValidationError('Evaluation requires at least two alternatives to compare.');
      }
      if (criteria.length === 0) {
        throw new ValidationError('Evaluation requires at least one evaluation criterion with weights.');
      }

      // Read scores from request body or database
      const rawScores = req.body.scores || await dbService.listScoresForProject(userId, projectId);

      if (!rawScores || rawScores.length === 0) {
        throw new ValidationError('Please enter alternative criterion scores before triggering evaluation.');
      }

      // Upsert raw scores into storage
      for (const s of rawScores) {
        await dbService.upsertScore(s.alternative_id, s.criterion_id, s.raw_value);
      }

      // Deterministic MCDA calculation
      const evaluationResult = evaluateAlternatives(alternatives, criteria, rawScores);

      // AI Explanation of the deterministic evaluation
      const explanationResult = await geminiService.explainEvaluationResults(project, evaluationResult);

      // Save evaluation results to database
      const saved = await dbService.saveEvaluationResults(userId, projectId, {
        methodology: evaluationResult.methodology,
        criteriaWeights: evaluationResult.criteriaWeights,
        normalizedScores: evaluationResult.normalizedScores,
        rankings: evaluationResult.rankings,
        sensitivityResults: evaluationResult.sensitivityResults,
        aiExplanation: explanationResult.data,
      });

      // Update project status to evaluated
      if (project.status !== 'decided') {
        await dbService.updateProject(userId, projectId, { status: 'evaluated' });
      }

      await dbService.logActivity(userId, projectId, 'EVALUATION_COMPLETED', `Completed MCDA evaluation: Rank #1 is "${evaluationResult.rankings[0].name}" (${evaluationResult.rankings[0].weighted_score}/100)`);

      return res.status(201).json({
        success: true,
        message: 'Multi-criteria evaluation completed successfully',
        data: {
          ...saved,
          aiExplanation: explanationResult.data,
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async getLatest(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const result = await dbService.getLatestEvaluation(userId, projectId);
      if (!result) {
        return res.json({
          success: true,
          message: 'No evaluation has been executed yet for this project',
          data: null,
          meta: {},
        });
      }

      return res.json({
        success: true,
        message: 'Latest evaluation results retrieved',
        data: result,
        meta: {},
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
        const evalRes = await dbService.getLatestEvaluation(userId, p.id);
        if (evalRes && evalRes.id === req.params.id) {
          found = evalRes;
          break;
        }
      }
      if (!found) throw new NotFoundError('Evaluation record not found');
      return res.json({
        success: true,
        message: 'Evaluation retrieved',
        data: found,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async runSensitivity(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const latest = await dbService.getLatestEvaluation(userId, projectId);
      if (!latest) throw new ValidationError('Run an initial evaluation before performing sensitivity analysis.');

      return res.json({
        success: true,
        message: 'Sensitivity analysis retrieved',
        data: latest.sensitivity_results || {},
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
