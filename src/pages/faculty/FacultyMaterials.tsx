import { useEffect, useMemo, useState, useRef } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, FileText, Presentation, FileSpreadsheet, Image, Video, Link as LinkIcon, ExternalLink, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonCard, Spinner } from '@/components/Loading';
import { supabase } from '@/lib/supabase';
import { fetchMaterials, fetchSubjects, fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections } from '@/lib/queries';
import type { MaterialWithDetails, SubjectWithDetails, MaterialType, Department, AcademicYear, Semester, Section } from '@/types';
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
  material_type: MaterialType;
  file_url: string;
  external_url: string;
}

const emptyForm: FormState = {
  title: '',
  description: '',
  subject_id: '',
  department_id: '',
  academic_year_id: '',
  semester_id: '',
  section_id: '',
  material_type: 'pdf',
  file_url: '',
  external_url: '',
};

const MATERIAL_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'ppt', label: 'PowerPoint' },
  { value: 'docx', label: 'Document' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'link', label: 'External Link' },
];

const ALLOWED_TYPES = '.pdf,.docx,.ppt,.xlsx,.zip,.png,.jpg,.jpeg';
const MAX_SIZE = 25 * 1024 * 1024;

function typeIcon(type: MaterialType) {
  switch (type) {
    case 'pdf': return FileText;
    case 'ppt': return Presentation;
    case 'docx': return FileSpreadsheet;
    case 'image': return Image;
    case 'video': return Video;
    case 'link': return LinkIcon;
    default: return FileText;
  }
}

function typeBadgeClass(type: MaterialType) {
  switch (type) {
    case 'pdf': return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
    case 'ppt': return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300';
    case 'docx': return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300';
    case 'image': return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
    case 'video': return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300';
    case 'link': return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
    default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
}

export function FacultyMaterials() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<MaterialWithDetails[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MaterialWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialWithDetails | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!profile) return;
    setLoading(true);
    try {
      const [m, s, d, ay, sem, sec] = await Promise.all([
        fetchMaterials(),
        fetchSubjects({ facultyId: profile.id }),
        fetchDepartments(),
        fetchAcademicYears(),
        fetchSemesters(),
        fetchSections(),
      ]);
      setItems(m);
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

  const mySubjectIds = useMemo(() => new Set(subjects.map((s) => s.id)), [subjects]);

  const visibleItems = useMemo(() => {
    let list = items.filter((m) => mySubjectIds.has(m.subject_id));
    if (filterSubject) list = list.filter((m) => m.subject_id === filterSubject);
    return list;
  }, [items, mySubjectIds, filterSubject]);

  function openForm(m: MaterialWithDetails | null) {
    setEditing(m);
    setForm(
      m
        ? {
            title: m.title,
            description: m.description ?? '',
            subject_id: m.subject_id,
            department_id: m.department_id ?? '',
            academic_year_id: m.academic_year_id ?? '',
            semester_id: m.semester_id ?? '',
            section_id: m.section_id ?? '',
            material_type: m.material_type,
            file_url: m.file_url ?? '',
            external_url: m.external_url ?? '',
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

  async function uploadFileToStorage(file: File): Promise<string | null> {
    if (!profile) return null;
    const fileName = `materials/${profile.id}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error: upErr } = await supabase.storage.from('materials').upload(fileName, file);
    if (upErr) return URL.createObjectURL(file);
    const { data } = supabase.storage.from('materials').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.subject_id) {
      toast('Title and subject are required', 'error');
      return;
    }
    if (form.material_type === 'link' && !form.external_url.trim()) {
      toast('External URL is required for link type materials', 'error');
      return;
    }
    setSaving(true);
    let fileUrl = form.file_url;
    if (uploadFile) {
      setUploading(true);
      const uploaded = await uploadFileToStorage(uploadFile);
      if (uploaded) fileUrl = uploaded;
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
      material_type: form.material_type,
      file_url: fileUrl.trim() || null,
      external_url: form.external_url.trim() || null,
    };
    const { error } = editing
      ? await supabase.from('materials').update(payload).eq('id', editing.id)
      : await supabase.from('materials').insert(payload);
    setSaving(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    toast(editing ? 'Material updated' : 'Material added', 'success');
    setShowForm(false);
    load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('materials').delete().eq('id', deleteTarget.id);
    if (error) {
      toast('Failed to delete material', 'error');
      return;
    }
    toast('Material deleted', 'success');
    setItems((p) => p.filter((i) => i.id !== deleteTarget.id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Study Materials"
        subtitle="Upload and manage learning resources for your subjects"
        icon={FolderOpen}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Add material</button>}
      />

      {subjects.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setFilterSubject('')} className={`badge transition ${filterSubject === '' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>All subjects</button>
          {subjects.map((s) => (
            <button key={s.id} onClick={() => setFilterSubject(s.id)} className={`badge transition ${filterSubject === s.id ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{s.code}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState icon={FolderOpen} title={filterSubject ? 'No materials for this subject' : 'No materials yet'} message="Add study materials to share them with your students."
          action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Add material</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((m) => {
            const Icon = typeIcon(m.material_type);
            const href = m.external_url ?? m.file_url ?? null;
            return (
              <div key={m.id} className="card p-5 space-y-3 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`badge ${typeBadgeClass(m.material_type)}`}>{m.material_type.toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{m.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{m.subject ? `${m.subject.code} · ${m.subject.name}` : '—'}</p>
                </div>
                {m.description && <p className="text-sm text-slate-500 line-clamp-2">{m.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline">
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No link attached</span>
                  )}
                  <div className="flex gap-1">
                    <button onClick={() => openForm(m)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit material"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(m)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20" aria-label="Delete material"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit material' : 'Add material'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Unit 1 — Introduction Notes" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input min-h-[80px]" placeholder="Optional description" />
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

            <div>
              <label className="label">Material Type</label>
              <select value={form.material_type} onChange={(e) => setForm((f) => ({ ...f, material_type: e.target.value as MaterialType }))} className="input">
                {MATERIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* File upload */}
            <div>
              <label className="label">Upload File</label>
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
                    <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPT, Excel, ZIP, Images (max 25MB)</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="label">File URL</label>
              <input type="url" value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} className="input" placeholder="https://… (storage URL, optional)" />
            </div>
            <div>
              <label className="label">External URL</label>
              <input type="url" value={form.external_url} onChange={(e) => setForm((f) => ({ ...f, external_url: e.target.value }))} className="input" placeholder="https://… (required for link type)" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving || uploading} className="btn-primary flex items-center gap-2">
                {(saving || uploading) && <Spinner className="w-4 h-4" />}
                {uploading ? 'Uploading...' : saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete material?"
        message={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
