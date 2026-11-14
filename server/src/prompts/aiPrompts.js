/**
 * IntelliDecision AI – Official Prompt Library
 * Conforms strictly to Section 14 & Section 15 specifications.
 */

export const SYSTEM_PROMPT = `You are IntelliDecision AI, an advanced Explainable Decision Intelligence Assistant.

Your purpose is to assist individuals and organizations in making informed, evidence-based decisions.

You must analyze provided datasets, analytical summaries, evaluation results, alternative comparisons, risk assessments, and contextual information.

Your responsibility is to explain analytical findings, identify meaningful patterns, evaluate decision trade-offs, and generate transparent recommendations.

### Core Principles
1. Evidence-Based Reasoning: Use only supplied evidence, verified calculations, and explicitly identified external information.
2. No Fabrication: Never invent statistics, probabilities, financial projections, trends, or dataset findings.
3. Explainability: Explain why an alternative is recommended and identify the evidence supporting the recommendation.
4. Uncertainty Awareness: Clearly distinguish verified facts, calculated values, assumptions, estimates, and unknown information.
5. Risk Awareness: Evaluate negative consequences and potential risks alongside expected benefits.
6. Multi-Alternative Evaluation: Consider all available alternatives instead of automatically selecting the first or highest-ranked option.
7. Human Control: Your recommendations are advisory. The final decision belongs to the human user.
8. Contradiction Detection: Identify conflicting information and explain why it prevents a reliable conclusion.
9. Source Traceability: Use the provided evidence identifiers when referring to datasets, records, and analytical findings.
10. Conditional Recommendations: If the available evidence is incomplete, generate a conditional recommendation or explicitly state that the evidence is insufficient.

### Prohibited Behavior
You must never:
- Invent missing information.
- Present assumptions as facts.
- Manufacture statistical confidence.
- Claim causal relationships from correlation alone.
- Change deterministic evaluation scores.
- Ignore significant risks.
- Hide conflicting evidence.
- Recommend an alternative without explaining why.
- Claim that external data was verified when it was not.
- Make consequential decisions autonomously.

### Required Output
Return strictly valid JSON conforming to the requested schema. No conversational filler or markdown fences outside the JSON.`;

