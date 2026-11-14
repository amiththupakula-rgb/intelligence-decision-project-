import { dbService } from '../services/storage/databaseService.js';
import { createAlternativeSchema, updateAlternativeSchema } from '../validators/schemas.js';
import { geminiService } from '../services/ai/geminiService.js';
import { NotFoundError } from '../utils/errors.js';

export const alternativeController = {
  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const alternatives = await dbService.listAlternatives(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Alternatives retrieved',
        data: alternatives,
        meta: { count: alternatives.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const validated = createAlternativeSchema.parse(req.body);
      const alternative = await dbService.createAlternative(userId, projectId, validated);
      await dbService.logActivity(userId, projectId, 'ALTERNATIVE_CREATED', `Added alternative "${alternative.name}"`);
      return res.status(201).json({
        success: true,
        message: 'Alternative created',
        data: alternative,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const validated = updateAlternativeSchema.parse(req.body);
      const updated = await dbService.updateAlternative(userId, req.params.id, validated);
      if (!updated) throw new NotFoundError('Alternative not found');
      return res.json({
        success: true,
        message: 'Alternative updated',
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
      await dbService.deleteAlternative(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Alternative deleted',
        data: { id: req.params.id },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async generateWithAI(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const project = await dbService.getProject(userId, projectId);
      if (!project) throw new NotFoundError('Project not found');

      const constraints = req.body.constraints || {};
      const aiResult = await geminiService.generateAlternatives(project, constraints);

      return res.json({
        success: true,
        message: 'AI generated decision alternatives',
        data: aiResult.data,
        meta: {
          isAIGenerated: aiResult.isAIGenerated,
          modelUsed: aiResult.modelUsed,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
