import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Brain,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sliders,
  ShieldAlert,
  Activity,
  CheckCircle2,
  FileCheck2,
  Lock,
  ChevronRight,
  BarChart,
  Target,
  Database,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated, loginDemo } = useAuth();

  const fiveQuestions = [
    { q: "1. What is happening based on available data?", icon: Database, desc: "Automated ingestion, type detection, and data-quality health grading." },
    { q: "2. What important patterns, relationships, and trends exist?", icon: BarChart, desc: "Deterministic descriptive statistics, Pearson correlation, and anomaly discovery." },
    { q: "3. What possible decisions or alternatives are available?", icon: Sliders, desc: "Structured multi-alternative modeling with domain templates and constraints." },
    { q: "4. What are the expected benefits, risks, and trade-offs?", icon: ShieldAlert, desc: "Normalized benefit/cost scoring and 1-25 predictive risk matrix." },
    { q: "5. Which alternative should be considered, and why?", icon: Sparkles, desc: "Explainable Gemini AI recommendations traceably backed by verifiable evidence." },
  ];

  const sixCapabilities = [
    { title: "Unified Data Intelligence", desc: "Ingest CSV, Excel, and JSON. Detect duplicates, missing values, and anomalies with quality scoring." },
    { title: "Deterministic Statistical Engine", desc: "Calculate mean, median, standard deviation, IQR outliers, and linear regression trends without AI hallucination." },
    { title: "Multi-Criteria Decision Analysis", desc: "Normalized 0-100 weighted scoring, alternative ranking, and ±20% sensitivity analysis." },
    { title: "Predictive Risk Assessment", desc: "Likelihood x Impact deterministic risk classification (Low, Moderate, High, Critical) with mitigations." },
    { title: "Explainable AI Insights", desc: "Google Gemini contextual reasoning strictly backed by traceable evidence identifiers." },
    { title: "Continuous Decision Monitoring", desc: "Track actual vs expected KPIs over time and trigger automatic alerts when assumptions drift." },
  ];

  const domains = [
    { name: "Business & Strategy", desc: "Capital deployment, expansion, operational optimization." },
    { name: "Healthcare Administration", desc: "Hospital resource capacity, equipment allocation, staff scheduling." },
    { name: "Education", desc: "Curriculum planning, campus resource allocation, institutional performance." },
    { name: "Agriculture", desc: "Crop selection, weather adaptation, yield planning, equipment ROI." },
    { name: "Supply Chain & Logistics", desc: "Supplier evaluation, inventory buffering, freight logistics." },
    { name: "Personal Finance", desc: "Budget allocation, savings strategy, scenario comparisons." },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                IntelliDecision<span className="text-brand-400">.AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-brand-950/80 text-brand-300 border border-brand-800/60">
                Decision Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-600/30"
              >
                Go to Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-brand-600/30"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/30 via-slate-950 to-slate-950 -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Deterministic Analytics + Explainable Gemini AI Reasoning</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Turn Complex Data Into <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
              Traceable, Defensible Decisions
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The language model explains the results; it never fabricates the underlying numbers.
            IntelliDecision AI combines deterministic multi-criteria scoring, statistical pattern discovery,
            predictive risk evaluation, and human decision accountability.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-brand-600/30 text-base flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              Start Decision Project <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={async () => {
                await loginDemo();
                window.location.href = '/dashboard';
              }}
              className="w-full sm:w-auto px-6 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold rounded-2xl text-base transition-all flex items-center justify-center gap-2"
            >
              Launch Interactive Sandbox Demo
            </button>
          </div>
        </div>
      </section>

      {/* The 5 Critical Questions */}
      <section className="py-20 px-6 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Core Directive</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Answering the Five Decision Questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fiveQuestions.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-brand-500/40 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-brand-950 text-brand-400 border border-brand-900/60 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-slate-100 mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Six Capabilities */}
      <section className="py-20 px-6 border-t border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Architectural Foundation</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Six Enterprise Capabilities</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sixCapabilities.map((cap, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80">
                <div className="text-xs font-mono font-bold text-brand-400 mb-2">0{idx + 1}</div>
                <h3 className="font-bold text-base text-white mb-2">{cap.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Domains */}
      <section className="py-20 px-6 border-t border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Domain Independence</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">Configurable Decision Frameworks</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((dom, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white mb-1">{dom.name}</h4>
                  <p className="text-xs text-slate-400">{dom.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 border-t border-slate-800/80 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-extrabold text-white">Ready for Explainable Decision Intelligence?</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Experience verified calculations, deterministic rankings, and AI explanations built with Supabase RLS and Google Gemini.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-brand-600/30 transition-all"
            >
              Get Started Now <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