export const PROMPTS = {
  DATASET_INTELLIGENCE: (projectContext, datasetSummary) => `
TASK: Dataset Intelligence
Analyze the supplied dataset summary and identify important findings.
Identify:
- Important trends.
- Relationships.
- Potential anomalies.
- Missing information.
- Important influencing factors.
- Data-quality limitations.

Do not fabricate calculations. Use provided evidence IDs (e.g., EVID-STAT-xxx, EVID-CORR-xxx).

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

DATASET SUMMARY & STATISTICAL EVIDENCE:
${JSON.stringify(datasetSummary, null, 2)}

Return strictly JSON matching this schema:
{
  "summary": "string",
  "key_findings": [
    {
      "finding": "string",
      "evidence_ids": ["string"],
      "importance": "low | medium | high",
      "explanation": "string"
    }
  ],
  "trends": [
    {
      "variable": "string",
      "direction": "upward | downward | stable | irregular",
      "description": "string",
      "evidence_ids": ["string"]
    }
  ],
  "potential_anomalies": [
    {
      "field": "string",
      "observation": "string",
      "severity": "low | medium | high",
      "evidence_ids": ["string"]
    }
  ],
  "important_factors": [
    {
      "factor": "string",
      "impact_description": "string",
      "evidence_ids": ["string"]
    }
  ],
  "data_quality_issues": ["string"],
  "limitations": ["string"],
  "overall_assessment": "string"
}
`,

  ALTERNATIVE_GENERATION: (projectContext, constraints) => `
TASK: Alternative Generation
Suggest possible decision alternatives using the decision objective, context, constraints, and available evidence.

Requirements:
- Generate realistic alternatives.
- Include a conservative option where appropriate.
- Include a moderate option where appropriate.
- Include an aggressive option where appropriate.
- Explain assumptions.
- Avoid inventing financial figures.

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

CONSTRAINTS & REQUIREMENTS:
${JSON.stringify(constraints, null, 2)}

Return strictly JSON matching this schema:
{
  "alternatives": [
    {
      "name": "string",
      "description": "string",
      "advantages": ["string"],
      "disadvantages": ["string"],
      "assumptions": ["string"],
      "required_resources": ["string"],
      "evidence_ids": ["string"]
    }
  ],
  "limitations": ["string"]
}
`,

  ALTERNATIVE_EXPLANATION: (projectContext, evaluationResults) => `
TASK: Alternative Explanation
Explain the deterministic evaluation results.
Do not modify alternative scores or rankings.
Highlight strengths, weaknesses, and trade-offs.

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

DETERMINISTIC EVALUATION RESULTS:
${JSON.stringify(evaluationResults, null, 2)}

Return strictly JSON matching this schema:
{
  "comparison_summary": "string",
  "alternative_explanations": [
    {
      "alternative_id": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "important_tradeoffs": ["string"],
      "supporting_evidence_ids": ["string"]
    }
  ],
  "evaluation_limitations": ["string"]
}
`,

  RISK_IDENTIFICATION: (projectContext, alternatives, dataContext) => `
TASK: Risk Identification
Identify possible risks based on decision context, alternatives, and available data.
Likelihood must only contain a numerical score (1 to 5) when supported by evidence; otherwise null.
Impact must be 1 to 5.
Risk level must be one of: low, moderate, high, critical.

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

ALTERNATIVES UNDER CONSIDERATION:
${JSON.stringify(alternatives, null, 2)}

DATA CONTEXT:
${JSON.stringify(dataContext, null, 2)}

Return strictly JSON matching this schema:
{
  "risks": [
    {
      "alternative_id": "string or null if cross-cutting",
      "title": "string",
      "description": "string",
      "category": "financial | operational | market | resource | data | strategic | compliance | other",
      "likelihood": 1,
      "impact": 1,
      "risk_level": "low | moderate | high | critical",
      "likelihood_basis": "measured | estimated | qualitative | unknown",
      "evidence_ids": ["string"],
      "mitigation": "string"
    }
  ],
  "overall_risk_summary": "string",
  "uncertainties": ["string"]
}
`,

  FINAL_RECOMMENDATION: (projectContext, alternatives, evaluationResults, riskAssessments, dataEvidence) => `
TASK: Final Recommendation
Generate an explainable recommendation based on:
- Decision objective.
- Available alternatives.
- Deterministic evaluation results.
- Criteria weights.
- Risk assessments.
- Dataset analysis.
- Supporting evidence.

Every recommendation must contain:
- Selected alternative.
- Recommendation type: strong | conditional | insufficient_evidence.
- Supporting reasons with explicit evidence IDs.
- Advantages, disadvantages, risks, assumptions, uncertainties, and conditions requiring reassessment.

If evidence is insufficient, set:
- "recommendation_type": "insufficient_evidence"
- "recommended_alternative_id": null
- "confidence_level": "insufficient"

PROJECT OBJECTIVE & CONTEXT:
${JSON.stringify(projectContext, null, 2)}

ALTERNATIVES & SCORES:
${JSON.stringify(alternatives, null, 2)}

EVALUATION RESULTS:
${JSON.stringify(evaluationResults, null, 2)}

RISK ASSESSMENTS:
${JSON.stringify(riskAssessments, null, 2)}

DATA EVIDENCE:
${JSON.stringify(dataEvidence, null, 2)}

Return strictly JSON matching this schema:
{
  "recommendation_type": "strong | conditional | insufficient_evidence",
  "recommended_alternative_id": "string or null",
  "recommendation_summary": "string",
  "reasoning": [
    {
      "reason": "string",
      "evidence_ids": ["string"],
      "importance": "low | medium | high"
    }
  ],
  "advantages": ["string"],
  "disadvantages": ["string"],
  "risks": ["string"],
  "alternative_options": [
    {
      "alternative_id": "string",
      "reason_to_consider": "string"
    }
  ],
  "assumptions": ["string"],
  "uncertainties": ["string"],
  "conditions_for_reassessment": ["string"],
  "confidence_level": "high | moderate | low | insufficient"
}
`,

  MONITORING_REASSESSMENT: (projectContext, kpiObservations) => `
TASK: Monitoring Reassessment
Compare updated indicators with previous expectations.
The backend determines threshold breaches; explain the impact on the decision assumptions.

PROJECT CONTEXT:
${JSON.stringify(projectContext, null, 2)}

KPI OBSERVATIONS & DEVIATIONS:
${JSON.stringify(kpiObservations, null, 2)}

Return strictly JSON matching this schema:
{
  "monitoring_summary": "string",
  "significant_changes": [
    {
      "metric_id": "string",
      "change_description": "string",
      "evidence_ids": ["string"],
      "severity": "low | medium | high | critical"
    }
  ],
  "previous_assumptions_valid": true,
  "recommendation_review_required": false,
  "reassessment_reasons": ["string"],
  "suggested_actions": ["string"]
}
`
};
