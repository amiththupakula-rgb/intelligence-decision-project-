import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  Stethoscope,
  GraduationCap,
  Wheat,
  Truck,
  Wallet,
  Settings2,
  CheckCircle2,
} from 'lucide-react';

export function CreateProjectPage() {
  const navigate = useNavigate();

  const domainTemplates = [
    {
      id: 'business',
      name: 'Business & Strategy',
      icon: Building2,
      exampleTitle: 'Q3 European Market Entry & Infrastructure Expansion',
      exampleObjective: 'Evaluate whether to launch direct branch operations, acquire local distributors, or maintain cross-border exports.',
      suggestedCriteria: ['Initial Capital Investment', 'Projected 3-Year ROI', 'Regulatory Compliance Lead Time', 'Operational Risk Exposure'],
    },
    {
      id: 'healthcare',
      name: 'Healthcare Administration',
      icon: Stethoscope,
      exampleTitle: 'Diagnostic Imaging Capacity & Equipment Allocation',
      exampleObjective: 'Determine optimal allocation of high-throughput MRI machines across regional diagnostic centers.',
      suggestedCriteria: ['Patient Throughput Capacity', 'Capital Expenditure', 'Maintenance Downtime', 'Staff Training Overhead'],
    },
    {
      id: 'education',
      name: 'Education',
      icon: GraduationCap,
      exampleTitle: 'STEM Curriculum Modernization & Lab Resource Allocation',
      exampleObjective: 'Select instructional technology platform and lab infrastructure for hybrid graduate curriculum.',
      suggestedCriteria: ['Student Engagement Score', 'Annual License Cost', 'Faculty Training Burden', 'Platform Longevity'],
    },
    {
      id: 'agriculture',
      name: 'Agriculture',
      icon: Wheat,
      exampleTitle: 'Drought-Resilient Crop Cycle & Precision Irrigation',
      exampleObjective: 'Compare high-yield crop variants against drought-tolerant variants given precipitation forecasts.',
      suggestedCriteria: ['Expected Net Yield', 'Water Consumption per Acre', 'Seed Procurement Cost', 'Pest Vulnerability'],
    },
    {
      id: 'supply_chain',
      name: 'Supply Chain & Logistics',
      icon: Truck,
      exampleTitle: 'Tier-1 Semiconductor Supplier Dual-Sourcing Optimization',
      exampleObjective: 'Decide whether to onshore packaging operations or retain dual-source overseas fabrication.',
      suggestedCriteria: ['Freight Transit Days', 'Unit Cost at Scale', 'Geopolitical Risk Index', 'Disruption Buffer Margin'],
    },
    {
      id: 'personal_finance',
      name: 'Personal Finance',
      icon: Wallet,
      exampleTitle: 'Fixed vs Adjustable Rate Commercial Asset Refinancing',
      exampleObjective: 'Evaluate debt restructuring alternatives under varying macroeconomic interest rate scenarios.',
      suggestedCriteria: ['Total Lifetime Interest Cost', 'Monthly Cashflow Impact', 'Prepayment Penalty Flexibility', 'Inflation Hedging'],
    },
    {
      id: 'general',
      name: 'General / Custom',
      icon: Settings2,
      exampleTitle: 'Enterprise Resource Strategy',
      exampleObjective: 'Multi-criteria evaluation for custom strategic initiatives.',
      suggestedCriteria: ['Feasibility', 'Total Cost', 'Expected Impact'],
    },
  ];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'business',
    objective: '',
    contextNotes: '',
    deadline: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDomainSelect = (domainId) => {
    const template = domainTemplates.find(t => t.id === domainId);
    setFormData(prev => ({
      ...prev,
      domain: domainId,
      // If title and objective are blank, fill with template example
      title: prev.title ? prev.title : template?.exampleTitle || '',
      objective: prev.objective ? prev.objective : template?.exampleObjective || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        domain: formData.domain,
        objective: formData.objective,
        context: {
          notes: formData.contextNotes,
          initializedWithTemplate: formData.domain,
        },
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
      };

      const res = await api.post('/projects', payload);
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create decision project');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = domainTemplates.find(t => t.id === formData.domain) || domainTemplates[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Initialize Decision Project
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define objectives, domain constraints, and establish the intelligence pipeline.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Domain Selection */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            1. Select Decision Domain
          </h3>
          <p className="text-xs text-slate-500">
            Choose a domain to pre-configure appropriate evaluation criteria and risk templates.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {domainTemplates.map((t) => {
              const Icon = t.icon;
              const isSelected = formData.domain === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleDomainSelect(t.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">{t.name}</h4>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-brand-600 dark:text-brand-400">Suggested Criteria for {selectedTemplate.name}: </span>
              {selectedTemplate.suggestedCriteria.join(' • ')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Details Form */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            2. Project Objectives & Constraints
          </h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Q3 European Market Entry & Infrastructure Expansion"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Core Decision Objective *
              </label>
              <textarea
                required
                rows={3}
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                placeholder="What critical business or strategic question must this evaluation answer?"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Decision Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  General Context / Notes
                </label>
                <input
                  type="text"
                  value={formData.contextNotes}
                  onChange={(e) => setFormData({ ...formData, contextNotes: e.target.value })}
                  placeholder="e.g. Budget ceiling $500k, Q4 target completion"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/projects"
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/30 transition-all disabled:opacity-60"
              >
                {loading ? 'Initializing Project...' : 'Create Decision Project'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
