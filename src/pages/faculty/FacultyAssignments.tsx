import { useEffect, useState, useRef } from 'react';
import { ClipboardList, Plus, Pencil, Trash2, CalendarClock, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow, Spinner } from '@/components/Loading';
import { supabase } from '@/lib/supabase';
import { fetchAssignments, fetchSubjects, fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections } from '@/lib/queries';
import type { AssignmentWithDetails, SubjectWithDetails, Department, AcademicYear, Semester, Section } from '@/types';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface FormState {
  title: string;
  description: string;
  subject_id: string;
  department_id: string;
  academic_year_id: string;
  semester_id: string;
  section_id: string;
  max_marks: number;
  due_date: string;
  instructions: string;
  attachment_url: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  subject_id: '',
  department_id: '',
  academic_year_id: '',
  semester_id: '',
  section_id: '',
  max_marks: 100,
  due_date: '',
  instructions: '',
  attachment_url: '',
};

const ALLOWED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xlsx,.zip,.png,.jpg,.jpeg';
const MAX_SIZE = 25 * 1024 * 1024;

export function FacultyAssignments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AssignmentWithDetails[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AssignmentWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AssignmentWithDetails | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!profile) return;
    setLoading(true);
    try {
      const [a, s, d, ay, sem, sec] = await Promise.all([
        fetchAssignments(undefined, profile.id),
        fetchSubjects({ facultyId: profile.id }),
        fetchDepartments(),
        fetchAcademicYears(),
        fetchSemesters(),
        fetchSections(),
      ]);
      setItems(a);
      setSubjects(s);
      setDepartments(d);
      setAcademicYears(ay);
      setSemesters(sem);
      setSections(sec);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function openForm(a: AssignmentWithDetails | null) {
    setEditing(a);
    setForm(
      a
        ? {
            title: a.title,
            description: a.description ?? '',
            subject_id: a.subject_id,
            department_id: a.department_id ?? '',
            academic_year_id: a.academic_year_id ?? '',
            semester_id: a.semester_id ?? '',
            section_id: a.section_id ?? '',
            max_marks: a.max_marks,
            due_date: a.due_date ? a.due_date.slice(0, 16) : '',
            instructions: a.instructions ?? '',
            attachment_url: a.attachment_url ?? '',
          }
        : emptyForm
    );
    setUploadFile(null);
    setShowForm(true);
  }

  function handleFileSelect(file: File) {
    if (file.size > MAX_SIZE) {
      toast('File size exceeds 25MB limit', 'error');
      return;
    }
    setUploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function uploadAttachment(file: File): Promise<string | null> {
    if (!profile) return null;
    const fileName = `assignments/${profile.id}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error: upErr } = await supabase.storage.from('materials').upload(fileName, file);
    if (upErr) return URL.createObjectURL(file);
    const { data } = supabase.storage.from('materials').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.subject_id || !form.due_date) {
      toast('Title, subject and due date are required', 'error');
      return;
    }
    setSaving(true);
    let attachmentUrl = form.attachment_url;
    if (uploadFile) {
      setUploading(true);
      const uploaded = await uploadAttachment(uploadFile);
      if (uploaded) attachmentUrl = uploaded;
      setUploading(false);
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject_id: form.subject_id,
      faculty_id: profile.id,
      department_id: form.department_id || null,
      academic_year_id: form.academic_year_id || null,
      semester_id: form.semester_id || null,
      section_id: form.section_id || null,
      max_marks: form.max_marks,
      due_date: new Date(form.due_date).toISOString(),
      instructions: form.instructions.trim() || null,
      attachment_url: attachmentUrl || null,
      status: 'published' as const,
    };
    const { error } = editing
      ? await supabase.from('assignments').update(payload).eq('id', editing.id)
      : await supabase.from('assignments').insert(payload);
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast(editing ? 'Assignment updated' : 'Assignment created', 'success');
    setShowForm(false);
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('assignments').delete().eq('id', deleteTarget.id);
    if (error) {
      toast('Failed to delete assignment', 'error');
      return;
    }
    toast('Assignment deleted', 'success');
    setItems((p) => p.filter((i) => i.id !== deleteTarget.id));
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (a: AssignmentWithDetails) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{a.title}</p>
          {a.description && <p className="text-xs text-slate-400 line-clamp-1">{a.description}</p>}
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (a: AssignmentWithDetails) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {a.subject ? `${a.subject.code} · ${a.subject.name}` : '—'}
        </span>
      ),
    },
    {
      key: 'max_marks',
      label: 'Max Marks',
      render: (a: AssignmentWithDetails) => (
        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{a.max_marks}</span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (a: AssignmentWithDetails) => (
        <span className="text-sm text-slate-500 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
          {new Date(a.due_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (a: AssignmentWithDetails) => (
        <div className="flex gap-1">
          <button onClick={() => openForm(a)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit assignment">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(a)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20" aria-label="Delete assignment">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Assignments"
        subtitle="Create and manage assignments for your subjects"
        icon={ClipboardList}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> New assignment</button>}
      />

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assignments yet" message="Create your first assignment to share it with your students."
          action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Create assignment</button>} />
      ) : (
        <DataTable columns={columns} data={items} searchKeys={['title']} pageSize={8} />
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit assignment' : 'Create assignment'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Assignment 1 — Sorting Algorithms" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input min-h-[80px]" placeholder="Brief description of the assignment" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <select value={form.department_id} onChange={(e) => setForm((f) => ({ ...f, department_id: e.target.value }))} className="input">
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Academic Year</label>
                <select value={form.academic_year_id} onChange={(e) => setForm((f) => ({ ...f, academic_year_id: e.target.value }))} className="input">
                  <option value="">Select year</option>
                  {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Semester</label>
                <select value={form.semester_id} onChange={(e) => setForm((f) => ({ ...f, semester_id: e.target.value }))} className="input">
                  <option value="">Select semester</option>
                  {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Section</label>
                <select value={form.section_id} onChange={(e) => setForm((f) => ({ ...f, section_id: e.target.value }))} className="input">
                  <option value="">Select section</option>
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject</label>
                <select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))} className="input" required>
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Max Marks</label>
                <input type="number" min={1} value={form.max_marks} onChange={(e) => setForm((f) => ({ ...f, max_marks: Number(e.target.value) }))} className="input" />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="datetime-local" required value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Instructions</label>
              <textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="input min-h-[100px]" placeholder="Detailed instructions for students" />
            </div>

            {/* Attachment upload */}
            <div>
              <label className="label">Attachment</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${dragOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'}`}
              >
                <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileIcon className="w-5 h-5 text-primary-500" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{uploadFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="p-1 text-slate-400 hover:text-error-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-7 h-7 text-slate-300 mx-auto mb-1" />
                    <p className="text-sm text-slate-500">Drag & drop or click to upload</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX, PPT, PPTX, XLSX, ZIP, Images (max 25MB)</p>
                  </>
                )}
              </div>
              <input type="url" value={form.attachment_url} onChange={(e) => setForm((f) => ({ ...f, attachment_url: e.target.value }))} className="input mt-2" placeholder="Or paste an attachment URL" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving || uploading} className="btn-primary flex items-center gap-2">
                {(saving || uploading) && <Spinner className="w-4 h-4" />}
                {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete assignment?"
        message={`"${deleteTarget?.title}" and all related submissions will be permanently deleted.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
