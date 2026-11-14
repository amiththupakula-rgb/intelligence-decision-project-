import { dbService } from '../services/storage/databaseService.js';
import { parseCSV, parseXLSX, parseJSON } from '../services/datasets/datasetParser.js';
import { analyzeDataQuality, cleanDataset } from '../services/datasets/dataCleaner.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export const datasetController = {
  async listByProject(req, res, next) {
    try {
      const userId = req.user.id;
      const datasets = await dbService.listDatasets(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Project datasets retrieved',
        data: datasets,
        meta: { count: datasets.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async upload(req, res, next) {
    try {
      const userId = req.user.id;
      const projectId = req.params.id;
      const file = req.file;

      if (!file) {
        throw new ValidationError('No file was uploaded');
      }

      const originalName = file.originalname;
      const ext = originalName.split('.').pop()?.toLowerCase();
      let parseResult = null;

      if (ext === 'csv') {
        parseResult = parseCSV(file.buffer);
      } else if (ext === 'xlsx' || ext === 'xls') {
        parseResult = parseXLSX(file.buffer);
      } else if (ext === 'json') {
        parseResult = parseJSON(file.buffer);
      } else {
        throw new ValidationError(`Unsupported file extension: .${ext}. Only CSV, XLSX, and JSON are accepted.`);
      }

      // Analyze data quality
      const qualityReport = analyzeDataQuality(parseResult.records, parseResult.columnMetadata);

      const dataset = await dbService.createDataset(
        userId,
        projectId,
        {
          name: req.body.name || originalName.replace(/\.[^/.]+$/, ''),
          original_filename: originalName,
          file_type: ext,
          file_size: file.size,
          row_count: parseResult.rowCount,
          column_metadata: parseResult.columnMetadata,
          data_quality_score: qualityReport.qualityScore,
          source_metadata: {
            qualityReport,
            uploadedAt: new Date().toISOString(),
          },
        },
        parseResult.records
      );

      await dbService.logActivity(userId, projectId, 'DATASET_UPLOADED', `Uploaded dataset "${dataset.name}" (${parseResult.rowCount} rows)`);

      return res.status(201).json({
        success: true,
        message: 'Dataset parsed and stored successfully',
        data: {
          dataset,
          qualityReport,
          samplePreview: parseResult.records.slice(0, 5),
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const userId = req.user.id;
      const dataset = await dbService.getDataset(userId, req.params.id);
      if (!dataset) throw new NotFoundError('Dataset not found');
      return res.json({
        success: true,
        message: 'Dataset retrieved',
        data: dataset,
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async getPreview(req, res, next) {
    try {
      const userId = req.user.id;
      const dataset = await dbService.getDataset(userId, req.params.id);
      if (!dataset) throw new NotFoundError('Dataset not found');
      const limit = parseInt(req.query.limit || '50', 10);
      const records = await dbService.getDatasetRecords(userId, req.params.id, limit);

      return res.json({
        success: true,
        message: 'Dataset preview retrieved',
        data: {
          columns: dataset.column_metadata || [],
          records,
          totalRows: dataset.row_count,
        },
        meta: { previewRows: records.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async getQuality(req, res, next) {
    try {
      const userId = req.user.id;
      const dataset = await dbService.getDataset(userId, req.params.id);
      if (!dataset) throw new NotFoundError('Dataset not found');

      const qualityReport = dataset.source_metadata?.qualityReport || null;
      return res.json({
        success: true,
        message: 'Dataset quality report retrieved',
        data: {
          datasetId: dataset.id,
          qualityScore: dataset.data_quality_score,
          qualityReport,
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async processAndClean(req, res, next) {
    try {
      const userId = req.user.id;
      const dataset = await dbService.getDataset(userId, req.params.id);
      if (!dataset) throw new NotFoundError('Dataset not found');

      const records = await dbService.getDatasetRecords(userId, req.params.id, 100000);
      const options = req.body.options || {};
      const cleaned = cleanDataset(records, options);

      const newQuality = analyzeDataQuality(cleaned, dataset.column_metadata || []);

      return res.json({
        success: true,
        message: 'Dataset cleaning simulated and evaluated',
        data: {
          originalRows: records.length,
          cleanedRows: cleaned.length,
          originalQualityScore: dataset.data_quality_score,
          newQualityScore: newQuality.qualityScore,
          qualityReport: newQuality,
          preview: cleaned.slice(0, 10),
        },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const userId = req.user.id;
      const dataset = await dbService.getDataset(userId, req.params.id);
      if (!dataset) throw new NotFoundError('Dataset not found');
      await dbService.deleteDataset(userId, req.params.id);
      return res.json({
        success: true,
        message: 'Dataset deleted',
        data: { id: req.params.id },
        meta: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
