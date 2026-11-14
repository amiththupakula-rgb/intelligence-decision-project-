import { dbService } from '../services/storage/databaseService.js';
import { createCriterionSchema, updateCriterionSchema } from '../validators/schemas.js';
import { NotFoundError } from '../utils/errors.js';

export const criteriaController = {
  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const criteria = await dbService.listCriteria(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Evaluation criteria retrieved',
        data: criteria,
        meta: { count: criteria.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const validated = createCriterionSchema.parse(req.body);
      const criterion = await dbService.createCriterion(userId, projectId, validated);
      await dbService.logActivity(userId, projectId, 'CRITERION_CREATED', `Added criterion "${criterion.name}" (${criterion.direction}, weight: ${criterion.weight}%)`);
      return res.status(201).json({
        success: true,
        message: 'Evaluation criterion created',
        data: criterion,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const validated = updateCriterionSchema.parse(req.body);
      const updated = await dbService.updateCriterion(userId, req.params.id, validated);
      if (!updated) throw new NotFoundError('Criterion not found');
      return res.json({
        success: true,
        message: 'Criterion updated',
        data: updated,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      await dbService.deleteCriterion(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Criterion deleted',
        data: { id: req.params.id },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
