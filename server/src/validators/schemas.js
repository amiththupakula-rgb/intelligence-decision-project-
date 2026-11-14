import { z } from 'zod';

// ============================================================================
// 1. AUTHENTICATION & PROFILE SCHEMAS
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  avatar_url: z.string().url().optional().nullable(),
});

// ============================================================================
// 2. PROJECT SCHEMAS
// ============================================================================

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional().default(''),
  domain: z.enum([
    'business',
    'healthcare',
    'education',
    'agriculture',
    'supply_chain',
    'personal_finance',
    'general'
  ]),
  objective: z.string().min(5, 'Objective must be at least 5 characters'),
  context: z.record(z.any()).optional().default({}),
  deadline: z.string().datetime().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['draft', 'active', 'analyzed', 'evaluated', 'decided', 'archived']).optional(),
});

// ============================================================================
// 3. ALTERNATIVE SCHEMAS
// ============================================================================

export const createAlternativeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  description: z.string().max(2000).optional().default(''),
  assumptions: z.array(z.string()).optional().default([]),
  estimated_cost: z.number().nonnegative().optional().default(0),
  expected_return: z.number().optional().default(0),
  metadata: z.record(z.any()).optional().default({}),
});

export const updateAlternativeSchema = createAlternativeSchema.partial();

// ============================================================================
// 4. EVALUATION CRITERIA SCHEMAS
// ============================================================================

