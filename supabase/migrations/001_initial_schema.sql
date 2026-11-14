-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Complete initial database schema for IntelliDecision AI
-- Target: Supabase Cloud PostgreSQL
-- Author: IntelliDecision AI Engineering Team
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. REUSABLE UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger for profiles
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile upon auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. DECISION PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.decision_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT NOT NULL,
    objective TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'analyzed', 'evaluated', 'decided', 'archived')),
    deadline TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trigger_decision_projects_updated_at ON public.decision_projects;
CREATE TRIGGER trigger_decision_projects_updated_at
    BEFORE UPDATE ON public.decision_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_decision_projects_user_id ON public.decision_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_projects_status ON public.decision_projects(status);
CREATE INDEX IF NOT EXISTS idx_decision_projects_domain ON public.decision_projects(domain);

-- 5. DATASETS TABLE
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    row_count BIGINT DEFAULT 0,
    column_metadata JSONB DEFAULT '[]'::jsonb,
    data_quality_score NUMERIC DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    source_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_datasets_project_id ON public.datasets(project_id);
CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);

-- 6. DATASET RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.dataset_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    row_number BIGINT NOT NULL,
    record_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dataset_records_dataset_id ON public.dataset_records(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_records_row_number ON public.dataset_records(dataset_id, row_number);

-- 7. DATA ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.data_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE SET NULL,
    analysis_type TEXT NOT NULL,
    analysis_results JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_analyses_project_id ON public.data_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_data_analyses_user_id ON public.data_analyses(user_id);

-- 8. ALTERNATIVES TABLE
CREATE TABLE IF NOT EXISTS public.alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    assumptions JSONB DEFAULT '[]'::jsonb,
    estimated_cost NUMERIC DEFAULT 0,
    expected_return NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trigger_alternatives_updated_at ON public.alternatives;
CREATE TRIGGER trigger_alternatives_updated_at
    BEFORE UPDATE ON public.alternatives
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_alternatives_project_id ON public.alternatives(project_id);
CREATE INDEX IF NOT EXISTS idx_alternatives_user_id ON public.alternatives(user_id);

-- 9. EVALUATION CRITERIA TABLE
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    direction TEXT NOT NULL CHECK (direction IN ('benefit', 'cost')),
    weight NUMERIC NOT NULL CHECK (weight >= 0 AND weight <= 100),
    data_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_project_id ON public.evaluation_criteria(project_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_user_id ON public.evaluation_criteria(user_id);

-- 10. ALTERNATIVE SCORES TABLE
CREATE TABLE IF NOT EXISTS public.alternative_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alternative_id UUID NOT NULL REFERENCES public.alternatives(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES public.evaluation_criteria(id) ON DELETE CASCADE,
    raw_value NUMERIC NOT NULL,
    normalized_score NUMERIC NOT NULL DEFAULT 0 CHECK (normalized_score >= 0 AND normalized_score <= 100),
    evidence_reference JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_alternative_criterion UNIQUE(alternative_id, criterion_id)
);

DROP TRIGGER IF EXISTS trigger_alternative_scores_updated_at ON public.alternative_scores;
CREATE TRIGGER trigger_alternative_scores_updated_at
    BEFORE UPDATE ON public.alternative_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_alternative_scores_alt ON public.alternative_scores(alternative_id);
CREATE INDEX IF NOT EXISTS idx_alternative_scores_crit ON public.alternative_scores(criterion_id);

-- 11. EVALUATION RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    methodology TEXT DEFAULT 'weighted_sum_model' NOT NULL,
    criteria_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
    alternative_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    rankings JSONB NOT NULL DEFAULT '[]'::jsonb,
    sensitivity_results JSONB DEFAULT '{}'::jsonb,
    calculation_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evaluation_results_project_id ON public.evaluation_results(project_id);

-- 12. RISK ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    alternative_id UUID REFERENCES public.alternatives(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    risk_title TEXT NOT NULL,
    risk_description TEXT,
    risk_category TEXT NOT NULL CHECK (risk_category IN ('financial', 'operational', 'market', 'resource', 'data', 'strategic', 'compliance', 'other')),
    likelihood NUMERIC CHECK (likelihood IS NULL OR (likelihood >= 1 AND likelihood <= 5)),
    impact NUMERIC NOT NULL CHECK (impact >= 1 AND impact <= 5),
    risk_score NUMERIC,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    evidence JSONB DEFAULT '[]'::jsonb,
    mitigation TEXT,
    uncertainty_level TEXT DEFAULT 'moderate' CHECK (uncertainty_level IN ('low', 'moderate', 'high', 'unknown')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_project_id ON public.risk_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_alt_id ON public.risk_assessments(alternative_id);

-- 13. AI RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommended_alternative_id UUID REFERENCES public.alternatives(id) ON DELETE SET NULL,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('strong', 'conditional', 'insufficient_evidence')),
    recommendation_summary TEXT NOT NULL,
    explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    supporting_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    risks JSONB NOT NULL DEFAULT '[]'::jsonb,
    assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    uncertainties JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'moderate', 'low', 'insufficient')),
    model_name TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    status TEXT DEFAULT 'generated',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_project_id ON public.ai_recommendations(project_id);

-- 14. FINAL DECISIONS TABLE
CREATE TABLE IF NOT EXISTS public.final_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_alternative_id UUID REFERENCES public.alternatives(id) ON DELETE SET NULL,
    recommendation_id UUID REFERENCES public.ai_recommendations(id) ON DELETE SET NULL,
    decision_status TEXT NOT NULL DEFAULT 'approved' CHECK (decision_status IN ('approved', 'rejected', 'modified', 'pending')),
    decision_reason TEXT NOT NULL,
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_final_decisions_project_id ON public.final_decisions(project_id);

-- 15. MONITORING METRICS TABLE
CREATE TABLE IF NOT EXISTS public.monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    expected_value NUMERIC NOT NULL,
    actual_value NUMERIC,
    unit TEXT,
    threshold NUMERIC DEFAULT 10,
    monitoring_frequency TEXT DEFAULT 'weekly',
    status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'warning', 'breached')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trigger_monitoring_metrics_updated_at ON public.monitoring_metrics;
