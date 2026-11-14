import { Router } from 'express';
import multer from 'multer';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Controllers
import { authController } from '../controllers/authController.js';
import { dashboardController } from '../controllers/dashboardController.js';
import { projectController } from '../controllers/projectController.js';
import { datasetController } from '../controllers/datasetController.js';
import { analyticsController } from '../controllers/analyticsController.js';
import { alternativeController } from '../controllers/alternativeController.js';
import { criteriaController } from '../controllers/criteriaController.js';
import { evaluationController } from '../controllers/evaluationController.js';
import { riskController } from '../controllers/riskController.js';
import { recommendationController } from '../controllers/recommendationController.js';
import { decisionController } from '../controllers/decisionController.js';
import { monitoringController } from '../controllers/monitoringController.js';
import { reportController } from '../controllers/reportController.js';
import { profileController } from '../controllers/profileController.js';
import { notificationController } from '../controllers/notificationController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
  },
});

export const apiRouter = Router();

// ============================================================================
// 1. AUTHENTICATION ROUTES
// ============================================================================
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/login', authController.login);
apiRouter.get('/auth/me', authMiddleware, authController.getMe);
apiRouter.post('/auth/logout', authMiddleware, authController.logout);

// ============================================================================
// 2. DASHBOARD ROUTES
// ============================================================================
apiRouter.get('/dashboard/overview', authMiddleware, dashboardController.getOverview);
apiRouter.get('/dashboard/recent-activity', authMiddleware, dashboardController.getRecentActivity);
apiRouter.get('/dashboard/risk-summary', authMiddleware, dashboardController.getRiskSummary);

// ============================================================================
// 3. PROJECT ROUTES
// ============================================================================
apiRouter.get('/projects', authMiddleware, projectController.list);
apiRouter.post('/projects', authMiddleware, projectController.create);
apiRouter.get('/projects/:id', authMiddleware, projectController.getById);
apiRouter.patch('/projects/:id', authMiddleware, projectController.update);
apiRouter.delete('/projects/:id', authMiddleware, projectController.delete);
apiRouter.post('/projects/:id/archive', authMiddleware, projectController.archive);

// ============================================================================
// 4. DATASET ROUTES
// ============================================================================
apiRouter.get('/projects/:id/datasets', authMiddleware, datasetController.listByProject);
apiRouter.post('/projects/:id/datasets/upload', authMiddleware, upload.single('file'), datasetController.upload);
apiRouter.get('/datasets/:id', authMiddleware, datasetController.getById);
apiRouter.get('/datasets/:id/preview', authMiddleware, datasetController.getPreview);
apiRouter.get('/datasets/:id/quality', authMiddleware, datasetController.getQuality);
apiRouter.post('/datasets/:id/process', authMiddleware, datasetController.processAndClean);
apiRouter.delete('/datasets/:id', authMiddleware, datasetController.delete);

// ============================================================================
// 5. DATA ANALYSIS ROUTES
// ============================================================================
apiRouter.post('/projects/:id/analysis', authMiddleware, analyticsController.runAnalysis);
apiRouter.get('/projects/:id/analysis', authMiddleware, analyticsController.listByProject);
apiRouter.get('/analysis/:id', authMiddleware, analyticsController.getById);
apiRouter.post('/analysis/:id/recalculate', authMiddleware, analyticsController.recalculate);

// ============================================================================
// 6. ALTERNATIVES ROUTES
// ============================================================================
apiRouter.get('/projects/:id/alternatives', authMiddleware, alternativeController.listByProject);
apiRouter.post('/projects/:id/alternatives', authMiddleware, alternativeController.create);
apiRouter.post('/projects/:id/alternatives/generate-ai', authMiddleware, alternativeController.generateWithAI);
apiRouter.patch('/alternatives/:id', authMiddleware, alternativeController.update);
apiRouter.delete('/alternatives/:id', authMiddleware, alternativeController.delete);

// ============================================================================
// 7. EVALUATION CRITERIA ROUTES
// ============================================================================
apiRouter.get('/projects/:id/criteria', authMiddleware, criteriaController.listByProject);
apiRouter.post('/projects/:id/criteria', authMiddleware, criteriaController.create);
apiRouter.patch('/criteria/:id', authMiddleware, criteriaController.update);
apiRouter.delete('/criteria/:id', authMiddleware, criteriaController.delete);

// ============================================================================
// 8. EVALUATION ROUTES
// ============================================================================
apiRouter.post('/projects/:id/evaluate', authMiddleware, evaluationController.evaluate);
apiRouter.get('/projects/:id/evaluation', authMiddleware, evaluationController.getLatest);
apiRouter.get('/evaluation/:id', authMiddleware, evaluationController.getById);
apiRouter.post('/projects/:id/evaluation/sensitivity', authMiddleware, evaluationController.runSensitivity);

// ============================================================================
// 9. RISK ASSESSMENT ROUTES
// ============================================================================
apiRouter.get('/projects/:id/risks', authMiddleware, riskController.listByProject);
apiRouter.post('/projects/:id/risks/assess', authMiddleware, riskController.assessAndDiscoverWithAI);
apiRouter.post('/projects/:id/risks', authMiddleware, riskController.create);
apiRouter.patch('/risks/:id', authMiddleware, riskController.update);

// ============================================================================
// 10. AI RECOMMENDATIONS ROUTES
// ============================================================================
apiRouter.post('/projects/:id/recommendations/generate', authMiddleware, recommendationController.generate);
apiRouter.get('/projects/:id/recommendations', authMiddleware, recommendationController.listByProject);
apiRouter.get('/recommendations/:id', authMiddleware, recommendationController.getById);
apiRouter.post('/recommendations/:id/feedback', authMiddleware, recommendationController.submitFeedback);

// ============================================================================
// 11. FINAL DECISION ROUTES
// ============================================================================
apiRouter.post('/projects/:id/decisions', authMiddleware, decisionController.recordDecision);
apiRouter.get('/projects/:id/decisions', authMiddleware, decisionController.listByProject);

// ============================================================================
// 12. CONTINUOUS MONITORING ROUTES
// ============================================================================
apiRouter.get('/projects/:id/monitoring', authMiddleware, monitoringController.getProjectMonitoring);
apiRouter.post('/projects/:id/monitoring/metrics', authMiddleware, monitoringController.createMetric);
apiRouter.patch('/monitoring/metrics/:id', authMiddleware, monitoringController.updateMetric);
apiRouter.post('/monitoring/metrics/:id/observations', authMiddleware, monitoringController.recordObservation);
apiRouter.get('/monitoring/alerts', authMiddleware, monitoringController.listAlerts);
apiRouter.post('/monitoring/alerts/:id/acknowledge', authMiddleware, monitoringController.acknowledgeAlert);
apiRouter.post('/projects/:id/monitoring/reassess', authMiddleware, monitoringController.triggerReassessment);

// ============================================================================
// 13. REPORT & EXPORT ROUTES
// ============================================================================
apiRouter.get('/projects/:id/reports', authMiddleware, reportController.generateProjectReport);
apiRouter.post('/projects/:id/reports', authMiddleware, reportController.generateProjectReport);

// ============================================================================
// 14. PROFILE ROUTES
// ============================================================================
apiRouter.get('/profile', authMiddleware, profileController.get);
apiRouter.patch('/profile', authMiddleware, profileController.update);

// ============================================================================
// 15. NOTIFICATION ROUTES
// ============================================================================
apiRouter.get('/notifications', authMiddleware, notificationController.list);
apiRouter.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
