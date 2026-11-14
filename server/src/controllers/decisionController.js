import { dbService } from '../services/storage/databaseService.js';
import { createDecisionSchema } from '../validators/schemas.js';
import { NotFoundError } from '../utils/errors.js';

export const decisionController = {
  async recordDecision(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const validated = createDecisionSchema.parse(req.body);
      const decision = await dbService.createDecision(userId, projectId, validated);

      const alt = (await dbService.listAlternatives(userId, projectId)).find(a => a.id === validated.selected_alternative_id);

      await dbService.logActivity(
        userId,
        projectId,
        'HUMAN_DECISION_APPROVED',
        `Human decision recorded: ${validated.decision_status.toUpperCase()} choice "${alt?.name || validated.selected_alternative_id}". Rationale: "${validated.decision_reason}"`
      );

      return res.status(201).json({
        success: true,
        message: 'Final human decision recorded and locked in audit trail',
        data: decision,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const decisions = await dbService.listDecisions(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Project decisions retrieved',
        data: decisions,
        meta: { count: decisions.length },
      });
    } catch (err) {
      next(err);
    }
  },
};
