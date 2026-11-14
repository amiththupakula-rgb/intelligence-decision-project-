import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, createUserScopedClient } from '../../config/supabase.js';
import { pool } from '../../config/db.js';
import { logger } from '../../utils/logger.js';

// In-Memory Dev Store used when Supabase is not configured
const memStore = {
  profiles: new Map(),
  decision_projects: new Map(),
  datasets: new Map(),
  dataset_records: new Map(),
  data_analyses: new Map(),
  alternatives: new Map(),
  evaluation_criteria: new Map(),
  alternative_scores: new Map(),
  evaluation_results: new Map(),
  risk_assessments: new Map(),
  ai_recommendations: new Map(),
  final_decisions: new Map(),
  monitoring_metrics: new Map(),
  monitoring_history: new Map(),
  monitoring_alerts: new Map(),
  activity_logs: new Map(),
  notifications: new Map(),
  application_settings: new Map(),
};

// Seed initial application settings into memory store
memStore.application_settings.set('public_decision_domains', {
  id: uuidv4(),
  setting_key: 'public_decision_domains',
  setting_value: [
    { id: 'business', name: 'Business & Strategy', description: 'Capital investment, expansion, resource allocation, and operational pivots.' },
    { id: 'healthcare', name: 'Healthcare Administration', description: 'Hospital resources, equipment allocation, and patient capacity.' },
    { id: 'education', name: 'Education', description: 'Curriculum planning, campus resources, and institutional performance.' },
    { id: 'agriculture', name: 'Agriculture', description: 'Crop selection, weather adaptation, yield planning, and equipment investment.' },
    { id: 'supply_chain', name: 'Supply Chain & Logistics', description: 'Vendor comparison, inventory planning, freight procurement, and logistics.' },
    { id: 'personal_finance', name: 'Personal Finance', description: 'Budget allocation, savings strategy, debt management, and asset comparisons.' },
    { id: 'general', name: 'General / Custom', description: 'Multi-criteria decision modeling for bespoke strategic problems.' }
  ],
  created_at: new Date().toISOString(),
});

const SUPABASE_DEMO_USER_ID = '780618c4-593d-435b-a877-88502029f863';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveUserId(userId) {
  if (!userId || !UUID_REGEX.test(userId) || userId === '00000000-0000-0000-0000-000000000001') {
    return SUPABASE_DEMO_USER_ID;
  }
  return userId;
}

