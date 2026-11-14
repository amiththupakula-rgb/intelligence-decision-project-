import { dbService } from '../services/storage/databaseService.js';
import { createProjectSchema, updateProjectSchema } from '../validators/schemas.js';
import { NotFoundError } from '../utils/errors.js';

export const projectController = {
  async list(req, res, next) {
    try {
      const userId = req.user.id;
      const { domain, status } = req.query;
      const projects = await dbService.listProjects(userId, { domain, status });
      return res.json({
        success: true,
        message: 'Projects retrieved successfully',
        data: projects,
        meta: { count: projects.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const userId = req.user.id;
      const validated = createProjectSchema.parse(req.body);
      const project = await dbService.createProject(userId, validated);
      await dbService.logActivity(userId, project.id, 'PROJECT_CREATED', `Created decision project "${project.title}"`);
      return res.status(201).json({
        success: true,
        message: 'Decision project initialized',
        data: project,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const project = await dbService.getProject(userId, req.params.id);
      if (!project) throw new NotFoundError('Decision project not found');
      return res.json({
        success: true,
        message: 'Project details retrieved',
        data: project,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const userId = req.user.id;
      const validated = updateProjectSchema.parse(req.body);
      const updated = await dbService.updateProject(userId, req.params.id, validated);
      if (!updated) throw new NotFoundError('Decision project not found');
      await dbService.logActivity(userId, updated.id, 'PROJECT_UPDATED', `Updated project "${updated.title}"`);
      return res.json({
        success: true,
        message: 'Decision project updated',
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
      const project = await dbService.getProject(userId, req.params.id);
      if (!project) throw new NotFoundError('Decision project not found');
      await dbService.deleteProject(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Decision project deleted',
        data: { id: req.params.id },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async archive(req, res, next) {
    try {
      const userId = req.user.id;
      const updated = await dbService.updateProject(userId, req.params.id, { status: 'archived' });
      if (!updated) throw new NotFoundError('Decision project not found');
      await dbService.logActivity(userId, updated.id, 'PROJECT_ARCHIVED', `Archived decision project "${updated.title}"`);
      return res.json({
        success: true,
        message: 'Project archived',
        data: updated,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
