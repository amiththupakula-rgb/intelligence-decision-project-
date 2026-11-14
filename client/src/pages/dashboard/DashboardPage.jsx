import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import {
  FolderKanban,
  Database,
  Sliders,
  ShieldAlert,
  Sparkles,
  Activity,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  AlertTriangle,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [overviewRes, riskRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/risk-summary'),
      ]);
      setData(overviewRes.data);
      setRiskData(riskRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const acknowledgeAlert = async (alertId) => {
    try {
      await api.post(`/monitoring/alerts/${alertId}/acknowledge`);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating decision intelligence overview..." size="large" />;
  }

  const stats = data?.stats || {
    totalProjects: 0,
    activeProjects: 0,
    completedDecisions: 0,
    uploadedDatasets: 0,
    generatedRecommendations: 0,
    highRiskDecisions: 0,
    activeMonitoringAlerts: 0,
  };

  const statCards = [
    { label: 'Decision Projects', value: stats.totalProjects, icon: FolderKanban, color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/60' },
    { label: 'Uploaded Datasets', value: stats.uploadedDatasets, icon: Database, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' },
    { label: 'Active Projects', value: stats.activeProjects, icon: Activity, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60' },
    { label: 'Completed Decisions', value: stats.completedDecisions, icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
    { label: 'High-Risk Items', value: riskData?.criticalCount ? riskData.criticalCount + riskData.highCount : 0, icon: ShieldAlert, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60' },
    { label: 'Active Alerts', value: stats.activeMonitoringAlerts, icon: AlertTriangle, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-brand-900/30 via-indigo-900/20 to-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            IntelliDecision System Active
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Explainable Decision Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deterministic data intelligence, multi-criteria modeling, predictive risk management, and continuous KPI tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Decision Project
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-tight">
                  {stat.label}
                </span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {stat.value}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Recent Projects & Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recent Projects */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Recent Decision Projects</h3>
              </div>
              <Link to="/projects" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data?.recentProjects?.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No decision projects initialized yet. Click "New Decision Project" to begin.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.recentProjects?.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                            {project.title}
                          </h4>
                          <Badge variant="primary" size="small">
                            {project.domain}
                          </Badge>
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
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {project.objective || project.description || 'No objective specified'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-xs flex-shrink-0">
                        <span className="hidden sm:inline">
                          {new Date(project.created_at).toLocaleDateString()}
                        </span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-brand-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Monitoring Alerts */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Continuous Monitoring Alerts</h3>
              </div>
              <span className="text-xs text-slate-500">{data?.activeAlerts?.length || 0} active</span>
            </CardHeader>
            <CardContent className="p-0">
              {data?.activeAlerts?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  All monitored decision KPIs are within normal operational thresholds.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.activeAlerts?.map((alert) => (
                    <div key={alert.id} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                              {alert.severity} Threshold Breach
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{alert.message}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors flex-shrink-0"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Predictive Risk Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Risk Distribution</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {riskData?.totalRisks || 0} Total
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-rose-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical (16-25)
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{riskData?.criticalCount || 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{
                      width: `${(riskData?.totalRisks ? (riskData.criticalCount / riskData.totalRisks) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-amber-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> High (11-15)
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{riskData?.highCount || 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${(riskData?.totalRisks ? (riskData.highCount / riskData.totalRisks) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-sky-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> Moderate (6-10)
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{riskData?.moderateCount || 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all duration-500"
                    style={{
                      width: `${(riskData?.totalRisks ? (riskData.moderateCount / riskData.totalRisks) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low (1-5)
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">{riskData?.lowCount || 0}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(riskData?.totalRisks ? (riskData.lowCount / riskData.totalRisks) * 100 : 0)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Risk score = Likelihood (1-5) × Impact (1-5). High and Critical risks require active operational mitigations before human approval.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
