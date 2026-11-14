import { dbService } from '../services/storage/databaseService.js';
import { createMetricSchema, recordObservationSchema } from '../validators/schemas.js';
import { evaluateMetricStatus, generateAlertForMetric } from '../services/monitoring/monitoringService.js';
import { geminiService } from '../services/ai/geminiService.js';
import { NotFoundError } from '../utils/errors.js';

export const monitoringController = {
  async getProjectMonitoring(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const metrics = await dbService.listMonitoringMetrics(userId, projectId);
      const alerts = await dbService.listAlerts(userId, projectId);

      // Attach latest observations
      const metricsWithHistory = await Promise.all(
        metrics.map(async m => {
          const history = await dbService.listObservationsForMetric(m.id);
          return {
            ...m,
            observations: history,
          };
        })
      );

      return res.json({
        success: true,
        message: 'Continuous monitoring overview retrieved',
        data: {
          metrics: metricsWithHistory,
          alerts,
          breachedCount: metrics.filter(m => m.status === 'breached').length,
          warningCount: metrics.filter(m => m.status === 'warning').length,
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async createMetric(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const validated = createMetricSchema.parse(req.body);
      const metric = await dbService.createMonitoringMetric(userId, projectId, validated);

      await dbService.logActivity(userId, projectId, 'METRIC_CREATED', `Added KPI monitor: "${metric.metric_name}" (Expected: ${metric.expected_value} ${metric.unit || ''})`);

      return res.status(201).json({
        success: true,
        message: 'Monitoring metric created',
        data: metric,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMetric(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await dbService.updateMonitoringMetric(userId, req.params.id, req.body);
      if (!updated) throw new NotFoundError('Metric not found');
      return res.json({
        success: true,
        message: 'Metric updated',
        data: updated,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async recordObservation(req, res, next) {
    try {
      const userId = req.user.id;
      const metricId = req.params.id;
      const validated = recordObservationSchema.parse(req.body);

      // Locate metric
      const projects = await dbService.listProjects(userId);
      let metric = null;
      for (const p of projects) {
        const metrics = await dbService.listMonitoringMetrics(userId, p.id);
        const match = metrics.find(m => m.id === metricId);
        if (match) {
          metric = match;
          break;
        }
      }

      if (!metric) throw new NotFoundError('Metric not found');

      // Record observation
      const obs = await dbService.recordObservation(
        userId,
        metricId,
        metric.project_id,
        validated.observed_value,
        validated.metadata
      );

      // Evaluate deviation against threshold
      const statusCheck = evaluateMetricStatus(
        metric.expected_value,
        validated.observed_value,
        metric.threshold
      );

      // Update metric current value and status
      await dbService.updateMonitoringMetric(userId, metricId, {
        actual_value: validated.observed_value,
        status: statusCheck.status,
      });

      // Generate alert if breached
      let generatedAlert = null;
      if (statusCheck.isBreached) {
        const alertData = generateAlertForMetric(metric, validated.observed_value, statusCheck.deviationPercent);
        generatedAlert = await dbService.createAlert(userId, metric.project_id, alertData);
      }

      return res.status(201).json({
        success: true,
        message: 'Observation recorded and evaluated',
        data: {
          observation: obs,
          status: statusCheck.status,
          deviationPercent: statusCheck.deviationPercent,
          alert: generatedAlert,
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async listAlerts(req, res, next) {
    try {
      const userId = req.user.id;
      const alerts = await dbService.listAlerts(userId);
      return res.json({
        success: true,
        message: 'Monitoring alerts retrieved',
        data: alerts,
        meta: { count: alerts.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async acknowledgeAlert(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await dbService.acknowledgeAlert(userId, req.params.id);
      if (!updated) throw new NotFoundError('Alert not found');
      return res.json({
        success: true,
        message: 'Alert acknowledged',
        data: updated,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async triggerReassessment(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const metrics = await dbService.listMonitoringMetrics(userId, projectId);
      const observationsSummary = metrics.map(m => {
        const check = evaluateMetricStatus(m.expected_value, m.actual_value, m.threshold);
        return {
          metric_id: m.id,
          metric_name: m.metric_name,
          expected_value: m.expected_value,
          actual_value: m.actual_value,
          threshold: m.threshold,
          deviationPercent: check.deviationPercent,
          isBreached: check.isBreached,
        };
      });

      const aiReassessment = await geminiService.assessMonitoringDeviations(project, observationsSummary);

      return res.json({
        success: true,
        message: 'Continuous monitoring reassessment completed',
        data: aiReassessment.data,
        meta: {
          isAIGenerated: aiReassessment.isAIGenerated,
          modelUsed: aiReassessment.modelUsed,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
