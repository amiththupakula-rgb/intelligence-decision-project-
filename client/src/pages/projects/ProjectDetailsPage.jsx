import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  Brain,
  FolderKanban,
  Database,
  BarChart3,
  Layers,
  Sliders,
  ShieldAlert,
  Sparkles,
  Activity,
  FileText,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Lock,
  Download,
  Info,
} from 'lucide-react';

export function ProjectDetailsPage() {
  const { id: projectId } = useParams();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Project child data
  const [datasets, setDatasets] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [risks, setRisks] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Modals & form state
  const [isAltModalOpen, setIsAltModalOpen] = useState(false);
  const [isCritModalOpen, setIsCritModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);

  const [newAlt, setNewAlt] = useState({ name: '', description: '', estimated_cost: 0, expected_return: 0 });
  const [newCrit, setNewCrit] = useState({ name: '', description: '', direction: 'benefit', weight: 50 });
  const [newRisk, setNewRisk] = useState({ risk_title: '', risk_description: '', risk_category: 'financial', likelihood: 2, impact: 3, mitigation: '' });
  const [newMetric, setNewMetric] = useState({ metric_name: '', expected_value: 100, unit: '', threshold: 10, monitoring_frequency: 'weekly' });
  const [newObs, setNewObs] = useState({ observed_value: 100 });

  // Human Decision Form
  const [decisionForm, setDecisionForm] = useState({
    selected_alternative_id: '',
    decision_status: 'approved',
    decision_reason: '',
  });

  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all project data
  const fetchAllProjectData = async () => {
    try {
      setLoading(true);
      const [
        pRes,
        dRes,
        anRes,
        altRes,
        critRes,
        evalRes,
        rRes,
        recRes,
        decRes,
        monRes,
      ] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/datasets`),
        api.get(`/projects/${projectId}/analysis`),
        api.get(`/projects/${projectId}/alternatives`),
        api.get(`/projects/${projectId}/criteria`),
        api.get(`/projects/${projectId}/evaluation`),
        api.get(`/projects/${projectId}/risks`),
        api.get(`/projects/${projectId}/recommendations`),
        api.get(`/projects/${projectId}/decisions`),
        api.get(`/projects/${projectId}/monitoring`),
      ]);

      setProject(pRes.data);
      setDatasets(dRes.data);
      setAnalyses(anRes.data);
      setAlternatives(altRes.data);
      setCriteria(critRes.data);
      setEvaluation(evalRes.data);
      setRisks(rRes.data.risks || []);
      setRecommendations(recRes.data);
      setDecisions(decRes.data);
      setMonitoring(monRes.data.metrics || []);
      setAlerts(monRes.data.alerts || []);

      if (altRes.data.length > 0 && !decisionForm.selected_alternative_id) {
        setDecisionForm(prev => ({ ...prev, selected_alternative_id: altRes.data[0].id }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProjectData();
  }, [projectId]);

  // Load sample dataset
  const handleLoadSampleData = async () => {
    try {
      setActionLoading(true);
      const sampleCsv = `quarter,revenue_growth,operating_cost,customer_retention,market_share,risk_index
Q1,12.5,45.2,88.4,14.2,2.4
Q2,14.8,48.0,89.1,15.1,2.8
Q3,18.2,52.4,91.0,16.5,3.1
Q4,22.0,58.9,93.2,18.0,3.5
Q5,24.5,61.0,94.0,19.2,3.8
Q6,28.1,66.4,95.5,21.0,4.1`;

      const blob = new Blob([sampleCsv], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'sample_market_benchmark.csv');
      formData.append('name', 'Sample Market Benchmark Dataset');

      await api.upload(`/projects/${projectId}/datasets/upload`, formData);
      await fetchAllProjectData();
      setActiveTab('data');
    } catch (err) {
      alert(`Error loading sample dataset: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Run Analytics
  const handleRunAnalytics = async () => {
    try {
      setActionLoading(true);
      await api.post(`/projects/${projectId}/analysis`, {});
      await fetchAllProjectData();
      setActiveTab('analysis');
    } catch (err) {
      alert(`Analytics Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Add Alternative
  const handleCreateAlternative = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/alternatives`, newAlt);
      setIsAltModalOpen(false);
      setNewAlt({ name: '', description: '', estimated_cost: 0, expected_return: 0 });
      await fetchAllProjectData();
    } catch (err) {
      alert(err.message || 'Failed to add alternative');
    }
  };

  // Add Criterion
  const handleCreateCriterion = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/criteria`, {
        ...newCrit,
        weight: Number(newCrit.weight),
      });
      setIsCritModalOpen(false);
      setNewCrit({ name: '', description: '', direction: 'benefit', weight: 50 });
      await fetchAllProjectData();
    } catch (err) {
      alert(err.message || 'Failed to add criterion');
    }
  };

  // Pre-seed Starter Alternatives & Criteria if empty
  const handleSeedAlternativesAndCriteria = async () => {
    try {
      setActionLoading(true);
      // Create 3 realistic alternatives
      const alt1 = await api.post(`/projects/${projectId}/alternatives`, {
        name: 'Direct Expansion (Flagship Regional Hub)',
        description: 'Establish enterprise presence directly with full local team and dedicated operations.',
        estimated_cost: 350000,
        expected_return: 820000,
      });

      const alt2 = await api.post(`/projects/${projectId}/alternatives`, {
        name: 'Strategic Acquisition / Joint Venture',
        description: 'Acquire controlling stake in established regional player with existing distribution.',
        estimated_cost: 500000,
        expected_return: 1100000,
      });

      const alt3 = await api.post(`/projects/${projectId}/alternatives`, {
        name: 'Digital-First Cross-Border Rollout',
        description: 'Lean rollout leveraging existing cloud platforms and third-party logistics fulfillment.',
        estimated_cost: 120000,
        expected_return: 420000,
      });

      // Create 3 criteria
      const crit1 = await api.post(`/projects/${projectId}/criteria`, {
        name: 'Expected Net Return ($k)',
        direction: 'benefit',
        weight: 45,
      });

      const crit2 = await api.post(`/projects/${projectId}/criteria`, {
        name: 'Initial Capital Investment ($k)',
        direction: 'cost',
        weight: 35,
      });

      const crit3 = await api.post(`/projects/${projectId}/criteria`, {
        name: 'Implementation Agility (Months)',
        direction: 'cost',
        weight: 20,
      });

      // Pre-fill score matrix in state
      setScores({
        [`${alt1.data.id}:${crit1.data.id}`]: 820,
        [`${alt1.data.id}:${crit2.data.id}`]: 350,
        [`${alt1.data.id}:${crit3.data.id}`]: 8,

        [`${alt2.data.id}:${crit1.data.id}`]: 1100,
        [`${alt2.data.id}:${crit2.data.id}`]: 500,
        [`${alt2.data.id}:${crit3.data.id}`]: 12,

        [`${alt3.data.id}:${crit1.data.id}`]: 420,
        [`${alt3.data.id}:${crit2.data.id}`]: 120,
        [`${alt3.data.id}:${crit3.data.id}`]: 3,
      });

      await fetchAllProjectData();
    } catch (err) {
      alert(`Pre-seed error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Run MCDA Evaluation
  const handleExecuteEvaluation = async () => {
    try {
      setActionLoading(true);
      const scoreArray = [];

      alternatives.forEach(alt => {
        criteria.forEach(crit => {
          const raw = scores[`${alt.id}:${crit.id}`];
          if (raw !== undefined && raw !== null && raw !== '') {
            scoreArray.push({
              alternative_id: alt.id,
              criterion_id: crit.id,
              raw_value: Number(raw),
            });
          }
        });
      });

      if (scoreArray.length < alternatives.length * criteria.length) {
        alert('Please provide scores for all criteria across all alternatives before evaluating.');
        setActionLoading(false);
        return;
      }

      await api.post(`/projects/${projectId}/evaluate`, { scores: scoreArray });
      await fetchAllProjectData();
      setActiveTab('evaluation');
    } catch (err) {
      alert(`Evaluation Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Discover / Add Risks with AI
  const handleDiscoverRisksAI = async () => {
    try {
      setActionLoading(true);
      await api.post(`/projects/${projectId}/risks/assess`, {});
      await fetchAllProjectData();
      setActiveTab('risks');
    } catch (err) {
      alert(`Risk Assessment Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Generate Final Recommendation
  const handleGenerateRecommendation = async () => {
    try {
      setActionLoading(true);
      await api.post(`/projects/${projectId}/recommendations/generate`, {});
      await fetchAllProjectData();
      setActiveTab('recommendations');
    } catch (err) {
      alert(`Recommendation Generation Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Record Final Human Decision
  const handleRecordFinalDecision = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post(`/projects/${projectId}/decisions`, {
        ...decisionForm,
        recommendation_id: recommendations[0]?.id || null,
      });
      await fetchAllProjectData();
      alert('Decision officially approved and permanently recorded in the audit trail!');
    } catch (err) {
      alert(`Error recording decision: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Add KPI Metric
  const handleCreateMetric = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${projectId}/monitoring/metrics`, {
        ...newMetric,
        expected_value: Number(newMetric.expected_value),
        threshold: Number(newMetric.threshold),
      });
      setIsMetricModalOpen(false);
      setNewMetric({ metric_name: '', expected_value: 100, unit: '', threshold: 10, monitoring_frequency: 'weekly' });
      await fetchAllProjectData();
    } catch (err) {
      alert(err.message || 'Failed to create metric');
    }
  };

  // Record Observation
  const handleRecordObservation = async (e) => {
    e.preventDefault();
    if (!selectedMetric) return;
    try {
      await api.post(`/monitoring/metrics/${selectedMetric.id}/observations`, {
        observed_value: Number(newObs.observed_value),
      });
      setIsObsModalOpen(false);
      await fetchAllProjectData();
    } catch (err) {
      alert(err.message || 'Failed to record observation');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving decision intelligence workspace..." size="large" />;
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-bold">{error || 'Project not found'}</p>
        <Link to="/projects" className="text-sm font-semibold text-brand-500 underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '1. Overview', icon: FolderKanban },
    { id: 'data', label: '2. Datasets & Quality', icon: Database, count: datasets.length },
    { id: 'analysis', label: '3. Data Intelligence', icon: BarChart3, count: analyses.length },
    { id: 'alternatives', label: '4. Alternatives & Criteria', icon: Layers, count: alternatives.length },
    { id: 'evaluation', label: '5. MCDA Evaluation', icon: Sliders, badge: evaluation ? 'Done' : null },
    { id: 'risks', label: '6. Risk Matrix', icon: ShieldAlert, count: risks.length },
    { id: 'recommendations', label: '7. AI Recommendations', icon: Sparkles, count: recommendations.length },
    { id: 'monitoring', label: '8. Continuous Monitoring', icon: Activity, count: monitoring.length },
    { id: 'reports', label: '9. Reports & Export', icon: FileText },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Project Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/projects" className="text-xs font-semibold text-slate-400 hover:text-brand-500">
              Projects
            </Link>
            <span className="text-xs text-slate-400">/</span>
            <Badge variant="primary" size="small">{project.domain}</Badge>
            <Badge
              variant={
                project.status === 'decided'
                  ? 'success'
                  : project.status === 'evaluated'
                  ? 'info'
                  : 'default'
              }
              size="small"
            >
              Status: {project.status.toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white truncate">
            {project.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Objective:</span> {project.objective}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to={`/projects/${projectId}/reports`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Audit Report
          </Link>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-brand-700 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Decision Project Overview</h3>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-500">Core Objective</label>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5">{project.objective}</p>
                </div>
                <div>
                  <label className="font-semibold text-slate-500">Domain Category</label>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5 capitalize">{project.domain}</p>
                </div>
                {project.deadline && (
                  <div>
                    <label className="font-semibold text-slate-500">Decision Deadline</label>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{new Date(project.deadline).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <label className="font-semibold text-slate-500">Context &amp; Constraints</label>
                  <pre className="mt-1 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-300 overflow-x-auto">
                    {JSON.stringify(project.context, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Intelligence Pipeline Status</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Data Ingestion', completed: datasets.length > 0, detail: `${datasets.length} dataset(s)` },
                  { label: 'Statistical Intelligence', completed: analyses.length > 0, detail: `${analyses.length} analysis executed` },
                  { label: 'Alternatives Defined', completed: alternatives.length >= 2, detail: `${alternatives.length} alternatives` },
                  { label: 'Criteria Configured', completed: criteria.length > 0, detail: `${criteria.length} criteria` },
                  { label: 'MCDA Evaluation', completed: Boolean(evaluation), detail: evaluation ? 'Rankings calculated' : 'Pending' },
                  { label: 'Risk Assessment', completed: risks.length > 0, detail: `${risks.length} risk(s) mapped` },
                  { label: 'AI Recommendation', completed: recommendations.length > 0, detail: recommendations.length > 0 ? 'Explainable AI generated' : 'Pending' },
                  { label: 'Human Decision', completed: decisions.length > 0, detail: decisions.length > 0 ? 'Decision Approved' : 'Pending Human Approval' },
                  { label: 'Monitoring Active', completed: monitoring.length > 0, detail: `${monitoring.length} KPI(s) tracked` },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 flex-shrink-0" />
                      )}
                      <span className={step.completed ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-400'}>
                        {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{step.detail}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Guided Pipeline Actions */}
          <Card className="p-6 bg-gradient-to-r from-brand-950/40 via-indigo-950/20 to-slate-900 border-brand-800/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-white">Next Recommended Step</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {datasets.length === 0
                    ? 'Upload benchmark CSV/Excel data or load the interactive sample dataset to begin.'
                    : analyses.length === 0
                    ? 'Run the deterministic analytical engine to compute descriptive statistics and discover patterns.'
                    : alternatives.length < 2
                    ? 'Define at least two decision alternatives and evaluation criteria to run MCDA scoring.'
                    : !evaluation
                    ? 'Execute deterministic normalized MCDA evaluation to rank alternatives.'
                    : recommendations.length === 0
                    ? 'Generate an explainable AI recommendation with evidence references.'
                    : decisions.length === 0
                    ? 'Review the recommendation and record the final human approval decision.'
                    : 'Set up KPI monitoring to track actual performance against expected values.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {datasets.length === 0 && (
                  <button
                    onClick={handleLoadSampleData}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Load Sample Benchmark Data
                  </button>
                )}
                {datasets.length > 0 && analyses.length === 0 && (
                  <button
                    onClick={handleRunAnalytics}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Execute Data Intelligence
                  </button>
                )}
                {analyses.length > 0 && alternatives.length < 2 && (
                  <button
                    onClick={handleSeedAlternativesAndCriteria}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    Pre-seed Strategic Alternatives
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: DATASETS & QUALITY */}
      {/* ===================================================================== */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Uploaded Datasets</h2>
              <p className="text-xs text-slate-500">
                Manage decision-support datasets, view column profiles, and inspect automated data-quality scores.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadSampleData}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-brand-500" />
                Load Sample Dataset
              </button>

              <label className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Upload CSV / XLSX
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setActionLoading(true);
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
                      await api.upload(`/projects/${projectId}/datasets/upload`, formData);
                      await fetchAllProjectData();
                    } catch (err) {
                      alert(`Upload error: ${err.message}`);
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {datasets.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No datasets uploaded"
              description="Upload real CSV, Excel, or JSON files to feed the deterministic analytics engine."
              actionText="Load Sample Dataset"
              onAction={handleLoadSampleData}
            />
          ) : (
            <div className="space-y-6">
              {datasets.map((d) => {
                const qr = d.source_metadata?.qualityReport;
                return (
                  <Card key={d.id} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900 dark:text-white">{d.name}</h3>
                          <Badge variant="primary" size="small">.{d.file_type.toUpperCase()}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {d.row_count} rows • {(d.file_size / 1024).toFixed(1)} KB • Uploaded {new Date(d.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Quality Score Meter */}
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Data Quality Score</span>
                          <p className="text-lg font-black text-brand-500">{d.data_quality_score} / 100</p>
                        </div>
                      </div>
                    </div>

                    {/* Column Profile Badges */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Detected Column Schema:</h4>
                      <div className="flex flex-wrap gap-2">
                        {d.column_metadata?.map((col, cIdx) => (
                          <div
                            key={cIdx}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono flex items-center gap-1.5"
                          >
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{col.name}</span>
                            <span className="text-[9px] px-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                              {col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Quality Report Summary */}
                    {qr && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold">Completeness:</span>{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">{qr.completenessScore}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Uniqueness:</span>{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">{qr.uniquenessScore}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold">Consistency:</span>{' '}
                          <span className="font-bold text-slate-800 dark:text-slate-200">{qr.consistencyScore}%</span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DATA INTELLIGENCE & PATTERN DISCOVERY */}
      {/* ===================================================================== */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Intelligence &amp; Pattern Discovery</h2>
              <p className="text-xs text-slate-500">
                Deterministic descriptive statistics, linear regression trends, Pearson correlations, and anomalies.
              </p>
            </div>

            <button
              onClick={handleRunAnalytics}
              disabled={actionLoading || datasets.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              {actionLoading ? 'Analyzing...' : 'Run Data Intelligence'}
            </button>
          </div>

          {analyses.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No statistical analysis run yet"
              description="Execute data intelligence to calculate descriptive statistics, correlation matrices, and linear trends."
              actionText="Run Data Intelligence"
              onAction={handleRunAnalytics}
            />
          ) : (
            analyses.map((an) => {
              const res = an.analysis_results || {};
              const stats = res.descriptiveStatistics || {};
              const trends = res.trends || {};
              const correlations = res.significantCorrelations || [];
              const anomalies = res.anomalies || [];
              const aiInterp = res.aiInterpretation || {};

              return (
                <div key={an.id} className="space-y-6">
                  {/* AI Contextual Interpretation Card */}
                  {aiInterp.summary && (
                    <Card className="p-5 bg-gradient-to-r from-brand-950/40 via-indigo-950/20 to-slate-900 border-brand-800/50">
                      <div className="flex items-center gap-2 mb-2 text-brand-400">
                        <Sparkles className="w-4 h-4" />
                        <h4 className="font-bold text-xs uppercase tracking-wider">AI Analytical Synthesis (Gemini)</h4>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed mb-3">{aiInterp.summary}</p>
                      {aiInterp.key_findings?.length > 0 && (
                        <div className="space-y-1.5">
                          {aiInterp.key_findings.map((kf, kfIdx) => (
                            <div key={kfIdx} className="text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-brand-400 font-bold">•</span>
                              <span><strong>{kf.finding}</strong>: {kf.explanation}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Descriptive Statistics Table */}
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Descriptive Statistics (Deterministic)
                      </h3>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                            <th className="py-2.5 pr-4">Metric</th>
                            <th className="py-2.5 px-3">Count</th>
                            <th className="py-2.5 px-3">Mean</th>
                            <th className="py-2.5 px-3">Median</th>
                            <th className="py-2.5 px-3">Min</th>
                            <th className="py-2.5 px-3">Max</th>
                            <th className="py-2.5 px-3">Std Dev</th>
                            <th className="py-2.5 px-3">Outliers (IQR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {Object.entries(stats).map(([col, s]) => (
                            <tr key={col} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 pr-4 font-bold font-sans text-slate-800 dark:text-slate-100">{col}</td>
                              <td className="py-2.5 px-3 text-slate-500">{s.count}</td>
                              <td className="py-2.5 px-3 text-brand-600 dark:text-brand-400 font-bold">{s.mean}</td>
                              <td className="py-2.5 px-3">{s.median}</td>
                              <td className="py-2.5 px-3">{s.min}</td>
                              <td className="py-2.5 px-3">{s.max}</td>
                              <td className="py-2.5 px-3">{s.standardDeviation}</td>
                              <td className="py-2.5 px-3">
                                {s.outlierCount > 0 ? (
                                  <span className="text-amber-500 font-bold">{s.outlierCount} outliers</span>
                                ) : (
                                  <span className="text-emerald-500">None</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Significant Correlations & Trends */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Significant Correlations (Pearson r)</h3>
                        <p className="text-[11px] text-slate-500">Note: Correlation indicates association, not proof of causation.</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {correlations.length === 0 ? (
                          <p className="text-xs text-slate-400">No strong linear correlations (|r| &gt; 0.3) detected.</p>
                        ) : (
                          correlations.map((c, cIdx) => (
                            <div key={cIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.columnA}</span>
                                <span className="text-slate-400 mx-2">↔</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{c.columnB}</span>
                                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{c.strength} {c.direction} relationship</p>
                              </div>
                              <span className="font-mono font-bold text-brand-500 text-sm">r = {c.coefficient}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sequential Trend Slopes</h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {Object.entries(trends).map(([col, t]) => (
                          <div key={col} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{col}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">Slope: {t.slope} • R²: {t.rSquared}</p>
                            </div>
                            <Badge
                              variant={t.direction === 'upward' ? 'success' : t.direction === 'downward' ? 'danger' : 'default'}
                              size="small"
                            >
                              {t.direction.toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: ALTERNATIVES & CRITERIA */}
      {/* ===================================================================== */}
      {activeTab === 'alternatives' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Decision Alternatives &amp; Evaluation Criteria</h2>
              <p className="text-xs text-slate-500">
                Define the available decision choices and establish measurable criteria with benefit/cost directions and weights.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {alternatives.length === 0 && (
                <button
                  onClick={handleSeedAlternativesAndCriteria}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Load Strategic Templates
                </button>
              )}
              <button
                onClick={() => setIsAltModalOpen(true)}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Alternative
              </button>
              <button
                onClick={() => setIsCritModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Criterion
              </button>
            </div>
          </div>

          {/* Alternatives & Criteria Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alternatives Column */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alternatives ({alternatives.length})</h3>
                <span className="text-[11px] text-slate-400">Min 2 required for MCDA</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {alternatives.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No alternatives defined yet.</p>
                ) : (
                  alternatives.map((alt, idx) => (
                    <div key={alt.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {idx + 1}. {alt.name}
                        </span>
                        <button
                          onClick={async () => {
                            await api.delete(`/alternatives/${alt.id}`);
                            fetchAllProjectData();
                          }}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{alt.description}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Criteria Column */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Criteria ({criteria.length})</h3>
                <span className="text-[11px] text-slate-400">
                  Total Weight: {criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0)}%
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                {criteria.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No criteria defined yet.</p>
                ) : (
                  criteria.map((crit) => (
                    <div key={crit.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{crit.name}</span>
                          <Badge variant={crit.direction === 'benefit' ? 'success' : 'warning'} size="small">
                            {crit.direction === 'benefit' ? 'Higher is Better' : 'Lower Cost is Better'}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Weight: {crit.weight}%</p>
                      </div>

                      <button
                        onClick={async () => {
                          await api.delete(`/criteria/${crit.id}`);
                          fetchAllProjectData();
                        }}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score Matrix Input Table */}
          {alternatives.length >= 2 && criteria.length > 0 && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Alternative Criteria Score Matrix</h3>
                  <p className="text-xs text-slate-500">
                    Input raw measured values for each alternative across each criterion before running weighted evaluation.
                  </p>
                </div>

                <button
                  onClick={handleExecuteEvaluation}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
                >
                  <Sliders className="w-4 h-4" />
                  {actionLoading ? 'Calculating MCDA...' : 'Calculate MCDA Rankings'}
                </button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3 pr-4">Alternative</th>
                      {criteria.map((crit) => (
                        <th key={crit.id} className="py-3 px-3">
                          {crit.name}
                          <span className="block text-[10px] font-normal text-slate-400">
                            ({crit.direction === 'benefit' ? 'Benefit' : 'Cost'}, w: {crit.weight}%)
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {alternatives.map((alt) => (
                      <tr key={alt.id}>
                        <td className="py-3 pr-4 font-bold text-slate-800 dark:text-slate-200">
                          {alt.name}
                        </td>
                        {criteria.map((crit) => {
                          const key = `${alt.id}:${crit.id}`;
                          return (
                            <td key={crit.id} className="py-3 px-3">
                              <input
                                type="number"
                                step="any"
                                value={scores[key] !== undefined ? scores[key] : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setScores(prev => ({ ...prev, [key]: val }));
                                }}
                                placeholder="0.0"
                                className="w-24 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono focus:outline-none focus:border-brand-500"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: MCDA EVALUATION RESULTS */}
      {/* ===================================================================== */}
      {activeTab === 'evaluation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Criteria Evaluation Results</h2>
              <p className="text-xs text-slate-500">
                Deterministic Weighted Sum Model (WSM) rankings on a normalized 0–100 scale with sensitivity analysis.
              </p>
            </div>

            <button
              onClick={handleExecuteEvaluation}
              disabled={actionLoading || alternatives.length < 2 || criteria.length === 0}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              Re-Calculate Rankings
            </button>
          </div>

          {!evaluation || !evaluation.rankings ? (
            <EmptyState
              icon={Sliders}
              title="No evaluation results computed yet"
              description="Define alternatives, assign criteria weights, and run the calculation."
              actionText="Set Up Alternatives"
              onAction={() => setActiveTab('alternatives')}
            />
          ) : (
            <div className="space-y-6">
              {/* Rankings Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {evaluation.rankings.map((rankItem) => {
                  const isFirst = rankItem.rank === 1;
                  return (
                    <Card
                      key={rankItem.alternative_id}
                      className={`p-5 relative overflow-hidden ${
                        isFirst ? 'border-brand-500/80 bg-gradient-to-b from-brand-950/30 to-slate-900' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isFirst ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          Rank #{rankItem.rank}
                        </span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                          {rankItem.weighted_score} <span className="text-xs text-slate-400">/ 100</span>
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mb-1">
                        {rankItem.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                        {rankItem.description}
                      </p>

                      {isFirst && rankItem.leadOverNext > 0 && (
                        <div className="pt-2 border-t border-brand-800/40 text-[11px] font-semibold text-brand-400">
                          + {rankItem.leadOverNext} pts ahead of #2
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Comparative Bar Chart (Recharts) */}
              <Card className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  Comparative Composite Score Distribution
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evaluation.rankings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      />
                      <Bar dataKey="weighted_score" fill="#0c87eb" radius={[6, 6, 0, 0]} name="Weighted Score (0-100)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Sensitivity Analysis */}
              {evaluation.sensitivity_results && (
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Criterion Weight Sensitivity Analysis (±20% Variation)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Assesses whether perturbing a criterion's weight alters the Rank #1 decision choice.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(evaluation.sensitivity_results).map(([cName, sens]) => (
                      <div
                        key={cName}
                        className={`p-3.5 rounded-xl border text-xs ${
                          sens.rank1Stable
                            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span>{cName}</span>
                          <Badge variant={sens.rank1Stable ? 'success' : 'warning'} size="small">
                            {sens.rank1Stable ? 'Stable' : 'Sensitive'}
                          </Badge>
                        </div>
                        <p className="text-[11px] opacity-80 mt-1">{sens.comment}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: PREDICTIVE RISK MATRIX */}
      {/* ===================================================================== */}
      {activeTab === 'risks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Predictive Risk Assessment</h2>
              <p className="text-xs text-slate-500">
                Deterministic Likelihood (1-5) x Impact (1-5) risk matrix with mitigation strategies.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscoverRisksAI}
                disabled={actionLoading}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Discover Risks with AI
              </button>
              <button
                onClick={() => setIsRiskModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Risk Item
              </button>
            </div>
          </div>

          {/* 5x5 Matrix Display */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Deterministic 5x5 Risk Matrix
            </h3>
            <div className="grid grid-cols-5 gap-2 max-w-xl mx-auto">
              {[5, 4, 3, 2, 1].map((likelihood) =>
                [1, 2, 3, 4, 5].map((impact) => {
                  const score = likelihood * impact;
                  let color = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
                  if (score >= 16) color = 'bg-rose-500/20 border-rose-500/50 text-rose-400';
                  else if (score >= 11) color = 'bg-amber-500/20 border-amber-500/50 text-amber-400';
                  else if (score >= 6) color = 'bg-sky-500/15 border-sky-500/40 text-sky-400';

                  const count = risks.filter(r => r.likelihood === likelihood && r.impact === impact).length;

                  return (
                    <div
                      key={`${likelihood}-${impact}`}
                      className={`h-16 rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${color}`}
                    >
                      <span className="text-[10px] opacity-60">L:{likelihood} I:{impact}</span>
                      <span className="font-extrabold text-sm">{count > 0 ? `${count} risk` : score}</span>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Risk Items List */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Identified Risk Items ({risks.length})</h3>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
              {risks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No risk items logged yet.</p>
              ) : (
                risks.map((r) => (
                  <div key={r.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            r.risk_level === 'critical'
                              ? 'danger'
                              : r.risk_level === 'high'
                              ? 'warning'
                              : r.risk_level === 'moderate'
                              ? 'info'
                              : 'success'
                          }
                          size="small"
                        >
                          {r.risk_level.toUpperCase()} ({r.risk_score || r.likelihood * r.impact}/25)
                        </Badge>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{r.risk_title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {r.risk_category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.risk_description}</p>
                      {r.mitigation && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">
                          <strong>Mitigation:</strong> {r.mitigation}
                        </p>
                      )}
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-400 flex-shrink-0">
                      <div>Likelihood: {r.likelihood}/5</div>
                      <div>Impact: {r.impact}/5</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: AI RECOMMENDATIONS & HUMAN DECISION */}
      {/* ===================================================================== */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Explainable AI Recommendations</h2>
              <p className="text-xs text-slate-500">
                Evidence-backed recommendations powered by Google Gemini and verified deterministic calculations.
              </p>
            </div>

            <button
              onClick={handleGenerateRecommendation}
              disabled={actionLoading || !evaluation}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {actionLoading ? 'Synthesizing...' : 'Generate AI Recommendation'}
            </button>
          </div>

          {recommendations.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No recommendation generated yet"
              description="Complete the multi-criteria evaluation to enable evidence-based recommendation synthesis."
              actionText="Generate Recommendation"
              onAction={handleGenerateRecommendation}
            />
          ) : (
            recommendations.map((rec) => {
              const recAlt = alternatives.find(a => a.id === rec.recommended_alternative_id);
              return (
                <div key={rec.id} className="space-y-6">
                  {/* Recommendation Card */}
                  <Card className="p-6 border-brand-500/80 bg-gradient-to-br from-brand-950/40 via-indigo-950/20 to-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={rec.recommendation_type === 'strong' ? 'success' : 'warning'}
                          size="large"
                        >
                          {rec.recommendation_type.toUpperCase()} RECOMMENDATION
                        </Badge>
                        <Badge variant="primary" size="small">
                          Confidence: {rec.confidence_level.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        Model: {rec.model_name}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white mb-2">
                      Recommended: {recAlt?.name || 'Evidence-Weighted Option'}
                    </h3>

                    <p className="text-sm text-slate-200 leading-relaxed mb-6">
                      {rec.recommendation_summary}
                    </p>

                    {/* Supporting Reasons */}
                    {rec.explanation?.reasoning && (
                      <div className="space-y-2 mb-6">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400">
                          Traceable Decision Evidence &amp; Reasons:
                        </h4>
                        <div className="space-y-2">
                          {rec.explanation.reasoning.map((r, rIdx) => (
                            <div key={rIdx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-start justify-between gap-3">
                              <span className="text-slate-300">{r.reason}</span>
                              {r.evidence_ids?.length > 0 && (
                                <span className="font-mono text-[10px] text-brand-400 bg-brand-950/80 px-2 py-0.5 rounded border border-brand-800">
                                  {r.evidence_ids.join(', ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assumptions & Uncertainties */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-800">
                      <div>
                        <h5 className="font-bold text-slate-400 mb-1">Key Assumptions:</h5>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {rec.assumptions?.map((a, aIdx) => (
                            <li key={aIdx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-400 mb-1">Uncertainties &amp; Reassessment Triggers:</h5>
                        <ul className="list-disc list-inside text-slate-300 space-y-1">
                          {rec.uncertainties?.map((u, uIdx) => (
                            <li key={uIdx}>{u}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>

                  {/* HUMAN DECISION APPROVAL PANEL */}
                  <Card className="p-6 border-slate-700">
                    <CardHeader className="p-0 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            Human Decision Authorization &amp; Accountability
                          </h3>
                          <p className="text-xs text-slate-400">
                            Critical principle: AI recommendations are purely advisory. A human decision-maker must authorize and record the definitive selection.
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 pt-4">
                      {decisions.length > 0 ? (
                        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs space-y-2">
                          <div className="flex items-center gap-2 font-bold text-emerald-300">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Decision Officially Recorded &amp; Locked</span>
                          </div>
                          <p className="text-slate-200">
                            <strong>Chosen Alternative:</strong>{' '}
                            {alternatives.find(a => a.id === decisions[0].selected_alternative_id)?.name}
                          </p>
                          <p className="text-slate-300">
                            <strong>Official Rationale:</strong> {decisions[0].decision_reason}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Authorized at: {new Date(decisions[0].approved_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleRecordFinalDecision} className="space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Selected Alternative</label>
                              <select
                                value={decisionForm.selected_alternative_id}
                                onChange={(e) => setDecisionForm({ ...decisionForm, selected_alternative_id: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                              >
                                {alternatives.map((alt) => (
                                  <option key={alt.id} value={alt.id}>
                                    {alt.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-300 mb-1">Decision Action</label>
                              <select
                                value={decisionForm.decision_status}
                                onChange={(e) => setDecisionForm({ ...decisionForm, decision_status: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                              >
                                <option value="approved">Approve Recommendation</option>
                                <option value="modified">Approve with Modifications</option>
                                <option value="rejected">Reject &amp; Pick Alternative</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-300 mb-1">
                              Executive Decision Rationale (Audit Trail) *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={decisionForm.decision_reason}
                              onChange={(e) => setDecisionForm({ ...decisionForm, decision_reason: e.target.value })}
                              placeholder="Record the official justification for approving or modifying this choice..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Record &amp; Authorize Decision
                          </button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: CONTINUOUS MONITORING */}
      {/* ===================================================================== */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Continuous Decision Monitoring</h2>
              <p className="text-xs text-slate-500">
                Track expected vs actual KPI outcomes over time and trigger alerts when assumptions drift.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMetricModalOpen(true)}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Monitored Metric
              </button>
            </div>
          </div>

          {monitoring.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No decision metrics configured for monitoring"
              description="Add target KPIs (e.g. Revenue Growth, Adoption Rate, Unit Cost) to monitor outcomes over time."
              actionText="Add Monitored Metric"
              onAction={() => setIsMetricModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monitoring.map((m) => {
                const deviation = m.actual_value !== null ? Math.abs(((m.actual_value - m.expected_value) / (m.expected_value || 1)) * 100).toFixed(1) : 0;
                return (
                  <Card key={m.id} className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge
                          variant={
                            m.status === 'breached'
                              ? 'danger'
                              : m.status === 'warning'
                              ? 'warning'
                              : 'success'
                          }
                          size="small"
                        >
                          {m.status.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Tolerance: ±{m.threshold}%
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                        {m.metric_name}
                      </h4>

                      <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Expected Target</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {m.expected_value} {m.unit}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans">Actual Observed</span>
                          <span className="font-bold text-brand-500">
                            {m.actual_value !== null ? `${m.actual_value} ${m.unit}` : 'Pending Observation'}
                          </span>
                        </div>
                      </div>

                      {m.actual_value !== null && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Observed deviation: <strong className={m.status === 'breached' ? 'text-rose-500' : 'text-slate-300'}>{deviation}%</strong> from baseline target.
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                      <button
                        onClick={() => {
                          setSelectedMetric(m);
                          setNewObs({ observed_value: m.actual_value || m.expected_value });
                          setIsObsModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Record Observation
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 9: REPORTS & EXPORT */}
      {/* ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audit Reports &amp; Export</h2>
              <p className="text-xs text-slate-500">
                Download verified decision intelligence audit reports, data summaries, and CSV tables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/v1/projects/${projectId}/reports?format=csv`}
                download
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV Table
              </a>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Print / Save PDF Report
              </button>
            </div>
          </div>

          <Card className="p-8 space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-xs font-mono text-brand-500 font-bold uppercase">Official Intelligence Audit</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{project.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Generated by IntelliDecision AI on {new Date().toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-400 block">Domain</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">{project.domain}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold text-slate-800 dark:text-slate-100 uppercase">{project.status}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-400 block">Datasets Analyzed</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{datasets.length}</span>
              </div>
            </div>

            {evaluation?.rankings && (
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">MCDA Ranking Summary</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {evaluation.rankings.map(r => (
                    <div key={r.alternative_id} className="p-3 flex items-center justify-between text-xs">
                      <span className="font-bold">Rank #{r.rank} : {r.name}</span>
                      <span className="font-mono font-bold text-brand-500">{r.weighted_score} / 100</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS */}
      {/* ===================================================================== */}

      {/* Alternative Modal */}
      <Modal isOpen={isAltModalOpen} onClose={() => setIsAltModalOpen(false)} title="Add Decision Alternative">
        <form onSubmit={handleCreateAlternative} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Alternative Name *</label>
            <input
              type="text"
              required
              value={newAlt.name}
              onChange={(e) => setNewAlt({ ...newAlt, name: e.target.value })}
              placeholder="e.g. Build Internal Data Lake"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={newAlt.description}
              onChange={(e) => setNewAlt({ ...newAlt, description: e.target.value })}
              placeholder="Operational details and execution scope..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAltModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl"
            >
              Add Alternative
            </button>
          </div>
        </form>
      </Modal>

      {/* Criterion Modal */}
      <Modal isOpen={isCritModalOpen} onClose={() => setIsCritModalOpen(false)} title="Add Evaluation Criterion">
        <form onSubmit={handleCreateCriterion} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Criterion Name *</label>
            <input
              type="text"
              required
              value={newCrit.name}
              onChange={(e) => setNewCrit({ ...newCrit, name: e.target.value })}
              placeholder="e.g. 3-Year Return on Capital"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Direction</label>
              <select
                value={newCrit.direction}
                onChange={(e) => setNewCrit({ ...newCrit, direction: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              >
                <option value="benefit">Benefit (Higher is Better)</option>
                <option value="cost">Cost (Lower is Better)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Weight (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newCrit.weight}
                onChange={(e) => setNewCrit({ ...newCrit, weight: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCritModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl"
            >
              Add Criterion
            </button>
          </div>
        </form>
      </Modal>

      {/* Risk Modal */}
      <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title="Log Risk Assessment Item">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api.post(`/projects/${projectId}/risks`, {
                ...newRisk,
                likelihood: Number(newRisk.likelihood),
                impact: Number(newRisk.impact),
              });
              setIsRiskModalOpen(false);
              setNewRisk({ risk_title: '', risk_description: '', risk_category: 'financial', likelihood: 2, impact: 3, mitigation: '' });
              await fetchAllProjectData();
            } catch (err) {
              alert(err.message || 'Failed to add risk');
            }
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Risk Title *</label>
            <input
              type="text"
              required
              value={newRisk.risk_title}
              onChange={(e) => setNewRisk({ ...newRisk, risk_title: e.target.value })}
              placeholder="e.g. Foreign Exchange Volatility"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={newRisk.risk_category}
                onChange={(e) => setNewRisk({ ...newRisk, risk_category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              >
                <option value="financial">Financial</option>
                <option value="operational">Operational</option>
                <option value="market">Market</option>
                <option value="resource">Resource</option>
                <option value="data">Data</option>
                <option value="strategic">Strategic</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Likelihood (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newRisk.likelihood}
                onChange={(e) => setNewRisk({ ...newRisk, likelihood: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Impact (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newRisk.impact}
                onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Mitigation Strategy</label>
            <textarea
              rows={2}
              value={newRisk.mitigation}
              onChange={(e) => setNewRisk({ ...newRisk, mitigation: e.target.value })}
              placeholder="Actionable steps to mitigate likelihood or impact..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsRiskModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl"
            >
              Add Risk Item
            </button>
          </div>
        </form>
      </Modal>

      {/* Monitored Metric Modal */}
      <Modal isOpen={isMetricModalOpen} onClose={() => setIsMetricModalOpen(false)} title="Configure Monitored Metric">
        <form onSubmit={handleCreateMetric} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">KPI Metric Name *</label>
            <input
              type="text"
              required
              value={newMetric.metric_name}
              onChange={(e) => setNewMetric({ ...newMetric, metric_name: e.target.value })}
              placeholder="e.g. Quarterly Net Revenue"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Expected Value</label>
              <input
                type="number"
                step="any"
                required
                value={newMetric.expected_value}
                onChange={(e) => setNewMetric({ ...newMetric, expected_value: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit</label>
              <input
                type="text"
                value={newMetric.unit}
                onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                placeholder="$, %, users"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Breach Tolerance (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newMetric.threshold}
                onChange={(e) => setNewMetric({ ...newMetric, threshold: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMetricModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl"
            >
              Add KPI Monitor
            </button>
          </div>
        </form>
      </Modal>

      {/* Observation Modal */}
      <Modal isOpen={isObsModalOpen} onClose={() => setIsObsModalOpen(false)} title={`Record Observation for "${selectedMetric?.metric_name}"`}>
        <form onSubmit={handleRecordObservation} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Observed Value ({selectedMetric?.unit || 'unit'}) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={newObs.observed_value}
              onChange={(e) => setNewObs({ ...newObs, observed_value: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Expected Target: {selectedMetric?.expected_value} {selectedMetric?.unit}. Exceeding ±{selectedMetric?.threshold}% will trigger an automated alert.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsObsModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl"
            >
              Save Observation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
