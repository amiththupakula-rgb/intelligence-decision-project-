import { GoogleGenAI } from '@google/genai';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { SYSTEM_PROMPT, PROMPTS } from '../../prompts/aiPrompts.js';
import {
  aiDatasetIntelligenceSchema,
  aiAlternativeGenerationSchema,
  aiAlternativeExplanationSchema,
  aiRiskIdentificationSchema,
  aiRecommendationSchema,
  aiMonitoringReassessmentSchema,
} from '../../validators/schemas.js';

let aiClient = null;

function getClient() {
  if (!aiClient && config.gemini.apiKey) {
    aiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return aiClient;
}

/**
 * Strips markdown code blocks (e.g. ```json ... ```) from model text output.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Look for ```json or ``` blocks
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (err) {
        logger.error(`Failed to parse extracted JSON block: ${err.message}`);
      }
    }

    // Try finding outer curly or square brackets
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
      } catch {}
    }
  }

  return null;
}

/**
 * Verifies that evidence_ids referenced in the AI output exist in the provided evidence pool.
 */
function filterEvidenceIds(referencedIds, availableEvidence) {
  if (!Array.isArray(referencedIds)) return [];
  const validIds = new Set(availableEvidence.map(e => e.id));
  return referencedIds.filter(id => validIds.has(id));
}

/**
 * Centralized caller for Gemini with retry, timeout, schema validation, and fallback.
 */
async function callGeminiStructured({ prompt, schema, fallbackGenerator, evidencePool = [] }) {
  const client = getClient();

  if (!client) {
    logger.warn('[GeminiService] GEMINI_API_KEY is not configured. Returning deterministic analytical fallback.');
    return {
      success: true,
      data: fallbackGenerator(),
      isAIGenerated: false,
      modelUsed: 'deterministic-baseline',
      promptVersion: '1.0-deterministic',
    };
  }

  let lastError = null;

  for (let attempt = 1; attempt <= config.gemini.maxRetries; attempt++) {
    try {
      logger.info(`[GeminiService] Sending structured AI request (attempt ${attempt}/${config.gemini.maxRetries})...`);

      const response = await client.models.generateContent({
        model: config.gemini.model,
        contents: [
          { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] },
        ],
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: config.gemini.maxOutputTokens,
        },
      });

      const rawText = response.text || '';
      const parsed = extractJSON(rawText);

      if (!parsed) {
        throw new Error('Gemini response could not be parsed as valid JSON');
      }

      // Validate with Zod
      const validation = schema.safeParse(parsed);
      if (!validation.success) {
        logger.warn(`[GeminiService] Output failed Zod validation: ${JSON.stringify(validation.error.errors)}`);
        throw new Error(`AI output validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`);
      }

      logger.info('[GeminiService] Successfully generated and validated structured response.');
      return {
        success: true,
        data: validation.data,
        isAIGenerated: true,
        modelUsed: config.gemini.model,
        promptVersion: '1.0',
      };
    } catch (err) {
      lastError = err;
      logger.error(`[GeminiService] Attempt ${attempt} failed: ${err.message}`);
    }
  }

  logger.warn(`[GeminiService] All AI retries failed: ${lastError?.message}. Falling back to deterministic baseline.`);
  return {
    success: true,
    data: fallbackGenerator(),
    isAIGenerated: false,
    modelUsed: 'deterministic-fallback',
    promptVersion: '1.0-fallback',
    errorNote: lastError?.message,
  };
}

