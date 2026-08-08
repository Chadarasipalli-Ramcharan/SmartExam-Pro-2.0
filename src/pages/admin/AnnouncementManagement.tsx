import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Paperclip, CalendarClock } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { supabase } from '@/lib/supabase';
import { fetchAnnouncements, fetchDepartments, fetchAcademicYears, fetchSemesters } from '@/lib/queries';
import type { AnnouncementWithDetails, Department, AcademicYear, Semester } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function AnnouncementManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AnnouncementWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnnouncementWithDetails | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'faculty' | 'department' | 'section' | 'subject'>('all');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [departmentId, setDepartmentId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [fileAttachmentUrl, setFileAttachmentUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [a, d, ay, sem] = await Promise.all([
        fetchAnnouncements(profile?.department_id ?? undefined), fetchDepartments(), fetchAcademicYears(), fetchSemesters(),
      ]);
      setItems(a); setDepartments(d); setAcademicYears(ay); setSemesters(sem);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [profile]);

  function resetForm() {
    setTitle(''); setContent(''); setTargetAudience('all'); setPriority('normal');
    setDepartmentId(''); setAcademicYearId(''); setSemesterId('');
    setFileAttachmentUrl(''); setExpiryDate('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !profile) { toast('Title and content are required', 'error'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(), content: content.trim(), author_id: profile.id,
      target_audience: targetAudience, priority,
      department_id: departmentId || profile.department_id || null,
      academic_year_id: academicYearId || null,
      semester_id: semesterId || null,
      file_attachment_url: fileAttachmentUrl.trim() || null,
      expiry_date: expiryDate || null,
    };
    const { error } = await supabase.from('announcements').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Announcement published', 'success');
    setShowForm(false); resetForm(); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete', 'error'); return; }
    toast('Announcement deleted', 'success');
    setItems((p) => p.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const priorityColor = (p: string) => p === 'high' ? 'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300' : p === 'normal' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500';

  const ayMap: Record<string, string> = Object.fromEntries(academicYears.map((y) => [y.id, y.name]));
  const semMap: Record<string, string> = Object.fromEntries(semesters.map((s) => [s.id, s.name]));

  const filteredSemesters = semesterId ? semesters : (departmentId ? semesters.filter((s) => s.department_id === departmentId) : semesters);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Announcements" subtitle="Publish and manage announcements" icon={Megaphone}
        action={<button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> New announcement</button>} />
      {loading ? <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      : items.length === 0 ? <EmptyState icon={Megaphone} title="No announcements yet" action={<button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary"><Plus className="w-4 h-4" /> Create announcement</button>} />
      : (
        <div className="space-y-3">
          {items.map((a) => {
            const expired = a.expiry_date ? new Date(a.expiry_date) < new Date() : false;
            return (
              <div key={a.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                      <span className={`badge ${priorityColor(a.priority)}`}>{a.priority}</span>
                      {a.expiry_date && (
                        <span className={`badge ${expired ? 'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300' : 'bg-warning-100 dark:bg-warning-700/30 text-warning-700 dark:text-warning-300'} inline-flex items-center gap-1`}>
                          <CalendarClock className="w-3 h-3" />
                          {expired ? 'Expired' : 'Expires'} {new Date(a.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{a.content}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      By {a.author?.full_name ?? 'Unknown'} · {new Date(a.created_at).toLocaleDateString()} · Target: {a.target_audience}
                      {a.academic_year_id && ` · ${ayMap[a.academic_year_id] ?? 'AY'}`}
                      {a.semester_id && ` · ${semMap[a.semester_id] ?? 'Sem'}`}
                    </p>
                    {a.file_attachment_url && (
                      <a href={a.file_attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                        <Paperclip className="w-4 h-4" /> View attachment
                      </a>
                    )}
                  </div>
                  <button onClick={() => setDeleteTarget(a)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title="New announcement" size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Title</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input" /></div>
            <div><label className="label">Content</label><textarea required value={content} onChange={(e) => setContent(e.target.value)} className="input min-h-[100px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Target audience</label><select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as typeof targetAudience)} className="input"><option value="all">Everyone</option><option value="students">Students</option><option value="faculty">Faculty</option><option value="dept_admins">Dept Admins</option><option value="faculty_students">Faculty + Students</option><option value="department">Department</option><option value="section">Section</option><option value="subject">Subject</option></select></div>
              <div><label className="label">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="input"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Department</label><select value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setSemesterId(''); }} className="input"><option value="">Default (your department)</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div><label className="label">Academic Year</label><select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input"><option value="">None</option>{academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
            </div>
            <div><label className="label">Semester</label><select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} className="input" disabled={!departmentId}><option value="">None</option>{filteredSemesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">File attachment URL</label><input type="url" value={fileAttachmentUrl} onChange={(e) => setFileAttachmentUrl(e.target.value)} className="input" placeholder="https://…" /><p className="text-xs text-slate-400">Supported: PDF, DOCX, PPT, Images, ZIP</p></div>
            <div><label className="label">Expiry date</label><input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="input" /></div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Publishing…' : 'Publish'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete announcement?" message="This announcement will be permanently removed." confirmText="Delete" danger />
    </div>
  );
}
