import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100 text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-500 mx-auto shadow-xl">
          <Brain className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-brand-500 font-mono">404</h1>
          <h2 className="text-xl font-bold text-white">Decision Pathway Not Found</h2>
          <p className="text-xs text-slate-400">
            The requested resource, analytical pipeline step, or page does not exist in this workspace.
          </p>
        </div>
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
