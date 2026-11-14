import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Database,
  BarChart3,
  Layers,
  Sliders,
  ShieldAlert,
  Sparkles,
  Activity,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { label: 'Overview Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Decision Projects', path: '/projects', icon: FolderKanban },
    { label: 'New Project', path: '/projects/new', icon: PlusCircle },
  ];

  const intelligencePipeline = [
    { label: '1. Ingestion & Quality', icon: Database, step: 'Data' },
    { label: '2. Pattern Discovery', icon: BarChart3, step: 'Stats' },
    { label: '3. Alternatives & Criteria', icon: Layers, step: 'MCDA' },
    { label: '4. Multi-Criteria Scoring', icon: Sliders, step: 'Score' },
    { label: '5. Predictive Risk Matrix', icon: ShieldAlert, step: 'Risks' },
    { label: '6. Explainable AI Insights', icon: Sparkles, step: 'Gemini' },
    { label: '7. Continuous Monitoring', icon: Activity, step: 'KPIs' },
    { label: '8. Audit Reports & Export', icon: FileText, step: 'Audit' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main Navigation */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Workspace
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Intelligence Pipeline Flow Reference */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pipeline Stages
              </p>
              <span className="text-[10px] text-brand-500 font-semibold">Active</span>
            </div>
            <div className="space-y-1">
              {intelligencePipeline.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{step.label}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {step.step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings & Keys</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
