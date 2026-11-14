import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import {
  Sun,
  Moon,
  Sparkles,
  ShieldCheck,
  Database,
  Sliders,
  Lock,
} from 'lucide-react';

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { isSupabaseConfigured } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          System Settings &amp; Configuration
        </h1>
        <p className="text-xs text-slate-500">
          Inspect cloud connectivity, theme modes, and AI analytical engine parameters.
        </p>
      </div>

      {/* Theme Preference */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Interface Appearance</h3>
          <p className="text-xs text-slate-500">Customize the visual styling of your decision workspace.</p>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{theme} Mode Active</p>
              <p className="text-[11px] text-slate-400">Toggle between high-contrast dark mode and clean daylight theme.</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Switch Theme
          </button>
        </CardContent>
      </Card>

      {/* Cloud & AI Status */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Infrastructure Status</h3>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Supabase Cloud PostgreSQL &amp; Auth</p>
                <p className="text-[11px] text-slate-400">Row Level Security enabled on all 18 schema tables.</p>
              </div>
            </div>
            <Badge variant={isSupabaseConfigured ? 'success' : 'primary'}>
              {isSupabaseConfigured ? 'Connected' : 'Interactive Sandbox'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">Google Gemini AI Engine (@google/genai SDK)</p>
                <p className="text-[11px] text-slate-400">Model: gemini-2.5-flash with structured Zod schema output verification.</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Algorithmic Methodology Details */}
      <Card className="p-6 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Decision Intelligence Guarantee</h4>
        <p className="leading-relaxed">
          IntelliDecision AI maintains an uncompromised separation between deterministic calculations (MCDA Weighted Sum Model, IQR outlier detection, Pearson correlation, and Likelihood × Impact risk scoring) and language model interpretation. The AI is forbidden from hallucinating or overwriting mathematical results.
        </p>
      </Card>
    </div>
  );
}
