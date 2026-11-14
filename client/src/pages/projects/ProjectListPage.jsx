import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  FolderKanban,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  Building2,
  Trash2,
  Archive,
  MoreVertical,
} from 'lucide-react';

export function ProjectListPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (domainFilter) params.domain = domainFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/projects', params);
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [domainFilter, statusFilter]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this decision project? All related datasets and evaluations will be removed.')) {
      try {
        await api.delete(`/projects/${id}`);
        setProjects(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert(err.message || 'Failed to delete project');
      }
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.objective && p.objective.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Decision Projects
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your strategic decision initiatives, multi-criteria evaluations, and intelligence pipelines.
          </p>
        </div>

        <Link
          to="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/30 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create Decision Project
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or objective..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Domains</option>
              <option value="business">Business</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="agriculture">Agriculture</option>
              <option value="supply_chain">Supply Chain</option>
              <option value="personal_finance">Personal Finance</option>
              <option value="general">General</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="analyzed">Analyzed</option>
              <option value="evaluated">Evaluated</option>
              <option value="decided">Decided</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Projects List */}
      {loading ? (
        <LoadingSpinner text="Loading decision projects..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No decision projects found"
          description="Create your first decision project or adjust your search filter to get started."
          actionText="Create Project"
          onAction={() => window.location.href = '/projects/new'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="group block"
            >
              <Card hover className="h-full flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="primary" size="small">
                      {p.domain}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          p.status === 'decided'
                            ? 'success'
                            : p.status === 'evaluated'
                            ? 'info'
                            : 'default'
                        }
                        size="small"
                      >
                        {p.status}
                      </Badge>
                      <button
                        onClick={(e) => handleDelete(e, p.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors mb-1.5 line-clamp-1">
                    {p.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">
                    {p.objective || p.description || 'No objective specified'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(p.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                    Workspace <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
