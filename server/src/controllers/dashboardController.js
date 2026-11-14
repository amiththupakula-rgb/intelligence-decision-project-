import { dbService } from '../services/storage/databaseService.js';

export const dashboardController = {
  async getOverview(req, res, next) {
    try {
      const userId = req.user.id;
      const projects = await dbService.listProjects(userId);
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'analyzed' || p.status === 'evaluated');
      const completedProjects = projects.filter(p => p.status === 'decided' || p.status === 'archived');

      let totalDatasets = 0;
      let totalRecommendations = 0;
      let totalRisks = 0;
      let highRiskCount = 0;

      for (const p of projects) {
        const datasets = await dbService.listDatasets(userId, p.id);
        const recs = await dbService.listRecommendations(userId, p.id);
        const risks = await dbService.listRisks(userId, p.id);

        totalDatasets += datasets.length;
        totalRecommendations += recs.length;
        totalRisks += risks.length;
        highRiskCount += risks.filter(r => r.risk_level === 'critical' || r.risk_level === 'high').length;
      }

      const alerts = await dbService.listAlerts(userId);
      const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

      return res.json({
        success: true,
        message: 'Dashboard metrics retrieved',
        data: {
          stats: {
            totalProjects: projects.length,
            activeProjects: activeProjects.length,
            completedDecisions: completedProjects.length,
            uploadedDatasets: totalDatasets,
            generatedRecommendations: totalRecommendations,
            highRiskDecisions: highRiskCount,
            activeMonitoringAlerts: unacknowledgedAlerts.length,
          },
          recentProjects: projects.slice(0, 5),
          activeAlerts: unacknowledgedAlerts.slice(0, 5),
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async getRecentActivity(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit || '10', 10);
      const activity = await dbService.listRecentActivity(userId, limit);
      return res.json({
        success: true,
        message: 'Recent activity logs retrieved',
        data: activity,
        meta: { count: activity.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async getRiskSummary(req, res, next) {
    try {
      const userId = req.user.id;
      const projects = await dbService.listProjects(userId);
      let allRisks = [];

      for (const p of projects) {
        const risks = await dbService.listRisks(userId, p.id);
        allRisks = allRisks.concat(risks.map(r => ({ ...r, projectTitle: p.title })));
      }

      const byLevel = {
        critical: allRisks.filter(r => r.risk_level === 'critical'),
        high: allRisks.filter(r => r.risk_level === 'high'),
        moderate: allRisks.filter(r => r.risk_level === 'moderate'),
        low: allRisks.filter(r => r.risk_level === 'low'),
      };

      return res.json({
        success: true,
        message: 'Cross-project risk summary retrieved',
        data: {
          totalRisks: allRisks.length,
          criticalCount: byLevel.critical.length,
          highCount: byLevel.high.length,
          moderateCount: byLevel.moderate.length,
          lowCount: byLevel.low.length,
          criticalRisks: byLevel.critical.slice(0, 5),
          highRisks: byLevel.high.slice(0, 5),
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
