import { dbService } from '../services/storage/databaseService.js';
import { performCompleteAnalysis } from '../services/analytics/statsEngine.js';
import { geminiService } from '../services/ai/geminiService.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const analyticsController = {
  async runAnalysis(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const { dataset_id } = req.body;
      const datasets = await dbService.listDatasets(userId, projectId);
      const targetDataset = dataset_id
        ? datasets.find(d => d.id === dataset_id)
        : datasets[0];

      if (!targetDataset) {
        throw new ValidationError('No uploaded dataset available in project for analytical processing.');
      }

      // Load records
      const records = await dbService.getDatasetRecords(userId, targetDataset.id, 50000);
      if (records.length === 0) {
        throw new ValidationError('Selected dataset contains no data rows.');
      }

      // Deterministic Statistical Calculations
      const analyticalResults = performCompleteAnalysis(records, targetDataset.column_metadata || []);

      // AI Dataset Intelligence interpretation
      const aiInterpretation = await geminiService.generateDatasetIntelligence(
        project,
        analyticalResults
      );

      // Save Analysis Record
      const saved = await dbService.saveAnalysis(userId, projectId, {
        dataset_id: targetDataset.id,
        analysis_type: 'full_statistical_intelligence',
        analysis_results: {
          ...analyticalResults,
          aiInterpretation: aiInterpretation.data,
          modelMetadata: {
            isAIGenerated: aiInterpretation.isAIGenerated,
            modelUsed: aiInterpretation.modelUsed,
          },
        },
        evidence_references: analyticalResults.evidenceReferences,
      });

      // Update project status to analyzed
      if (project.status === 'draft' || project.status === 'active') {
        await dbService.updateProject(userId, projectId, { status: 'analyzed' });
      }

      await dbService.logActivity(userId, projectId, 'ANALYSIS_COMPLETED', `Executed analytical intelligence pipeline on "${targetDataset.name}"`);

      return res.status(201).json({
        success: true,
        message: 'Analytical intelligence pipeline completed successfully',
        data: saved,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const analyses = await dbService.listAnalyses(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Project analyses retrieved',
        data: analyses,
        meta: { count: analyses.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      // Search across user's projects
      const projects = await dbService.listProjects(userId);
      let found = null;
      for (const p of projects) {
        const analyses = await dbService.listAnalyses(userId, p.id);
        const match = analyses.find(a => a.id === req.params.id);
        if (match) {
          found = match;
          break;
        }
      }

      if (!found) throw new NotFoundError('Analysis record not found');
      return res.json({
        success: true,
        message: 'Analysis record retrieved',
        data: found,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async recalculate(req, res, next) {
    try {
      const userId = req.user.id;
      const analysisId = req.params.id;
      const projects = await dbService.listProjects(userId);
      let existingAnalysis = null;
      let parentProject = null;

      for (const p of projects) {
        const analyses = await dbService.listAnalyses(userId, p.id);
        const match = analyses.find(a => a.id === analysisId);
        if (match) {
          existingAnalysis = match;
          parentProject = p;
          break;
        }
      }

      if (!existingAnalysis) throw new NotFoundError('Analysis not found');

      // Re-run
      req.params.id = parentProject.id;
      req.body.dataset_id = existingAnalysis.dataset_id;
      return analyticsController.runAnalysis(req, res, next);
    } catch (err) {
      next(err);
    }
  },
};