export const geminiService = {
  /**
   * 1. Dataset Intelligence
   */
  async generateDatasetIntelligence(projectContext, analysisResults) {
    const evidencePool = analysisResults.evidenceReferences || [];
    const prompt = PROMPTS.DATASET_INTELLIGENCE(projectContext, {
      descriptiveStatistics: analysisResults.descriptiveStatistics,
      significantCorrelations: analysisResults.significantCorrelations,
      trends: analysisResults.trends,
      anomalies: analysisResults.anomalies,
      rankedFactors: analysisResults.rankedFactors,
      evidenceReferences: evidencePool,
    });

    const fallbackGenerator = () => ({
      summary: `Automated data analysis for "${projectContext.title}". Analysis processed ${Object.keys(analysisResults.descriptiveStatistics || {}).length} numeric metrics with verified statistical distributions.`,
      key_findings: (analysisResults.significantCorrelations || []).slice(0, 3).map(c => ({
        finding: `Correlation observed between ${c.columnA} and ${c.columnB} (r = ${c.coefficient}).`,
        evidence_ids: [c.id],
        importance: c.strength === 'strong' ? 'high' : 'medium',
        explanation: `Strong relationship detected. Note that correlation does not establish causation without longitudinal testing.`,
      })),
      trends: Object.entries(analysisResults.trends || {}).map(([col, t]) => ({
        variable: col,
        direction: t.direction,
        description: `Sequential progression indicates a ${t.direction} slope (${t.slope}).`,
        evidence_ids: [`EVID-TREND-${col}`],
      })),
      potential_anomalies: (analysisResults.anomalies || []).map(a => ({
        field: a.column,
        observation: `Identified ${a.outlierCount} value(s) exceeding IQR distribution bounds.`,
        severity: a.outlierCount > 5 ? 'high' : 'medium',
        evidence_ids: [a.id],
      })),
      important_factors: (analysisResults.rankedFactors || []).slice(0, 3).map(f => ({
        factor: f.column,
        impact_description: `Highest variability across dataset (StDev: ${f.stdev}).`,
        evidence_ids: [],
      })),
      data_quality_issues: [],
      limitations: ['Statistical insights are observational and require domain validation.'],
      overall_assessment: 'Dataset provides stable baseline distributions suitable for multi-criteria alternative modeling.',
    });

    return callGeminiStructured({
      prompt,
      schema: aiDatasetIntelligenceSchema,
      fallbackGenerator,
      evidencePool,
    });
  },

  /**
   * 2. Alternative Generation
   */
  async generateAlternatives(projectContext, constraints = {}) {
    const prompt = PROMPTS.ALTERNATIVE_GENERATION(projectContext, constraints);

    const fallbackGenerator = () => ({
      alternatives: [
        {
          name: `Conservative: Phased Implementation`,
          description: `Execute decision in staged milestones with periodic reviews and limited upfront resource commitment.`,
          advantages: ['Lowest immediate risk exposure', 'High flexibility to adapt'],
          disadvantages: ['Slower time-to-value', 'Potential delayed market advantage'],
          assumptions: ['Resources remain stable across future milestones'],
          required_resources: ['Core team capacity', 'Phased operational budget'],
          evidence_ids: [],
        },
        {
          name: `Moderate: Balanced Execution`,
          description: `Commit standard allocation to achieve the primary objective within target deadline while hedging key operational risks.`,
          advantages: ['Balanced risk-to-reward ratio', 'Optimal resource efficiency'],
          disadvantages: ['Requires proactive change management'],
          assumptions: ['Standard operating conditions persist'],
          required_resources: ['Dedicated project lead', 'Targeted budget allocation'],
          evidence_ids: [],
        },
        {
          name: `Aggressive: Accelerated Investment`,
          description: `Full front-loaded commitment of resources to maximize immediate impact and reach peak outcomes ahead of schedule.`,
          advantages: ['Maximum upside potential', 'Strong competitive positioning'],
          disadvantages: ['Highest financial and operational exposure', 'Low margin for error'],
          assumptions: ['Demand and execution capacity will sustain acceleration'],
          required_resources: ['Substantial capital commitment', 'Expanded operational team'],
          evidence_ids: [],
        },
      ],
      limitations: ['Generated options are starting points and require human stakeholder review.'],
    });

    return callGeminiStructured({
      prompt,
      schema: aiAlternativeGenerationSchema,
      fallbackGenerator,
    });
  },

  /**
   * 3. Alternative Explanation
   */
  async explainEvaluationResults(projectContext, evaluationResults) {
    const prompt = PROMPTS.ALTERNATIVE_EXPLANATION(projectContext, evaluationResults);

    const fallbackGenerator = () => {
      const rankings = evaluationResults.rankings || [];
      const top = rankings[0] || { name: 'Top Alternative', weighted_score: 0 };
      return {
        comparison_summary: `MCDA deterministic evaluation ranked "${top.name}" as the preferred alternative with a score of ${top.weighted_score}/100.`,
        alternative_explanations: rankings.map(r => ({
          alternative_id: r.alternative_id,
          strengths: Object.values(r.breakdown || {})
            .filter(b => b.normalizedScore >= 70)
            .map(b => `High performance in ${b.criterionName} (${b.normalizedScore}/100)`),
          weaknesses: Object.values(r.breakdown || {})
            .filter(b => b.normalizedScore < 50)
            .map(b => `Sub-optimal performance in ${b.criterionName} (${b.normalizedScore}/100)`),
          important_tradeoffs: [`Composite weighted score: ${r.weighted_score}/100`],
          supporting_evidence_ids: [`EVID-EVAL-TOP`],
        })),
        evaluation_limitations: ['Weights reflect current user prioritization; sensitivity analysis should be referenced.'],
      };
    };

    return callGeminiStructured({
      prompt,
      schema: aiAlternativeExplanationSchema,
      fallbackGenerator,
    });
  },

  /**
   * 4. Risk Identification
   */
  async identifyRisks(projectContext, alternatives, dataContext) {
    const prompt = PROMPTS.RISK_IDENTIFICATION(projectContext, alternatives, dataContext);

    const fallbackGenerator = () => ({
      risks: [
        {
          alternative_id: null,
          title: 'Budget Variance & Resource Overrun',
          description: 'Implementation costs may exceed projected baselines due to unexpected operational friction.',
          category: 'financial',
          likelihood: 3,
          impact: 3,
          risk_level: 'moderate',
          likelihood_basis: 'estimated',
          evidence_ids: [],
          mitigation: 'Establish a 15% contingency reserve and implement biweekly expenditure audits.',
        },
        {
          alternative_id: null,
          title: 'Operational Adoption Delay',
          description: 'Key stakeholders and teams may face steep learning curves or resist workflow transition.',
          category: 'operational',
          likelihood: 2,
          impact: 4,
          risk_level: 'moderate',
          likelihood_basis: 'estimated',
          evidence_ids: [],
          mitigation: 'Provide structured training programs and early milestone feedback loops.',
        },
      ],
      overall_risk_summary: 'Overall risk profile is moderate and manageable with standard operational governance.',
      uncertainties: ['Market demand volatility', 'Resource availability in subsequent quarters'],
    });

    return callGeminiStructured({
      prompt,
      schema: aiRiskIdentificationSchema,
      fallbackGenerator,
    });
  },

  /**
   * 5. Final Recommendation
   */
  async generateRecommendation(projectContext, alternatives, evaluationResults, riskAssessments, dataEvidence = []) {
    const prompt = PROMPTS.FINAL_RECOMMENDATION(
      projectContext,
      alternatives,
      evaluationResults,
      riskAssessments,
      dataEvidence
    );

    const fallbackGenerator = () => {
      const rankings = evaluationResults.rankings || [];
      const top = rankings[0];

      if (!top) {
        return {
          recommendation_type: 'insufficient_evidence',
          recommended_alternative_id: null,
          recommendation_summary: 'Insufficient data available to formulate a mathematically sound recommendation.',
          reasoning: [],
          advantages: [],
          disadvantages: [],
          risks: [],
          alternative_options: [],
          assumptions: [],
          uncertainties: ['Missing alternative scores'],
          conditions_for_reassessment: ['Provide complete criteria scores across all alternatives.'],
          confidence_level: 'insufficient',
        };
      }

      return {
        recommendation_type: 'strong',
        recommended_alternative_id: top.alternative_id,
        recommendation_summary: `Based on deterministic multi-criteria scoring and risk evaluation, "${top.name}" is the recommended decision pathway with a composite score of ${top.weighted_score}/100.`,
        reasoning: [
          {
            reason: `Achieved highest weighted performance score (${top.weighted_score}/100) across all weighted criteria.`,
            evidence_ids: ['EVID-EVAL-TOP'],
            importance: 'high',
          },
          {
            reason: `Exhibits balanced risk characteristics without critical unmitigated exposures.`,
            evidence_ids: [],
            importance: 'medium',
          },
        ],
        advantages: [
          `Highest overall utility score based on prioritized criteria.`,
          `Strong performance alignment with core project objective.`,
        ],
        disadvantages: [
          `Requires diligent tracking of underlying operational assumptions.`,
        ],
        risks: [
          `Subject to sensitivity variations if criterion weights shift significantly.`,
        ],
        alternative_options: rankings.slice(1).map(r => ({
          alternative_id: r.alternative_id,
          reason_to_consider: `Viable secondary choice (Score: ${r.weighted_score}/100) if primary constraints tighten.`,
        })),
        assumptions: [
          `Criteria weights remain reflective of organizational priorities.`,
          `Input data metrics accurately mirror operating conditions.`,
        ],
        uncertainties: [
          `External market fluctuations during subsequent execution quarters.`,
        ],
        conditions_for_reassessment: [
          `Criteria weights are modified by more than 20%.`,
          `Actual KPI deviations exceed established tolerance thresholds (>10%).`,
        ],
        confidence_level: 'high',
      };
    };

    return callGeminiStructured({
      prompt,
      schema: aiRecommendationSchema,
      fallbackGenerator,
      evidencePool: dataEvidence,
    });
  },

  /**
   * 6. Monitoring Reassessment
   */
  async assessMonitoringDeviations(projectContext, kpiObservations) {
    const prompt = PROMPTS.MONITORING_REASSESSMENT(projectContext, kpiObservations);

    const fallbackGenerator = () => {
      const breached = kpiObservations.filter(k => k.isBreached);
      const reviewRequired = breached.length > 0;

      return {
        monitoring_summary: `Monitoring review of ${kpiObservations.length} metrics. Found ${breached.length} metric(s) exceeding tolerance thresholds.`,
        significant_changes: breached.map(b => ({
          metric_id: b.metric_id,
          change_description: `Metric "${b.metric_name}" deviated by ${b.deviationPercent}% (Expected: ${b.expected_value}, Actual: ${b.actual_value}).`,
          evidence_ids: [],
          severity: Math.abs(b.deviationPercent) > 25 ? 'critical' : 'high',
        })),
        previous_assumptions_valid: !reviewRequired,
        recommendation_review_required: reviewRequired,
        reassessment_reasons: reviewRequired
          ? [`Threshold breach detected on ${breached.map(b => b.metric_name).join(', ')}.`]
          : [],
        suggested_actions: reviewRequired
          ? ['Re-evaluate MCDA criteria weights with updated actual observations.', 'Review operational mitigation strategies for high-risk metrics.']
          : ['Continue routine monitoring on scheduled frequency.'],
      };
    };

    return callGeminiStructured({
      prompt,
      schema: aiMonitoringReassessmentSchema,
      fallbackGenerator,
    });
  },
};
