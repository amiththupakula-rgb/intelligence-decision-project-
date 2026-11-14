import React from 'react';
import { Brain, Sparkles, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/80 dark:border-slate-800/80 py-6 px-4 sm:px-8 text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">IntelliDecision AI</span>
          <span>— Explainable AI-Powered Decision Intelligence System</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Powered by Google Gemini &amp; Supabase RLS
          </span>
          <span>•</span>
          <span>Deterministic MCDA</span>
        </div>
      </div>
    </footer>
  );
}