CREATE TRIGGER trigger_monitoring_metrics_updated_at
    BEFORE UPDATE ON public.monitoring_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_project_id ON public.monitoring_metrics(project_id);

-- 16. MONITORING HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.monitoring_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL REFERENCES public.monitoring_metrics(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    observed_value NUMERIC NOT NULL,
    observation_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_monitoring_history_metric_id ON public.monitoring_history(metric_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_history_project_id ON public.monitoring_history(project_id);

-- 17. MONITORING ALERTS TABLE
CREATE TABLE IF NOT EXISTS public.monitoring_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_id UUID REFERENCES public.monitoring_metrics(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_project_id ON public.monitoring_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_user_id ON public.monitoring_alerts(user_id);

-- 18. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.decision_projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON public.activity_logs(project_id);

-- 19. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- 20. APPLICATION SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.application_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS trigger_application_settings_updated_at ON public.application_settings;
CREATE TRIGGER trigger_application_settings_updated_at
    BEFORE UPDATE ON public.application_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all user-owned tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alternative_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. DECISION PROJECTS POLICIES
CREATE POLICY "projects_select_own" ON public.decision_projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.decision_projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.decision_projects FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.decision_projects FOR DELETE USING (auth.uid() = user_id);

-- 3. DATASETS POLICIES
CREATE POLICY "datasets_select_own" ON public.datasets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "datasets_insert_own" ON public.datasets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "datasets_update_own" ON public.datasets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "datasets_delete_own" ON public.datasets FOR DELETE USING (auth.uid() = user_id);

-- 4. DATASET RECORDS POLICIES (Enforced through parent dataset ownership)
CREATE POLICY "dataset_records_select_own" ON public.dataset_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid())
);
CREATE POLICY "dataset_records_insert_own" ON public.dataset_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid())
);
CREATE POLICY "dataset_records_delete_own" ON public.dataset_records FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.datasets d WHERE d.id = dataset_id AND d.user_id = auth.uid())
);

-- 5. DATA ANALYSES POLICIES
CREATE POLICY "data_analyses_select_own" ON public.data_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "data_analyses_insert_own" ON public.data_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "data_analyses_update_own" ON public.data_analyses FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "data_analyses_delete_own" ON public.data_analyses FOR DELETE USING (auth.uid() = user_id);

-- 6. ALTERNATIVES POLICIES
CREATE POLICY "alternatives_select_own" ON public.alternatives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alternatives_insert_own" ON public.alternatives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alternatives_update_own" ON public.alternatives FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alternatives_delete_own" ON public.alternatives FOR DELETE USING (auth.uid() = user_id);

-- 7. EVALUATION CRITERIA POLICIES
CREATE POLICY "criteria_select_own" ON public.evaluation_criteria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "criteria_insert_own" ON public.evaluation_criteria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "criteria_update_own" ON public.evaluation_criteria FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "criteria_delete_own" ON public.evaluation_criteria FOR DELETE USING (auth.uid() = user_id);

-- 8. ALTERNATIVE SCORES POLICIES (Enforced through parent alternative ownership)
CREATE POLICY "scores_select_own" ON public.alternative_scores FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.alternatives a WHERE a.id = alternative_id AND a.user_id = auth.uid())
);
CREATE POLICY "scores_insert_own" ON public.alternative_scores FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.alternatives a WHERE a.id = alternative_id AND a.user_id = auth.uid())
);
CREATE POLICY "scores_update_own" ON public.alternative_scores FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.alternatives a WHERE a.id = alternative_id AND a.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.alternatives a WHERE a.id = alternative_id AND a.user_id = auth.uid())
);
CREATE POLICY "scores_delete_own" ON public.alternative_scores FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.alternatives a WHERE a.id = alternative_id AND a.user_id = auth.uid())
);

-- 9. EVALUATION RESULTS POLICIES
CREATE POLICY "evaluation_results_select_own" ON public.evaluation_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "evaluation_results_insert_own" ON public.evaluation_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evaluation_results_update_own" ON public.evaluation_results FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evaluation_results_delete_own" ON public.evaluation_results FOR DELETE USING (auth.uid() = user_id);

