import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { User, Mail, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export function ProfilePage() {
  const { user, isSupabaseConfigured } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [status, setStatus] = useState({ success: '', error: '', loading: false });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatus({ success: '', error: '', loading: true });
    try {
      await api.patch('/profile', { full_name: fullName });
      setStatus({ success: 'Profile details updated successfully', error: '', loading: false });
    } catch (err) {
      setStatus({ success: '', error: err.message || 'Failed to update profile', loading: false });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Architect Profile &amp; Account
        </h1>
        <p className="text-xs text-slate-500">
          Manage your personal details, credentials, and decision authorization privileges.
        </p>
      </div>

      {status.success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{status.success}</span>
        </div>
      )}

      {status.error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
          {status.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{user?.fullName || 'Decision Architect'}</h3>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Legal / Professional Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Email is managed securely by Supabase Authentication.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={status.loading}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-sm transition-all"
              >
                {status.loading ? 'Updating...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="p-5">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
          Security &amp; Data Isolation (RLS)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Your account is isolated via Supabase PostgreSQL Row Level Security. All datasets, alternatives, criteria, and decision models are accessible solely by your verified user credentials (<code className="font-mono text-brand-500">auth.uid() = user_id</code>).
        </p>
      </Card>
    </div>
  );
}
