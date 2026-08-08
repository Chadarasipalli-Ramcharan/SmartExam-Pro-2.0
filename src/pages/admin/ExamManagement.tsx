import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Pencil, Trash2, Send, Eye, Clock, Award, BookOpen, AlertCircle } from 'lucide-react';
import { fetchAllExams, fetchQuestionCount } from '@/lib/queries';
import type { Exam } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonCard } from '@/components/Loading';

export function ExamManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Exam | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [publishTarget, setPublishTarget] = useState<Exam | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAllExams();
      setExams(data);
      const counts = await Promise.all(data.map((e) => fetchQuestionCount(e.id).then((c) => [e.id, c] as const)));
      setQuestionCounts(Object.fromEntries(counts));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePublish() {
    if (!publishTarget) return;
    const { error } = await supabase.from('exams').update({ status: 'published' }).eq('id', publishTarget.id);
    if (error) {
      toast('Failed to publish exam', 'error');
      return;
    }
    toast('Exam published — students can now take it', 'success');
    setExams((prev) => prev.map((e) => (e.id === publishTarget.id ? { ...e, status: 'published' } : e)));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('exams').delete().eq('id', deleteTarget.id);
    if (error) {
      toast('Failed to delete exam', 'error');
      return;
    }
    toast('Exam deleted', 'success');
    setExams((prev) => prev.filter((e) => e.id !== deleteTarget.id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Exam Management</h1>
          <p className="text-sm text-slate-500 mt-1">Create, edit, and publish examinations.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> New exam
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : exams.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No exams yet.</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Create your first exam
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div key={exam.id} className="card p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`badge ${exam.status === 'published' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {exam.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{exam.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{exam.subject}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} min</span>
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {exam.total_marks} marks</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {questionCounts[exam.id] ?? 0} Qs</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Link to={`/admin/questions/${exam.id}`} className="btn-secondary text-xs !py-1.5 flex-1 justify-center">
                  <Eye className="w-3.5 h-3.5" /> Questions
                </Link>
                <button onClick={() => { setEditing(exam); setShowForm(true); }} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                {exam.status === 'draft' && (
                  <button onClick={() => setPublishTarget(exam)} className="p-2 rounded-lg text-success-500 hover:bg-success-50 dark:hover:bg-success-700/20 transition" title="Publish">
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setDeleteTarget(exam)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20 transition" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ExamForm
          exam={editing}
          adminId={profile?.id ?? ''}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete exam?"
        message={`"${deleteTarget?.title}" and all its questions and results will be permanently deleted.`}
        confirmText="Delete"
        danger
      />

      <ConfirmDialog
        open={!!publishTarget}
        onClose={() => setPublishTarget(null)}
        onConfirm={handlePublish}
        title="Publish exam?"
        message={`"${publishTarget?.title}" will become visible to all students. Make sure it has questions added.`}
        confirmText="Publish"
      />
    </div>
  );
}

function ExamForm({ exam, adminId, onClose, onSaved }: {
  exam: Exam | null;
  adminId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(exam?.title ?? '');
  const [description, setDescription] = useState(exam?.description ?? '');
  const [subject, setSubject] = useState(exam?.subject ?? '');
  const [duration, setDuration] = useState(exam?.duration_minutes ?? 30);
  const [totalMarks, setTotalMarks] = useState(exam?.total_marks ?? 50);
  const [passingMarks, setPassingMarks] = useState(exam?.passing_marks ?? 25);
  const [instructions, setInstructions] = useState(exam?.instructions ?? '');
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (!title.trim()) return 'Title is required.';
    if (!subject.trim()) return 'Subject is required.';
    if (duration <= 0) return 'Duration must be greater than 0.';
    if (totalMarks <= 0) return 'Total marks must be greater than 0.';
    if (passingMarks > totalMarks) return 'Passing marks cannot exceed total marks.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { toast(v, 'error'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      subject: subject.trim(),
      duration_minutes: duration,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      instructions: instructions.trim() || null,
      created_by: adminId,
    };
    const { error } = exam
      ? await supabase.from('exams').update(payload).eq('id', exam.id)
      : await supabase.from('exams').insert({ ...payload, status: 'draft' });
    setSaving(false);
    if (error) { toast('Failed to save exam', 'error'); return; }
    toast(exam ? 'Exam updated' : 'Exam created', 'success');
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={exam ? 'Edit exam' : 'Create exam'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. JavaScript Fundamentals" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Subject</label>
            <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="input" placeholder="e.g. JavaScript" />
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input type="number" required min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[80px]" placeholder="Brief description of the exam" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Total marks</label>
            <input type="number" required min={1} value={totalMarks} onChange={(e) => setTotalMarks(Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="label">Passing marks</label>
            <input type="number" required min={0} value={passingMarks} onChange={(e) => setPassingMarks(Number(e.target.value))} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Instructions <span className="text-slate-400 font-normal">(one per line)</span></label>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} className="input min-h-[80px]" placeholder="Answer all questions.&#10;No negative marking." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save exam'}</button>
        </div>
      </form>
    </Modal>
  );
}