-- 10. RISK ASSESSMENTS POLICIES
CREATE POLICY "risk_assessments_select_own" ON public.risk_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "risk_assessments_insert_own" ON public.risk_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "risk_assessments_update_own" ON public.risk_assessments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "risk_assessments_delete_own" ON public.risk_assessments FOR DELETE USING (auth.uid() = user_id);

-- 11. AI RECOMMENDATIONS POLICIES
CREATE POLICY "ai_recommendations_select_own" ON public.ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ai_recommendations_insert_own" ON public.ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_recommendations_update_own" ON public.ai_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_recommendations_delete_own" ON public.ai_recommendations FOR DELETE USING (auth.uid() = user_id);

-- 12. FINAL DECISIONS POLICIES
CREATE POLICY "final_decisions_select_own" ON public.final_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "final_decisions_insert_own" ON public.final_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "final_decisions_update_own" ON public.final_decisions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "final_decisions_delete_own" ON public.final_decisions FOR DELETE USING (auth.uid() = user_id);

-- 13. MONITORING METRICS POLICIES
CREATE POLICY "monitoring_metrics_select_own" ON public.monitoring_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monitoring_metrics_insert_own" ON public.monitoring_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monitoring_metrics_update_own" ON public.monitoring_metrics FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monitoring_metrics_delete_own" ON public.monitoring_metrics FOR DELETE USING (auth.uid() = user_id);

-- 14. MONITORING HISTORY POLICIES
CREATE POLICY "monitoring_history_select_own" ON public.monitoring_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monitoring_history_insert_own" ON public.monitoring_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monitoring_history_delete_own" ON public.monitoring_history FOR DELETE USING (auth.uid() = user_id);

-- 15. MONITORING ALERTS POLICIES
CREATE POLICY "monitoring_alerts_select_own" ON public.monitoring_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "monitoring_alerts_insert_own" ON public.monitoring_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monitoring_alerts_update_own" ON public.monitoring_alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "monitoring_alerts_delete_own" ON public.monitoring_alerts FOR DELETE USING (auth.uid() = user_id);

-- 16. ACTIVITY LOGS POLICIES
CREATE POLICY "activity_logs_select_own" ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_logs_insert_own" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 17. NOTIFICATIONS POLICIES
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- 18. APPLICATION SETTINGS POLICIES (Read-only for public settings, server-side bypass with service role)
CREATE POLICY "application_settings_public_read" ON public.application_settings FOR SELECT USING (
    setting_key LIKE 'public_%'
);

-- ============================================================================
-- INITIAL APPLICATION CONFIGURATION SEED DATA (SAFE & IDEMPOTENT)
-- ============================================================================

INSERT INTO public.application_settings (setting_key, setting_value, description)
VALUES
(
    'public_decision_domains',
    '[
        {"id": "business", "name": "Business & Strategy", "description": "Market expansion, capital investments, resource allocation, and operational pivots."},
        {"id": "healthcare", "name": "Healthcare Administration", "description": "Hospital resource planning, equipment allocation, and operational capacity."},
        {"id": "education", "name": "Education", "description": "Curriculum planning, campus resource allocation, and institutional performance."},
        {"id": "agriculture", "name": "Agriculture", "description": "Crop selection, weather adaptation, yield planning, and equipment investment."},
        {"id": "supply_chain", "name": "Supply Chain & Logistics", "description": "Vendor comparison, inventory planning, freight procurement, and network optimization."},
        {"id": "personal_finance", "name": "Personal Finance", "description": "Budget allocation, savings strategy, debt management, and asset comparisons."},
        {"id": "general", "name": "General / Custom", "description": "Multi-criteria decision modeling for bespoke strategic problems."}
    ]'::jsonb,
    'Configured default decision domains available in the platform'
),
(
    'public_risk_thresholds',
    '{
        "scale": "1-5",
        "formula": "likelihood * impact",
        "max_score": 25,
        "levels": {
            "low": {"min": 1, "max": 5, "color": "emerald"},
            "moderate": {"min": 6, "max": 10, "color": "amber"},
            "high": {"min": 11, "max": 15, "color": "orange"},
            "critical": {"min": 16, "max": 25, "color": "rose"}
        }
    }'::jsonb,
    'Deterministic risk scoring methodology and categorization thresholds'
),
(
    'public_evaluation_methodology',
    '{
        "method": "weighted_sum_model",
        "scale": [0, 100],
        "normalization": {
            "benefit": "(value - min) / (max - min) * 100",
            "cost": "(max - value) / (max - min) * 100"
        },
        "weight_constraint": "sum(weights) == 100"
    }'::jsonb,
    'Multi-criteria decision analysis normalization and scoring formulas'
),
(
    'public_monitoring_defaults',
    '{
        "default_threshold_percent": 10.0,
        "supported_frequencies": ["daily", "weekly", "biweekly", "monthly", "quarterly"],
        "auto_alert_trigger": true
    }'::jsonb,
    'Default monitoring parameters and threshold trigger settings'
)
ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();
