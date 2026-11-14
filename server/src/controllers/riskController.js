import { dbService } from '../services/storage/databaseService.js';
import { createRiskSchema, updateRiskSchema } from '../validators/schemas.js';
import { evaluateAlternativeRisks } from '../services/risk/riskEngine.js';
import { geminiService } from '../services/ai/geminiService.js';
import { NotFoundError } from '../utils/errors.js';

export const riskController = {
  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const risks = await dbService.listRisks(userId, projectId);
      const alternatives = await dbService.listAlternatives(userId, projectId);

      const evaluation = evaluateAlternativeRisks(risks, alternatives);

      return res.json({
        success: true,
        message: 'Risk assessments and matrix retrieved',
        data: {
          risks,
          matrix: evaluation.matrix,
          profiles: evaluation.profiles,
          crossCuttingRisks: evaluation.crossCuttingRisks,
        },
        meta: { totalRisks: risks.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async assessAndDiscoverWithAI(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const alternatives = await dbService.listAlternatives(userId, projectId);
      const datasets = await dbService.listDatasets(userId, projectId);

      // AI Risk discovery
      const aiRisksResult = await geminiService.identifyRisks(project, alternatives, {
        datasetCount: datasets.length,
      });

      // Automatically store discovered risks if requested
      const storedRisks = [];
      for (const r of (aiRisksResult.data.risks || [])) {
        const created = await dbService.createRisk(userId, projectId, {
          alternative_id: r.alternative_id || null,
          risk_title: r.title,
          risk_description: r.description,
          risk_category: r.category,
          likelihood: r.likelihood || 2,
          impact: r.impact,
          risk_level: r.risk_level,
          mitigation: r.mitigation,
          evidence: r.evidence_ids || [],
        });
        storedRisks.push(created);
      }

      await dbService.logActivity(userId, projectId, 'RISKS_ASSESSED', `Identified and evaluated ${storedRisks.length} project risk items`);

      const currentRisks = await dbService.listRisks(userId, projectId);
      const evalData = evaluateAlternativeRisks(currentRisks, alternatives);

      return res.status(201).json({
        success: true,
        message: 'Risk identification and deterministic assessment completed',
        data: {
          newlyDiscoveredRisks: storedRisks,
          allRisks: currentRisks,
          matrix: evalData.matrix,
          profiles: evalData.profiles,
          summary: aiRisksResult.data.overall_risk_summary,
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const validated = createRiskSchema.parse(req.body);
      const created = await dbService.createRisk(userId, projectId, validated);
      await dbService.logActivity(userId, projectId, 'RISK_CREATED', `Added risk: "${created.risk_title}" (Level: ${created.risk_level})`);
      return res.status(201).json({
        success: true,
        message: 'Risk assessment record added',
        data: created,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const validated = updateRiskSchema.parse(req.body);
      const updated = await dbService.updateRisk(userId, req.params.id, validated);
      if (!updated) throw new NotFoundError('Risk record not found');
      return res.json({
        success: true,
        message: 'Risk assessment record updated',
        data: updated,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
