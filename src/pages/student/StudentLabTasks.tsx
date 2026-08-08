import { useEffect, useState, useRef } from 'react';
import { FlaskConical, Link2, Github, MessageSquare, CheckCircle2, Clock, AlertCircle, UploadCloud, File as FileIcon, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonRow, Spinner } from '@/components/Loading';
import { Modal } from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import {
  fetchLabTasks, fetchMyLabSubmission, submitLabTask,
} from '@/lib/queries';
import type { LabTaskWithDetails, LabSubmission } from '@/types';

const ALLOWED_TYPES = '.pdf,.docx,.zip,.png,.jpg,.jpeg,.py,.js,.ts,.java,.c,.cpp,.html,.css,.go,.rs,.rb,.php,.sql,.sh,.txt';
const MAX_SIZE = 25 * 1024 * 1024;

interface SubmissionMap {
  [labTaskId: string]: LabSubmission | null;
}

export function StudentLabTasks() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [labTasks, setLabTasks] = useState<LabTaskWithDetails[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionMap>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<LabTaskWithDetails | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [comments, setComments] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile?.id) return;
    let mounted = true;
    (async () => {
      try {
        const all = await fetchLabTasks();
        const mine = all.filter(
          (t) => t.status === 'published' && t.section_id === profile.section_id,
        );
        if (!mounted) return;
        setLabTasks(mine);
        const subResults = await Promise.all(
          mine.map((t) => fetchMyLabSubmission(t.id, profile.id)),
        );
        if (!mounted) return;
        const map: SubmissionMap = {};
        mine.forEach((t, i) => { map[t.id] = subResults[i]; });
        setSubmissions(map);
      } catch (err) {
        console.error('Lab tasks load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.id, profile?.section_id]);

  function openModal(t: LabTaskWithDetails) {
    setActiveTask(t);
    const existing = submissions[t.id];
    setFileUrl(existing?.file_url ?? '');
    setGithubUrl(existing?.github_url ?? '');
    setComments(existing?.comments ?? '');
    setUploadFile(null);
    setError(null);
    setModalOpen(true);
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
    const fileName = `${profile.id}/lab-${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error: upErr } = await supabase.storage
      .from('submissions')
      .upload(fileName, file);
    if (upErr) {
      return URL.createObjectURL(file);
    }
    const { data } = supabase.storage.from('submissions').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!profile?.id || !activeTask) return;
    setSubmitting(true);
    setError(null);
    try {
      let finalUrl = fileUrl.trim() || undefined;
      if (uploadFile) {
        setUploading(true);
        const uploaded = await uploadFileToStorage(uploadFile);
        if (uploaded) finalUrl = uploaded;
        setUploading(false);
      }
      const sub = await submitLabTask({
        lab_task_id: activeTask.id,
        student_id: profile.id,
        file_url: finalUrl,
        github_url: githubUrl.trim() || undefined,
        comments: comments.trim() || undefined,
      });
      setSubmissions((prev) => ({ ...prev, [activeTask.id]: sub }));
      setModalOpen(false);
      toast('Lab task submitted successfully', 'success');
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit lab task');
    } finally {
      setSubmitting(false);
    }
  }

  function statusBadge(sub: LabSubmission | null) {
    if (!sub) return <span className="badge badge-error">Not Submitted</span>;
    if (sub.status === 'graded') return <span className="badge badge-success">Graded</span>;
    return <span className="badge badge-warning">Submitted</span>;
  }

  function statusIcon(sub: LabSubmission | null) {
    if (!sub) return <AlertCircle className="w-5 h-5 text-error-500" />;
    if (sub.status === 'graded') return <CheckCircle2 className="w-5 h-5 text-success-500" />;
    return <Clock className="w-5 h-5 text-warning-500" />;
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="My Lab Tasks" subtitle="Lab tasks for your enrolled subjects" />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Lab Tasks" subtitle="Lab tasks for your enrolled subjects" icon={FlaskConical} />

      {labTasks.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No lab tasks found" message="No lab tasks have been published for your section yet." />
      ) : (
        <div className="space-y-4">
          {labTasks.map((t) => {
            const sub = submissions[t.id] ?? null;
            const overdue = new Date(t.due_date) < new Date() && !sub;
            return (
              <div key={t.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{statusIcon(sub)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t.title}</h3>
                        {statusBadge(sub)}
                        {overdue && <span className="badge badge-error">Overdue</span>}
                      </div>
                      {t.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.description}</p>}
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span>{t.subject?.code ?? '—'} · {t.subject?.name ?? ''}</span>
                        <span>Due: {new Date(t.due_date).toLocaleDateString()}</span>
                        <span>Max Marks: {t.max_marks}</span>
                      </div>
                      {(t.dataset_url || t.starter_code_url) && (
                        <div className="mt-2 flex items-center gap-4 text-xs">
                          {t.dataset_url && (
                            <a href={t.dataset_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                              <Link2 className="w-3 h-3" /> Dataset
                            </a>
                          )}
                          {t.starter_code_url && (
                            <a href={t.starter_code_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                              <Github className="w-3 h-3" /> Starter Code
                            </a>
                          )}
                        </div>
                      )}
                      {sub?.grade != null && <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-500">Grade: {sub.grade}/{t.max_marks}</p>}
                      {sub?.feedback && <p className="mt-1 text-xs text-slate-500">Feedback: {sub.feedback}</p>}
                    </div>
                  </div>
                  <button onClick={() => openModal(t)} className="btn-primary shrink-0" disabled={sub?.status === 'graded'}>
                    {sub ? 'Resubmit' : 'Submit'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={activeTask ? `Submit: ${activeTask.title}` : 'Submit Lab Task'}>
        <div className="space-y-4">
          {/* File Upload - Drag & Drop */}
          <div>
            <label className="label">Upload File</label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${dragOver ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'}`}
            >
              <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileIcon className="w-5 h-5 text-primary-500" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{uploadFile.name}</span>
                  <span className="text-xs text-slate-400">({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); }} className="p-1 text-slate-400 hover:text-error-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Drag & drop or click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX, ZIP, Images, Code files (max 25MB)</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="label">File URL</label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="url" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="label">GitHub URL</label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repo" className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="label">Comments</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Add any comments for your instructor..." rows={4} className="input pl-10 resize-none" />
            </div>
          </div>
          {error && <p className="text-sm text-error-600 dark:text-error-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting || uploading} className="btn-primary flex items-center gap-2">
              {(submitting || uploading) && <Spinner className="w-4 h-4" />}
              {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Lab Task'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
