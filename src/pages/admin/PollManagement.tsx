import { useEffect, useState, useMemo } from 'react';
import { BarChart3, Plus, Trash2, Lock, Unlock, X, Eye, EyeOff, Users, Vote } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import {
  fetchPolls, createPoll, updatePollStatus, deletePoll,
  fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections,
} from '@/lib/queries';
import type {
  PollWithDetails, PollType, PollTargetAudience, PollStatus,
  Department, AcademicYear, Semester, Section,
} from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

const TYPE_LABELS: Record<PollType, string> = { single: 'Single choice', multiple: 'Multiple choice', yesno: 'Yes / No' };
const TYPE_BADGE: Record<PollType, string> = {
  single: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300',
  multiple: 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300',
  yesno: 'bg-warning-100 dark:bg-warning-700/30 text-warning-700 dark:text-warning-300',
};

interface FormState {
  title: string;
  description: string;
  poll_type: PollType;
  target_audience: PollTargetAudience;
  department_id: string;
  academic_year_id: string;
  semester_id: string;
  section_id: string;
  is_anonymous: boolean;
  options: string[];
}

const emptyForm: FormState = {
  title: '', description: '', poll_type: 'single', target_audience: 'both',
  department_id: '', academic_year_id: '', semester_id: '', section_id: '',
  is_anonymous: false, options: ['', ''],
};

export function PollManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<PollWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PollWithDetails | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, d, ay, s, sec] = await Promise.all([
        fetchPolls(), fetchDepartments(), fetchAcademicYears(), fetchSemesters(), fetchSections(),
      ]);
      setPolls(p); setDepartments(d); setAcademicYears(ay); setSemesters(s); setSections(sec);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const formSemesters = useMemo(
    () => semesters.filter((s) => !form.department_id || s.department_id === form.department_id),
    [semesters, form.department_id],
  );
  const formSections = useMemo(
    () => sections.filter((s) => !form.semester_id || s.semester_id === form.semester_id),
    [sections, form.semester_id],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) { toast('Not authenticated', 'error'); return; }
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    const opts = form.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) { toast('At least 2 options are required', 'error'); return; }
    setSaving(true);
    try {
      await createPoll({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        poll_type: form.poll_type,
        target_audience: form.target_audience,
        department_id: form.department_id || undefined,
        academic_year_id: form.academic_year_id || undefined,
        semester_id: form.semester_id || undefined,
        section_id: form.section_id || undefined,
        is_anonymous: form.is_anonymous,
        created_by: profile.id,
        options: opts,
      });
      toast('Poll created', 'success');
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(p: PollWithDetails) {
    const next: PollStatus = p.status === 'active' ? 'closed' : 'active';
    try {
      await updatePollStatus(p.id, next);
      toast(`Poll ${next === 'closed' ? 'closed' : 'reopened'}`, 'success');
      setPolls((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)));
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deletePoll(deleteTarget.id);
      toast('Poll deleted', 'success');
      setPolls((p) => p.filter((x) => x.id !== deleteTarget.id));
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  function updateOption(i: number, val: string) {
    setForm((f) => ({ ...f, options: f.options.map((o, idx) => (idx === i ? val : o)) }));
  }
  function addOption() { setForm((f) => ({ ...f, options: [...f.options, ''] })); }
  function removeOption(i: number) {
    setForm((f) => ({ ...f, options: f.options.length > 2 ? f.options.filter((_, idx) => idx !== i) : f.options }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Poll Management"
        subtitle="Create and manage polls"
        icon={BarChart3}
        action={<button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> New poll</button>}
      />

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : polls.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No polls yet"
          message="Create your first poll to gather feedback."
          action={<button onClick={() => { setForm(emptyForm); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Create poll</button>}
        />
      ) : (
        <div className="space-y-3">
          {polls.map((p) => {
            const total = p.total_votes ?? 0;
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{p.title}</h3>
                      <span className={`badge ${TYPE_BADGE[p.poll_type]}`}>{TYPE_LABELS[p.poll_type]}</span>
                      <span className={`badge ${p.status === 'active' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {p.status}
                      </span>
                      {p.is_anonymous && <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500">Anonymous</span>}
                    </div>
                    {p.description && <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{p.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {p.target_audience}</span>
                      <span className="flex items-center gap-1"><Vote className="w-3 h-3" /> {total} votes</span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600"
                      title={isOpen ? 'Hide results' : 'View results'}
                    >
                      {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-600"
                      title={p.status === 'active' ? 'Close poll' : 'Reopen poll'}
                    >
                      {p.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {(p.options ?? []).map((opt) => {
                      const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
                      return (
                        <div key={opt.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                            <span className="text-slate-500">{opt.vote_count} ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {total === 0 && <p className="text-xs text-slate-400 text-center py-2">No votes yet.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New poll" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input min-h-[80px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Poll type</label>
              <select value={form.poll_type} onChange={(e) => setForm((f) => ({ ...f, poll_type: e.target.value as PollType }))} className="input">
                <option value="single">Single choice</option>
                <option value="multiple">Multiple choice</option>
                <option value="yesno">Yes / No</option>
              </select>
            </div>
            <div>
              <label className="label">Target audience</label>
              <select value={form.target_audience} onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value as PollTargetAudience }))} className="input">
                <option value="both">Both</option>
                <option value="students">Students</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select value={form.department_id} onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value, semester_id: '', section_id: '' }))} className="input">
                <option value="">All</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Academic year</label>
              <select value={form.academic_year_id} onChange={(e) => setForm((f) => ({ ...f, academic_year_id: e.target.value }))} className="input">
                <option value="">All</option>
                {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <select value={form.semester_id} onChange={(e) => setForm((f) => ({ ...f, semester_id: e.target.value, section_id: '' }))} className="input">
                <option value="">All</option>
                {formSemesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select value={form.section_id} onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))} className="input">
                <option value="">All</option>
                {formSections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm((f) => ({ ...f, is_anonymous: e.target.checked }))} className="rounded border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500" />
            Anonymous voting
          </label>

          {/* Dynamic options */}
          <div>
            <label className="label">Options (minimum 2)</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    disabled={form.options.length <= 2}
                    className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addOption} className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add option
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating…' : 'Create poll'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete poll?"
        message="This poll and all its votes will be permanently removed."
        confirmText="Delete"
        danger
      />
    </div>
  );
}
