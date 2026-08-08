import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, AlertCircle, Info, AlertTriangle, User, Building2, Link2, Calendar } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { supabase } from '@/lib/supabase';
import {
  fetchAnnouncements, fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections,
} from '@/lib/queries';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type {
  AnnouncementWithDetails, Department, AcademicYear, Semester, Section,
  TargetAudience, Priority,
} from '@/types';

const priorityConfig: Record<Priority, { icon: typeof AlertCircle; badge: string; color: string }> = {
  high: { icon: AlertTriangle, badge: 'badge-error', color: 'text-error-600 dark:text-error-500' },
  normal: { icon: Info, badge: 'badge-primary', color: 'text-primary-600 dark:text-primary-400' },
  low: { icon: AlertCircle, badge: 'badge-secondary', color: 'text-slate-500 dark:text-slate-400' },
};

const audienceLabels: Record<string, string> = {
  all: 'All Users',
  students: 'Students',
  faculty: 'Faculty',
  department: 'Department',
  section: 'Section',
  subject: 'Subject',
  dept_admins: 'Dept Admins',
  faculty_students: 'Faculty + Students',
};

interface FormState {
  title: string;
  content: string;
  target_audience: TargetAudience;
  priority: Priority;
  department_id: string;
  academic_year_id: string;
  semester_id: string;
  section_id: string;
  file_attachment_url: string;
  expiry_date: string;
}

export function FacultyAnnouncements() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AnnouncementWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementWithDetails | null>(null);

  const [form, setForm] = useState<FormState>({
    title: '',
    content: '',
    target_audience: 'students',
    priority: 'normal',
    department_id: '',
    academic_year_id: '',
    semester_id: '',
    section_id: '',
    file_attachment_url: '',
    expiry_date: '',
  });

  function resetForm() {
    setForm({
      title: '',
      content: '',
      target_audience: 'students',
      priority: 'normal',
      department_id: '',
      academic_year_id: '',
      semester_id: '',
      section_id: '',
      file_attachment_url: '',
      expiry_date: '',
    });
  }

  async function load() {
    setLoading(true);
    try {
      const [a, d, ay, s, sec] = await Promise.all([
        fetchAnnouncements(profile?.department_id ?? undefined),
        fetchDepartments(),
        fetchAcademicYears(),
        fetchSemesters(),
        fetchSections(),
      ]);
      setItems(a);
      setDepartments(d);
      setAcademicYears(ay);
      setSemesters(s);
      setSections(sec);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (profile) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Filter to only announcements authored by this faculty member
  const myAnnouncements = items.filter((a) => a.author_id === profile?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) { toast('Not authenticated', 'error'); return; }
    if (!form.title.trim() || !form.content.trim()) { toast('Title and content are required', 'error'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      author_id: profile.id,
      target_audience: form.target_audience,
      priority: form.priority,
      department_id: form.department_id || profile.department_id || null,
      academic_year_id: form.academic_year_id || null,
      semester_id: form.semester_id || null,
      section_id: form.section_id || null,
      file_attachment_url: form.file_attachment_url.trim() || null,
      expiry_date: form.expiry_date || null,
    };
    const { error } = await supabase.from('announcements').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Announcement published', 'success');
    setShowForm(false);
    resetForm();
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete', 'error'); return; }
    toast('Announcement deleted', 'success');
    setItems((p) => p.filter((a) => a.id !== deleteTarget.id));
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="My Announcements" subtitle="Publish and manage your announcements" icon={Megaphone} />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Announcements"
        subtitle="Publish and manage your announcements"
        icon={Megaphone}
        action={<button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> New announcement</button>}
      />

      {myAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          message="Create your first announcement to notify students or faculty."
          action={<button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Create announcement</button>}
        />
      ) : (
        <div className="space-y-4">
          {myAnnouncements.map((a) => {
            const cfg = priorityConfig[a.priority];
            const PriorityIcon = cfg.icon;
            const isExpired = a.expiry_date ? new Date(a.expiry_date) < new Date() : false;
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${cfg.color}`}>
                    <PriorityIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{a.title}</h3>
                      <span className={`badge ${cfg.badge} uppercase`}>{a.priority}</span>
                      <span className="badge badge-secondary">{audienceLabels[a.target_audience]}</span>
                      {isExpired && <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-400">Expired</span>}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{a.content}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {a.author && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{a.author.full_name}</span>
                      )}
                      {a.department && (
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{a.department.name}</span>
                      )}
                      {a.file_attachment_url && (
                        <a href={a.file_attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                          <Link2 className="w-3 h-3" /> Attachment
                        </a>
                      )}
                      {a.expiry_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires {new Date(a.expiry_date).toLocaleDateString()}</span>
                      )}
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New announcement" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="input min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target audience</label>
              <select value={form.target_audience} onChange={(e) => setForm((f) => ({ ...f, target_audience: e.target.value as TargetAudience }))} className="input">
                <option value="all">Everyone</option>
                <option value="students">Students</option>
                <option value="faculty">Faculty</option>
                <option value="dept_admins">Dept Admins</option>
                <option value="faculty_students">Faculty + Students</option>
                <option value="department">Department</option>
                <option value="section">Section</option>
                <option value="subject">Subject</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))} className="input">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select value={form.department_id} onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))} className="input">
                <option value="">Default (your department)</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Academic year</label>
              <select value={form.academic_year_id} onChange={(e) => setForm((f) => ({ ...f, academic_year_id: e.target.value }))} className="input">
                <option value="">None</option>
                {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semester</label>
              <select value={form.semester_id} onChange={(e) => setForm((f) => ({ ...f, semester_id: e.target.value }))} className="input">
                <option value="">None</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select value={form.section_id} onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))} className="input">
                <option value="">None</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">File attachment URL</label>
              <input type="url" value={form.file_attachment_url} onChange={(e) => setForm((f) => ({ ...f, file_attachment_url: e.target.value }))} placeholder="https://…" className="input" />
            </div>
            <div>
              <label className="label">Expiry date</label>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Publishing…' : 'Publish'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete announcement?"
        message="This announcement will be permanently removed."
        confirmText="Delete"
        danger
      />
    </div>
  );
}