export const dbService = {
  isSupabaseConfigured() {
    return Boolean(supabaseAdmin);
  },

  /**
   * Profiles
   */
  async getProfile(userId) {
    const effectiveUserId = this.isSupabaseConfigured() ? resolveUserId(userId) : userId;
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', effectiveUserId).maybeSingle();
      if (!error && data) return data;
    }
    return memStore.profiles.get(effectiveUserId) || { id: effectiveUserId, full_name: 'Lead Decision Architect', avatar_url: null };
  },

  async updateProfile(userId, updates) {
    const effectiveUserId = this.isSupabaseConfigured() ? resolveUserId(userId) : userId;
    const data = { ...updates, updated_at: new Date().toISOString() };
    if (this.isSupabaseConfigured()) {
      const { data: res, error } = await supabaseAdmin.from('profiles').update(data).eq('id', effectiveUserId).select().single();
      if (!error) return res;
    }
    const existing = memStore.profiles.get(effectiveUserId) || { id: effectiveUserId };
    const updated = { ...existing, ...data };
    memStore.profiles.set(effectiveUserId, updated);
    return updated;
  },

  /**
   * Decision Projects
   */
  async listProjects(userId, filters = {}) {
    if (this.isSupabaseConfigured()) {
      const effectiveUserId = resolveUserId(userId);
      let query = supabaseAdmin.from('decision_projects').select('*').order('created_at', { ascending: false });
      query = query.or(`user_id.eq.${effectiveUserId},user_id.eq.${SUPABASE_DEMO_USER_ID}`);
      if (filters.domain) query = query.eq('domain', filters.domain);
      if (filters.status) query = query.eq('status', filters.status);
      const { data, error } = await query;
      if (!error && data) return data;
    }

    let items = Array.from(memStore.decision_projects.values()).filter(p => p.user_id === userId || p.user_id === SUPABASE_DEMO_USER_ID);
    if (filters.domain) items = items.filter(p => p.domain === filters.domain);
    if (filters.status) items = items.filter(p => p.status === filters.status);
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getProject(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('decision_projects').select('*').eq('id', projectId).maybeSingle();
      if (!error && data) return data;
    }
    const item = memStore.decision_projects.get(projectId);
    if (item) return item;
    return null;
  },

  async createProject(userId, projectData) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const effectiveUserId = this.isSupabaseConfigured() ? resolveUserId(userId) : userId;
    const newProject = {
      id,
      user_id: effectiveUserId,
      title: projectData.title,
      description: projectData.description || '',
      domain: projectData.domain,
      objective: projectData.objective,
      context: projectData.context || {},
      status: projectData.status || 'draft',
      deadline: projectData.deadline || null,
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('decision_projects').insert(newProject).select().single();
      if (!error && data) {
        memStore.decision_projects.set(id, data);
        return data;
      }
      logger.error(`[Supabase error creating project]: ${error?.message}`);
      if (error) {
        throw new Error(`Database error saving advisory to Supabase: ${error.message}`);
      }
    }

    memStore.decision_projects.set(id, newProject);
    return newProject;
  },

  async updateProject(userId, projectId, updates) {
    const now = new Date().toISOString();
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('decision_projects').update({ ...updates, updated_at: now }).eq('id', projectId).eq('user_id', userId).select().single();
      if (!error && data) return data;
    }
    const existing = await this.getProject(userId, projectId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: now };
    memStore.decision_projects.set(projectId, updated);
    return updated;
  },

  async deleteProject(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from('decision_projects').delete().eq('id', projectId).eq('user_id', userId);
      if (!error) return true;
    }
    memStore.decision_projects.delete(projectId);
    return true;
  },

  /**
   * Datasets & Records
   */
  async listDatasets(userId, projectId) {
    const effectiveUserId = this.isSupabaseConfigured() ? resolveUserId(userId) : userId;
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('datasets').select('*').eq('project_id', projectId).order('created_at', { ascending: false });
      if (!error && data && data.length > 0) return data;
    }
    return Array.from(memStore.datasets.values())
      .filter(d => d.project_id === projectId && (d.user_id === effectiveUserId || d.user_id === SUPABASE_DEMO_USER_ID))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getDataset(userId, datasetId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('datasets').select('*').eq('id', datasetId).maybeSingle();
      if (!error && data) return data;
    }
    const item = memStore.datasets.get(datasetId);
    if (item) return item;
    return null;
  },

  async createDataset(userId, projectId, datasetData, records = []) {
    const datasetId = uuidv4();
    const now = new Date().toISOString();
    const effectiveUserId = this.isSupabaseConfigured() ? resolveUserId(userId) : userId;
    const newDataset = {
      id: datasetId,
      project_id: projectId,
      user_id: effectiveUserId,
      name: datasetData.name,
      original_filename: datasetData.original_filename,
      storage_path: datasetData.storage_path || null,
      file_type: datasetData.file_type,
      file_size: datasetData.file_size,
      row_count: datasetData.row_count || records.length,
      column_metadata: datasetData.column_metadata || [],
      data_quality_score: datasetData.data_quality_score || 0,
      processing_status: 'completed',
      source_metadata: datasetData.source_metadata || {},
      created_at: now,
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('datasets').insert(newDataset).select().single();
      if (!error && data) {
        // Insert sample records in batches
        if (records.length > 0) {
          const rowsToInsert = records.slice(0, 1000).map((r, idx) => ({
            dataset_id: datasetId,
            row_number: idx + 1,
            record_data: r,
          }));
          await supabaseAdmin.from('dataset_records').insert(rowsToInsert);
        }
        memStore.datasets.set(datasetId, data);
        memStore.dataset_records.set(datasetId, records);
        return data;
      }
      logger.error(`[Supabase error creating dataset]: ${error?.message}`);
    }

    memStore.datasets.set(datasetId, newDataset);
    memStore.dataset_records.set(datasetId, records);
    return newDataset;
  },

  async getDatasetRecords(userId, datasetId, limit = 100) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('dataset_records').select('row_number, record_data').eq('dataset_id', datasetId).order('row_number', { ascending: true }).limit(limit);
      if (!error && data && data.length > 0) return data.map(d => d.record_data);
    }
    const records = memStore.dataset_records.get(datasetId) || [];
    return records.slice(0, limit);
  },

  async deleteDataset(userId, datasetId) {
    if (this.isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from('datasets').delete().eq('id', datasetId);
      if (!error) return true;
    }
    memStore.datasets.delete(datasetId);
    memStore.dataset_records.delete(datasetId);
    return true;
  },

  /**
   * Data Analyses
   */
  async listAnalyses(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('data_analyses').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return Array.from(memStore.data_analyses.values())
      .filter(a => a.project_id === projectId && a.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveAnalysis(userId, projectId, analysisData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      dataset_id: analysisData.dataset_id || null,
      analysis_type: analysisData.analysis_type || 'statistical_distribution',
      analysis_results: analysisData.analysis_results || {},
      evidence_references: analysisData.evidence_references || [],
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('data_analyses').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.data_analyses.set(id, record);
    return record;
  },

  /**
   * Alternatives
   */
  async listAlternatives(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('alternatives').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return Array.from(memStore.alternatives.values()).filter(a => a.project_id === projectId && a.user_id === userId);
  },

  async createAlternative(userId, projectId, altData) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      name: altData.name,
      description: altData.description || '',
      assumptions: altData.assumptions || [],
      estimated_cost: altData.estimated_cost || 0,
      expected_return: altData.expected_return || 0,
      metadata: altData.metadata || {},
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('alternatives').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.alternatives.set(id, record);
    return record;
  },

  async updateAlternative(userId, altId, updates) {
    const now = new Date().toISOString();
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('alternatives').update({ ...updates, updated_at: now }).eq('id', altId).eq('user_id', userId).select().single();
      if (!error && data) return data;
    }
    const existing = memStore.alternatives.get(altId);
    if (!existing || existing.user_id !== userId) return null;
    const updated = { ...existing, ...updates, updated_at: now };
    memStore.alternatives.set(altId, updated);
    return updated;
  },

  async deleteAlternative(userId, altId) {
    if (this.isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from('alternatives').delete().eq('id', altId).eq('user_id', userId);
      if (!error) return true;
    }
    memStore.alternatives.delete(altId);
    return true;
  },

  /**
   * Evaluation Criteria
   */
  async listCriteria(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('evaluation_criteria').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return Array.from(memStore.evaluation_criteria.values()).filter(c => c.project_id === projectId && c.user_id === userId);
  },

  async createCriterion(userId, projectId, critData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      name: critData.name,
      description: critData.description || '',
      direction: critData.direction,
      weight: critData.weight,
      data_source: critData.data_source || null,
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('evaluation_criteria').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.evaluation_criteria.set(id, record);
    return record;
  },

  async updateCriterion(userId, critId, updates) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('evaluation_criteria').update(updates).eq('id', critId).eq('user_id', userId).select().single();
      if (!error && data) return data;
    }
    const existing = memStore.evaluation_criteria.get(critId);
    if (!existing || existing.user_id !== userId) return null;
    const updated = { ...existing, ...updates };
    memStore.evaluation_criteria.set(critId, updated);
    return updated;
  },

  async deleteCriterion(userId, critId) {
    if (this.isSupabaseConfigured()) {
      const { error } = await supabaseAdmin.from('evaluation_criteria').delete().eq('id', critId).eq('user_id', userId);
      if (!error) return true;
    }
    memStore.evaluation_criteria.delete(critId);
    return true;
  },

  /**
   * Alternative Scores & Evaluation Results
   */
  async listScoresForProject(userId, projectId) {
    const alts = await this.listAlternatives(userId, projectId);
    const altIds = alts.map(a => a.id);
    if (altIds.length === 0) return [];

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('alternative_scores').select('*').in('alternative_id', altIds);
      if (!error && data) return data;
    }

    return Array.from(memStore.alternative_scores.values()).filter(s => altIds.includes(s.alternative_id));
  },

  async upsertScore(altId, critId, rawValue, normalizedScore = 0) {
    const key = `${altId}:${critId}`;
    const now = new Date().toISOString();
    const record = {
      id: uuidv4(),
      alternative_id: altId,
      criterion_id: critId,
      raw_value: rawValue,
      normalized_score: normalizedScore,
      evidence_reference: {},
      updated_at: now,
    };

    if (this.isSupabaseConfigured()) {
      await supabaseAdmin.from('alternative_scores').upsert(record, { onConflict: 'alternative_id,criterion_id' });
    }

    memStore.alternative_scores.set(key, record);
    return record;
  },

  async saveEvaluationResults(userId, projectId, evalData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      methodology: evalData.methodology,
      criteria_weights: evalData.criteriaWeights,
      alternative_scores: evalData.normalizedScores,
      rankings: evalData.rankings,
      sensitivity_results: evalData.sensitivityResults,
      calculation_metadata: { evaluated_at: new Date().toISOString() },
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('evaluation_results').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.evaluation_results.set(projectId, record);
    return record;
  },

  async getLatestEvaluation(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('evaluation_results').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!error && data) return data;
    }
    return memStore.evaluation_results.get(projectId) || null;
  },

  /**
   * Risk Assessments
   */
  async listRisks(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('risk_assessments').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return Array.from(memStore.risk_assessments.values()).filter(r => r.project_id === projectId && r.user_id === userId);
  },

  async createRisk(userId, projectId, riskData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      alternative_id: riskData.alternative_id || null,
      user_id: userId,
      risk_title: riskData.risk_title,
      risk_description: riskData.risk_description || '',
      risk_category: riskData.risk_category,
      likelihood: riskData.likelihood || 1,
      impact: riskData.impact,
      risk_score: (riskData.likelihood || 1) * riskData.impact,
      risk_level: riskData.risk_level || 'low',
      evidence: riskData.evidence || [],
      mitigation: riskData.mitigation || '',
      uncertainty_level: riskData.uncertainty_level || 'moderate',
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('risk_assessments').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.risk_assessments.set(id, record);
    return record;
  },

  async updateRisk(userId, riskId, updates) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('risk_assessments').update(updates).eq('id', riskId).eq('user_id', userId).select().single();
      if (!error && data) return data;
    }
    const existing = memStore.risk_assessments.get(riskId);
    if (!existing || existing.user_id !== userId) return null;
    const updated = { ...existing, ...updates };
    memStore.risk_assessments.set(riskId, updated);
    return updated;
  },

  /**
   * AI Recommendations
   */
  async listRecommendations(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('ai_recommendations').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return Array.from(memStore.ai_recommendations.values())
      .filter(r => r.project_id === projectId && r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async saveRecommendation(userId, projectId, recData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      recommended_alternative_id: recData.recommended_alternative_id,
      recommendation_type: recData.recommendation_type,
      recommendation_summary: recData.recommendation_summary,
      explanation: recData.explanation || {},
      supporting_evidence: recData.supporting_evidence || [],
      risks: recData.risks || [],
      assumptions: recData.assumptions || [],
      uncertainties: recData.uncertainties || [],
      confidence_level: recData.confidence_level,
      model_name: recData.model_name,
      prompt_version: recData.prompt_version,
      status: 'generated',
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('ai_recommendations').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.ai_recommendations.set(id, record);
    return record;
  },

  /**
   * Final Decisions
   */
  async listDecisions(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('final_decisions').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return Array.from(memStore.final_decisions.values()).filter(d => d.project_id === projectId && d.user_id === userId);
  },

  async createDecision(userId, projectId, decData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      selected_alternative_id: decData.selected_alternative_id,
      recommendation_id: decData.recommendation_id || null,
      decision_status: decData.decision_status,
      decision_reason: decData.decision_reason,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('final_decisions').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.final_decisions.set(id, record);
    // Also update project status to 'decided'
    await this.updateProject(userId, projectId, { status: 'decided' });
    return record;
  },

  /**
   * Monitoring Metrics & Alerts
   */
  async listMonitoringMetrics(userId, projectId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('monitoring_metrics').select('*').eq('project_id', projectId).eq('user_id', userId).order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return Array.from(memStore.monitoring_metrics.values()).filter(m => m.project_id === projectId && m.user_id === userId);
  },

  async createMonitoringMetric(userId, projectId, metricData) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      metric_name: metricData.metric_name,
      expected_value: metricData.expected_value,
      actual_value: metricData.actual_value || null,
      unit: metricData.unit || '',
      threshold: metricData.threshold || 10,
      monitoring_frequency: metricData.monitoring_frequency || 'weekly',
      status: 'normal',
      metadata: metricData.metadata || {},
      created_at: now,
      updated_at: now,
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('monitoring_metrics').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.monitoring_metrics.set(id, record);
    return record;
  },

  async updateMonitoringMetric(userId, metricId, updates) {
    const now = new Date().toISOString();
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('monitoring_metrics').update({ ...updates, updated_at: now }).eq('id', metricId).eq('user_id', userId).select().single();
      if (!error && data) return data;
    }
    const existing = memStore.monitoring_metrics.get(metricId);
    if (!existing || existing.user_id !== userId) return null;
    const updated = { ...existing, ...updates, updated_at: now };
    memStore.monitoring_metrics.set(metricId, updated);
    return updated;
  },

  async recordObservation(userId, metricId, projectId, observedValue, metadata = {}) {
    const id = uuidv4();
    const now = new Date().toISOString();
    const record = {
      id,
      metric_id: metricId,
      project_id: projectId,
      user_id: userId,
      observed_value: observedValue,
      observation_date: now,
      metadata,
    };

    if (this.isSupabaseConfigured()) {
      await supabaseAdmin.from('monitoring_history').insert(record);
    }

    memStore.monitoring_history.set(id, record);
    return record;
  },

  async listObservationsForMetric(metricId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('monitoring_history').select('*').eq('metric_id', metricId).order('observation_date', { ascending: true });
      if (!error && data) return data;
    }
    return Array.from(memStore.monitoring_history.values()).filter(h => h.metric_id === metricId);
  },

  async createAlert(userId, projectId, alertData) {
    const id = uuidv4();
    const record = {
      id,
      project_id: projectId,
      user_id: userId,
      metric_id: alertData.metric_id || null,
      alert_type: alertData.alert_type,
      severity: alertData.severity,
      message: alertData.message,
      acknowledged: false,
      created_at: new Date().toISOString(),
    };

    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('monitoring_alerts').insert(record).select().single();
      if (!error && data) return data;
    }

    memStore.monitoring_alerts.set(id, record);
    return record;
  },

  async listAlerts(userId, projectId = null) {
    if (this.isSupabaseConfigured()) {
      let q = supabaseAdmin.from('monitoring_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (!error && data) return data;
    }
    let list = Array.from(memStore.monitoring_alerts.values()).filter(a => a.user_id === userId);
    if (projectId) list = list.filter(a => a.project_id === projectId);
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async acknowledgeAlert(userId, alertId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('monitoring_alerts').update({ acknowledged: true }).eq('id', alertId).eq('user_id', userId).select().single();
      if (!error && data) return data;
    }
    const existing = memStore.monitoring_alerts.get(alertId);
    if (!existing || existing.user_id !== userId) return null;
    const updated = { ...existing, acknowledged: true };
    memStore.monitoring_alerts.set(alertId, updated);
    return updated;
  },

  /**
   * Activity Logs & Notifications
   */
  async logActivity(userId, projectId, action, description, metadata = {}) {
    const id = uuidv4();
    const record = {
      id,
      user_id: userId,
      project_id: projectId,
      action,
      description,
      metadata,
      created_at: new Date().toISOString(),
    };
    if (this.isSupabaseConfigured()) {
      await supabaseAdmin.from('activity_logs').insert(record);
    }
    memStore.activity_logs.set(id, record);
    return record;
  },

  async listRecentActivity(userId, limit = 10) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
      if (!error && data) return data;
    }
    return Array.from(memStore.activity_logs.values())
      .filter(l => l.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  },

  async listNotifications(userId) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return Array.from(memStore.notifications.values()).filter(n => n.user_id === userId);
  },

  async markNotificationRead(userId, notificationId) {
    if (this.isSupabaseConfigured()) {
      await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', notificationId).eq('user_id', userId);
    }
    const n = memStore.notifications.get(notificationId);
    if (n && n.user_id === userId) {
      n.is_read = true;
      memStore.notifications.set(notificationId, n);
    }
    return true;
  },
};
