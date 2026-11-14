import { dbService } from '../services/storage/databaseService.js';
import { generateComprehensiveReport, generateCSVExport } from '../services/reports/reportService.js';
import { NotFoundError } from '../utils/errors.js';

export const reportController = {
  async generateProjectReport(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const datasets = await dbService.listDatasets(userId, projectId);
      const analyses = await dbService.listAnalyses(userId, projectId);
      const alternatives = await dbService.listAlternatives(userId, projectId);
      const criteria = await dbService.listCriteria(userId, projectId);
      const evaluation = await dbService.getLatestEvaluation(userId, projectId);
      const risks = await dbService.listRisks(userId, projectId);
      const recs = await dbService.listRecommendations(userId, projectId);
      const decisions = await dbService.listDecisions(userId, projectId);
      const monitoring = await dbService.listMonitoringMetrics(userId, projectId);
      const alerts = await dbService.listAlerts(userId, projectId);

      const report = generateComprehensiveReport(project, {
        datasets,
        analyses,
        alternatives,
        criteria,
        evaluation,
        risks,
        recommendation: recs[0] || null,
        finalDecision: decisions[0] || null,
        monitoring,
        alerts,
      });

      // Check if CSV format is requested
      if (req.query.format === 'csv') {
        const csv = generateCSVExport({
          evaluation,
          alternatives,
          criteria,
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="decision_evaluation_${projectId}.csv"`);
        return res.send(csv);
      }

      return res.json({
        success: true,
        message: 'Comprehensive decision report generated',
        data: report,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async listReports(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      return res.json({
        success: true,
        message: 'Available reports for project',
        data: [
          {
            id: `audit-${projectId}`,
            title: `Full Intelligence Audit Report (${project.title})`,
            format: 'json',
            url: `/api/v1/projects/${projectId}/reports`,
          },
          {
            id: `csv-${projectId}`,
            title: `MCDA Alternative Matrix Export (${project.title})`,
            format: 'csv',
            url: `/api/v1/projects/${projectId}/reports?format=csv`,
          },
        ],
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
