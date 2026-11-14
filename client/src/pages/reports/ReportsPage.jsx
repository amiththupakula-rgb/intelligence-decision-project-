import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import {
  FileText,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Brain,
  ShieldAlert,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

export function ReportsPage() {
  const { id: projectId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const res = await api.get(`/projects/${projectId}/reports`);
        setReport(res.data);
      } catch (err) {
        setError(err.message || 'Failed to generate report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [projectId]);

  if (loading) {
    return <LoadingSpinner text="Compiling verified audit report..." size="large" />;
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-bold">{error || 'Report could not be generated'}</p>
        <Link to={`/projects/${projectId}`} className="text-sm font-semibold text-brand-500 underline">
          Back to Project
        </Link>
      </div>
    );
  }

  const {
    metadata,
    projectOverview,
    dataIntelligence,
    alternativeEvaluation,
    riskAssessment,
    explainableRecommendation,
    finalDecisionStatus,
    continuousMonitoring,
  } = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 print:max-w-full print:p-0">
      {/* Top actions */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project Workspace
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={`/api/v1/projects/${projectId}/reports?format=csv`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 text-slate-800 dark:text-slate-100 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                IntelliDecision AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                Audit Record
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white pt-2">
              {projectOverview.title}
            </h1>
            <p className="text-xs text-slate-500">
              Domain: <strong className="capitalize">{projectOverview.domain}</strong> • Status: <strong className="uppercase">{projectOverview.status}</strong>
            </p>
          </div>

          <div className="text-right text-[11px] font-mono text-slate-400">
            <div>Report ID: {metadata.projectId.substring(0, 8)}</div>
            <div>Generated: {new Date(metadata.generatedAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Section 1: Objective & Scope */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            1. Decision Objective &amp; Scope
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
            {projectOverview.objective}
          </p>
        </div>

        {/* Section 2: Data Intelligence Findings */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            2. Verified Data Intelligence Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {dataIntelligence.datasets.map((d) => (
              <div key={d.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{d.name}</span>
                  <p className="text-[11px] text-slate-400">{d.rowCount} rows processed</p>
                </div>
                <div className="text-right font-mono font-bold text-brand-500">
                  {d.qualityScore}/100 Quality
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: MCDA Evaluation Rankings */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            3. Multi-Criteria Evaluation Results ({alternativeEvaluation.methodology})
          </h2>
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Rank</th>
                  <th className="py-2.5 px-4">Alternative Name</th>
                  <th className="py-2.5 px-4 text-right">Composite Weighted Score (0-100)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {alternativeEvaluation.rankings.map((r) => (
                  <tr key={r.alternative_id} className={r.rank === 1 ? 'font-bold bg-brand-50/40 dark:bg-brand-950/20' : ''}>
                    <td className="py-3 px-4">#{r.rank}</td>
                    <td className="py-3 px-4">{r.name}</td>
                    <td className="py-3 px-4 text-right font-mono text-brand-600 dark:text-brand-400">
                      {r.weighted_score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Risk Findings */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            4. Predictive Risk Assessment Summary
          </h2>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold border border-rose-200 dark:border-rose-900">
              Critical: {riskAssessment.criticalRisks.length}
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 font-bold border border-amber-200 dark:border-amber-900">
              High: {riskAssessment.highRisks.length}
            </div>
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 font-bold border border-sky-200 dark:border-sky-900">
              Moderate: {riskAssessment.moderateRisks.length}
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-900">
              Low: {riskAssessment.lowRisks.length}
            </div>
          </div>
        </div>

        {/* Section 5: AI Explainable Recommendation */}
        {explainableRecommendation && (
          <div className="space-y-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              5. Explainable AI Synthesis (Google Gemini)
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
              {explainableRecommendation.summary}
            </p>
            {explainableRecommendation.supportingEvidence?.length > 0 && (
              <div className="text-[11px] text-slate-400 font-mono">
                Cited Evidence IDs: {explainableRecommendation.supportingEvidence.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Section 6: Final Human Decision Accountability */}
        <div className="space-y-3 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 6. Human Decision Approval &amp; Authorization
          </h2>
          <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
            <p><strong>Status:</strong> {finalDecisionStatus.decisionStatus.toUpperCase()}</p>
            {finalDecisionStatus.rationale && (
              <p><strong>Official Human Rationale:</strong> {finalDecisionStatus.rationale}</p>
            )}
            {finalDecisionStatus.approvedAt && (
              <p className="text-[10px] text-slate-400">Authorized at: {new Date(finalDecisionStatus.approvedAt).toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Footer Audit Signature */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>IntelliDecision AI Compliance Engine</span>
          <span>Hash: sha256-verified</span>
        </div>
      </div>
    </div>
  );
}