export const createCriterionSchema = z.object({
  name: z.string().min(2, 'Criterion name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().default(''),
  direction: z.enum(['benefit', 'cost']),
  weight: z.number().min(0, 'Weight must be non-negative').max(100, 'Weight cannot exceed 100'),
  data_source: z.string().max(200).optional(),
});

export const updateCriterionSchema = createCriterionSchema.partial();

export const scoreMatrixSchema = z.object({
  scores: z.array(
    z.object({
      alternative_id: z.string().uuid(),
      criterion_id: z.string().uuid(),
      raw_value: z.number(),
      evidence_reference: z.record(z.any()).optional(),
    })
  ).min(1, 'At least one score required'),
});

// ============================================================================
// 5. RISK ASSESSMENT SCHEMAS
// ============================================================================

export const createRiskSchema = z.object({
  alternative_id: z.string().uuid().optional().nullable(),
  risk_title: z.string().min(3).max(200),
  risk_description: z.string().max(2000).optional().default(''),
  risk_category: z.enum([
    'financial',
    'operational',
    'market',
    'resource',
    'data',
    'strategic',
    'compliance',
    'other',
  ]),
  likelihood: z.number().min(1).max(5).optional().nullable(),
  impact: z.number().min(1).max(5),
  mitigation: z.string().max(2000).optional().default(''),
  uncertainty_level: z.enum(['low', 'moderate', 'high', 'unknown']).optional().default('moderate'),
  evidence: z.array(z.string()).optional().default([]),
});

export const updateRiskSchema = createRiskSchema.partial();

// ============================================================================
// 6. FINAL DECISION SCHEMAS
// ============================================================================

export const createDecisionSchema = z.object({
  selected_alternative_id: z.string().uuid(),
  recommendation_id: z.string().uuid().optional().nullable(),
  decision_status: z.enum(['approved', 'rejected', 'modified', 'pending']),
  decision_reason: z.string().min(5, 'Decision rationale must be provided'),
});

// ============================================================================
// 7. MONITORING SCHEMAS
// ============================================================================

export const createMetricSchema = z.object({
  metric_name: z.string().min(2).max(100),
  expected_value: z.number(),
  actual_value: z.number().optional().nullable(),
  unit: z.string().max(20).optional().default(''),
  threshold: z.number().min(0).max(100).optional().default(10), // % threshold deviation
  monitoring_frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly']).optional().default('weekly'),
  metadata: z.record(z.any()).optional().default({}),
});

export const recordObservationSchema = z.object({
  observed_value: z.number(),
  observation_date: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

// ============================================================================
// 8. STRICT AI OUTPUT VALIDATION SCHEMAS (Section 15 & 16)
// ============================================================================

export const aiDatasetIntelligenceSchema = z.object({
  summary: z.string().min(10),
  key_findings: z.array(
    z.object({
      finding: z.string(),
      evidence_ids: z.array(z.string()).default([]),
      importance: z.enum(['low', 'medium', 'high']),
      explanation: z.string(),
    })
  ).default([]),
  trends: z.array(
    z.object({
      variable: z.string().optional(),
      direction: z.string().optional(),
      description: z.string(),
      evidence_ids: z.array(z.string()).default([]),
    })
  ).default([]),
  potential_anomalies: z.array(
    z.object({
      field: z.string().optional(),
      observation: z.string(),
      severity: z.string().optional(),
      evidence_ids: z.array(z.string()).default([]),
    })
  ).default([]),
  important_factors: z.array(
    z.object({
      factor: z.string(),
      impact_description: z.string(),
      evidence_ids: z.array(z.string()).default([]),
    })
  ).default([]),
  data_quality_issues: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
  overall_assessment: z.string().min(5),
});

export const aiAlternativeGenerationSchema = z.object({
  alternatives: z.array(
    z.object({
      name: z.string().min(2),
      description: z.string().min(5),
      advantages: z.array(z.string()).default([]),
      disadvantages: z.array(z.string()).default([]),
      assumptions: z.array(z.string()).default([]),
      required_resources: z.array(z.string()).default([]),
      evidence_ids: z.array(z.string()).default([]),
    })
  ).min(1),
  limitations: z.array(z.string()).default([]),
});

export const aiAlternativeExplanationSchema = z.object({
  comparison_summary: z.string().min(10),
  alternative_explanations: z.array(
    z.object({
      alternative_id: z.string(),
      strengths: z.array(z.string()).default([]),
      weaknesses: z.array(z.string()).default([]),
      important_tradeoffs: z.array(z.string()).default([]),
      supporting_evidence_ids: z.array(z.string()).default([]),
    })
  ),
  evaluation_limitations: z.array(z.string()).default([]),
});

export const aiRiskIdentificationSchema = z.object({
  risks: z.array(
    z.object({
      alternative_id: z.string().nullable().optional(),
      title: z.string().min(3),
      description: z.string().min(5),
      category: z.enum([
        'financial',
        'operational',
        'market',
        'resource',
        'data',
        'strategic',
        'compliance',
        'other',
      ]),
      likelihood: z.number().min(1).max(5).nullable().optional(),
      impact: z.number().min(1).max(5),
      risk_level: z.enum(['low', 'moderate', 'high', 'critical']),
      likelihood_basis: z.enum(['measured', 'estimated', 'qualitative', 'unknown']).default('estimated'),
      evidence_ids: z.array(z.string()).default([]),
      mitigation: z.string().min(5),
    })
  ),
  overall_risk_summary: z.string(),
  uncertainties: z.array(z.string()).default([]),
});

export const aiRecommendationSchema = z.object({
  recommendation_type: z.enum(['strong', 'conditional', 'insufficient_evidence']),
  recommended_alternative_id: z.string().nullable(),
  recommendation_summary: z.string().min(10),
  reasoning: z.array(
    z.object({
      reason: z.string(),
      evidence_ids: z.array(z.string()).default([]),
      importance: z.enum(['low', 'medium', 'high']).default('high'),
    })
  ).default([]),
  advantages: z.array(z.string()).default([]),
  disadvantages: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  alternative_options: z.array(
    z.object({
      alternative_id: z.string(),
      reason_to_consider: z.string(),
    })
  ).default([]),
  assumptions: z.array(z.string()).default([]),
  uncertainties: z.array(z.string()).default([]),
  conditions_for_reassessment: z.array(z.string()).default([]),
  confidence_level: z.enum(['high', 'moderate', 'low', 'insufficient']),
});

export const aiMonitoringReassessmentSchema = z.object({
  monitoring_summary: z.string().min(10),
  significant_changes: z.array(
    z.object({
      metric_id: z.string(),
      change_description: z.string(),
      evidence_ids: z.array(z.string()).default([]),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
    })
  ).default([]),
  previous_assumptions_valid: z.boolean(),
  recommendation_review_required: z.boolean(),
  reassessment_reasons: z.array(z.string()).default([]),
  suggested_actions: z.array(z.string()).default([]),
});
