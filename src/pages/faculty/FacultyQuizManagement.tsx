import { useEffect, useState, useCallback } from 'react';
import { FileQuestion, Plus, Pencil, Trash2, Eye, Save, Send, X, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow, Spinner } from '@/components/Loading';
import {
  fetchQuizzes, createQuiz, updateQuiz, deleteQuiz,
  fetchQuizQuestions, saveQuizQuestion, updateQuizQuestion, deleteQuizQuestion,
  fetchSubjects, fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections,
} from '@/lib/queries';
import type { QuizWithDetails, QuizQuestion, Subject, Department, AcademicYear, Semester, Section } from '@/types';

type QuestionDraft = {
  id?: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string | null;
  explanation: string;
  marks: number;
  is_required: boolean;
  question_image_url: string;
  position: number;
};

const emptyQuestion = (): QuestionDraft => ({
  question_text: '',
  question_type: 'multiple_choice_single',
  options: ['', '', '', ''],
  correct_answer: null,
  explanation: '',
  marks: 1,
  is_required: true,
  question_image_url: '',
  position: 0,
});

const QUESTION_TYPES = [
  { value: 'multiple_choice_single', label: 'Multiple Choice (Single Correct)' },
  { value: 'multiple_choice_multiple', label: 'Multiple Choice (Multiple Correct)' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'paragraph_answer', label: 'Paragraph Answer' },
  { value: 'true_false', label: 'True / False' },
];

export function FacultyQuizManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuizWithDetails | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizWithDetails | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderQuiz, setBuilderQuiz] = useState<QuizWithDetails | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [drafts, setDrafts] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    department_id: '',
    academic_year_id: '',
    semester_id: '',
    section_id: '',
    duration_minutes: 30,
    due_date: '',
    total_marks: 0,
    instructions: '',
  });

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [q, s, d, ay, sem, sec] = await Promise.all([
        fetchQuizzes({ facultyId: profile.id }),
        fetchSubjects({ facultyId: profile.id }),
        fetchDepartments(),
        fetchAcademicYears(),
        fetchSemesters(),
        fetchSections(),
      ]);
      setQuizzes(q);
      setSubjects(s);
      setDepartments(d);
      setAcademicYears(ay);
      setSemesters(sem);
      setSections(sec);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  function openForm(q?: QuizWithDetails) {
    if (q) {
      setEditing(q);
      setForm({
        title: q.title,
        description: q.description ?? '',
        subject_id: q.subject_id ?? '',
        department_id: q.department_id ?? '',
        academic_year_id: q.academic_year_id ?? '',
        semester_id: q.semester_id ?? '',
        section_id: q.section_id ?? '',
        duration_minutes: q.duration_minutes,
        due_date: q.due_date ? q.due_date.slice(0, 16) : '',
        total_marks: q.total_marks,
        instructions: q.instructions ?? '',
      });
    } else {
      setEditing(null);
      setForm({
        title: '', description: '', subject_id: '', department_id: '',
        academic_year_id: '', semester_id: '', section_id: '',
        duration_minutes: 30, due_date: '', total_marks: 0, instructions: '',
      });
    }
    setShowForm(true);
  }

  async function handleSaveQuiz(publish: boolean) {
    if (!profile) return;
    if (!form.title.trim()) { toast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        faculty_id: profile.id,
        subject_id: form.subject_id || null,
        department_id: form.department_id || null,
        academic_year_id: form.academic_year_id || null,
        semester_id: form.semester_id || null,
        section_id: form.section_id || null,
        duration_minutes: form.duration_minutes,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        total_marks: form.total_marks,
        instructions: form.instructions.trim() || null,
        status: publish ? 'published' : 'draft',
      };
      if (editing) {
        await updateQuiz(editing.id, payload);
        toast(publish ? 'Quiz published' : 'Draft saved', 'success');
        setShowForm(false);
      } else {
        const created = await createQuiz(payload);
        toast(publish ? 'Quiz created and published' : 'Quiz draft created', 'success');
        setShowForm(false);
        openBuilder({ ...created, subject: subjects.find((s) => s.id === form.subject_id) } as QuizWithDetails);
      }
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save quiz', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function openBuilder(q: QuizWithDetails) {
    setBuilderQuiz(q);
    setBuilderOpen(true);
    try {
      const qs = await fetchQuizQuestions(q.id);
      setQuestions(qs.map((qq) => ({
        id: qq.id, question_text: qq.question_text, question_type: qq.question_type,
        options: qq.options ?? [], correct_answer: qq.correct_answer, explanation: qq.explanation ?? '',
        marks: qq.marks, is_required: qq.is_required, question_image_url: qq.question_image_url ?? '',
        position: qq.position,
      })));
      setDrafts([]);
    } catch {
      setQuestions([]);
    }
  }

  function addDraft() {
    setDrafts((d) => [...d, { ...emptyQuestion(), position: questions.length + d.length }]);
  }

  function updateDraft(idx: number, field: keyof QuestionDraft, value: unknown) {
    setDrafts((d) => d.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function updateDraftOption(idx: number, optIdx: number, value: string) {
    setDrafts((d) => d.map((q, i) => (i === idx ? { ...q, options: q.options.map((o, oi) => (oi === optIdx ? value : o)) } : q)));
  }

  function addDraftOption(idx: number) {
    setDrafts((d) => d.map((q, i) => (i === idx ? { ...q, options: [...q.options, ''] } : q)));
  }

  function removeDraftOption(idx: number, optIdx: number) {
    setDrafts((d) => d.map((q, i) => (i === idx ? { ...q, options: q.options.filter((_, oi) => oi !== optIdx) } : q)));
  }

  async function saveDraft(idx: number) {
    if (!builderQuiz) return;
    const d = drafts[idx];
    if (!d.question_text.trim()) { toast('Question text is required', 'error'); return; }
    setSaving(true);
    try {
      const options = d.question_type === 'true_false' ? ['True', 'False'] : d.options.filter((o) => o.trim());
      await saveQuizQuestion({
        quiz_id: builderQuiz.id,
        question_text: d.question_text.trim(),
        question_type: d.question_type,
        options,
        correct_answer: d.correct_answer,
        explanation: d.explanation.trim() || null,
        marks: d.marks,
        is_required: d.is_required,
        question_image_url: d.question_image_url.trim() || null,
        position: d.position,
      });
      toast('Question added', 'success');
      setDrafts((prev) => prev.filter((_, i) => i !== idx));
      const qs = await fetchQuizQuestions(builderQuiz.id);
      setQuestions(qs.map((qq) => ({
        id: qq.id, question_text: qq.question_text, question_type: qq.question_type,
        options: qq.options ?? [], correct_answer: qq.correct_answer, explanation: qq.explanation ?? '',
        marks: qq.marks, is_required: qq.is_required, question_image_url: qq.question_image_url ?? '',
        position: qq.position,
      })));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save question', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(qid: string) {
    if (!builderQuiz) return;
    try {
      await deleteQuizQuestion(qid);
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
      toast('Question deleted', 'success');
    } catch {
      toast('Failed to delete question', 'error');
    }
  }

  async function moveQuestion(idx: number, dir: 'up' | 'down') {
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const reordered = [...questions];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setQuestions(reordered);
    for (let i = 0; i < reordered.length; i++) {
      if (reordered[i].id) await updateQuizQuestion(reordered[i].id!, { position: i });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteQuiz(deleteTarget.id);
      toast('Quiz deleted', 'success');
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
    } catch {
      toast('Failed to delete quiz', 'error');
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (q: QuizWithDetails) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-white">{q.title}</p>
          {q.description && <p className="text-xs text-slate-400 line-clamp-1">{q.description}</p>}
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (q: QuizWithDetails) => (
        <span className="text-sm text-slate-600 dark:text-slate-300">
          {q.subject ? `${q.subject.code} · ${q.subject.name}` : '—'}
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (q: QuizWithDetails) => <span className="text-sm text-slate-500">{q.duration_minutes} min</span>,
    },
    {
      key: 'marks',
      label: 'Total Marks',
      render: (q: QuizWithDetails) => <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{q.total_marks}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (q: QuizWithDetails) => (
        <span className={`badge ${q.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
          {q.status === 'published' ? 'Published' : 'Draft'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (q: QuizWithDetails) => (
        <div className="flex gap-1">
          <button onClick={() => openBuilder(q)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit questions">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openForm(q)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Edit quiz">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(q)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20" aria-label="Delete quiz">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Quizzes"
        subtitle="Create and manage interactive quizzes for your students"
        icon={FileQuestion}
        action={<button onClick={() => openForm()} className="btn-primary"><Plus className="w-4 h-4" /> New quiz</button>}
      />

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No quizzes yet" message="Create your first quiz to share it with your students."
          action={<button onClick={() => openForm()} className="btn-primary"><Plus className="w-4 h-4" /> Create quiz</button>} />
      ) : (
        <DataTable columns={columns} data={quizzes} searchKeys={['title']} pageSize={8} />
      )}

      {/* Quiz create/edit modal */}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit quiz' : 'Create quiz'} size="lg">
          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Data Structures Quiz 1" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input min-h-[60px]" placeholder="Brief description" />
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
                <select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))} className="input">
                  <option value="">Select subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Duration (min)</label>
                <input type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))} className="input" />
              </div>
              <div>
                <label className="label">Total Marks</label>
                <input type="number" min={0} value={form.total_marks} onChange={(e) => setForm((f) => ({ ...f, total_marks: Number(e.target.value) }))} className="input" />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="datetime-local" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Instructions</label>
              <textarea value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} className="input min-h-[80px]" placeholder="Instructions for students" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleSaveQuiz(false)} disabled={saving} className="btn-secondary flex items-center gap-2">
                {saving && <Spinner className="w-4 h-4" />} <Save className="w-4 h-4" /> Save Draft
              </button>
              <button onClick={() => handleSaveQuiz(true)} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving && <Spinner className="w-4 h-4" />} <Send className="w-4 h-4" /> Publish
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Quiz builder modal */}
      {builderOpen && builderQuiz && (
        <Modal open onClose={() => { setBuilderOpen(false); load(); }} title={`Quiz Builder: ${builderQuiz.title}`} size="xl">
          <div className="space-y-6">
            {/* Existing questions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Questions ({questions.length})</h3>
              {questions.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No questions yet. Add one below.</p>
              ) : questions.map((q, idx) => (
                <div key={q.id} className="card p-4 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                        <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">{QUESTION_TYPES.find((t) => t.value === q.question_type)?.label ?? q.question_type}</span>
                        <span className="text-xs text-slate-400">{q.marks} marks</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{q.question_text}</p>
                      {q.options.length > 0 && (
                        <ul className="mt-2 text-xs text-slate-500 space-y-1">
                          {q.options.map((o, i) => (
                            <li key={i} className={String(i) === q.correct_answer ? 'text-success-600 font-medium' : ''}>
                              {String(i) === q.correct_answer ? '✓ ' : ''}{o}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveQuestion(idx, 'up')} disabled={idx === 0} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                      <button onClick={() => moveQuestion(idx, 'down')} disabled={idx === questions.length - 1} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                      <button onClick={() => deleteQuestion(q.id!)} className="p-1.5 rounded text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Draft questions */}
            {drafts.map((d, idx) => (
              <div key={idx} className="card p-4 border-2 border-dashed border-primary-200 dark:border-primary-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">New Question {idx + 1}</span>
                  <button onClick={() => setDrafts((prev) => prev.filter((_, i) => i !== idx))} className="p-1.5 rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="label">Question Text</label>
                    <textarea value={d.question_text} onChange={(e) => updateDraft(idx, 'question_text', e.target.value)} className="input min-h-[60px]" placeholder="Enter your question..." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Question Type</label>
                      <select value={d.question_type} onChange={(e) => updateDraft(idx, 'question_type', e.target.value)} className="input">
                        {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Marks</label>
                      <input type="number" min={1} value={d.marks} onChange={(e) => updateDraft(idx, 'marks', Number(e.target.value))} className="input" />
                    </div>
                    <div>
                      <label className="label">Required</label>
                      <select value={d.is_required ? 'yes' : 'no'} onChange={(e) => updateDraft(idx, 'is_required', e.target.value === 'yes')} className="input">
                        <option value="yes">Required</option>
                        <option value="no">Optional</option>
                      </select>
                    </div>
                  </div>
                  {(d.question_type === 'multiple_choice_single' || d.question_type === 'multiple_choice_multiple') && (
                    <div>
                      <label className="label">Options</label>
                      <div className="space-y-2">
                        {d.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type={d.question_type === 'multiple_choice_multiple' ? 'checkbox' : 'radio'}
                              name={`correct-${idx}`}
                              checked={d.question_type === 'multiple_choice_multiple'
                                ? (d.correct_answer ?? '').split(',').includes(String(oi))
                                : d.correct_answer === String(oi)}
                              onChange={() => updateDraft(idx, 'correct_answer', d.question_type === 'multiple_choice_multiple'
                                ? [...(d.correct_answer ?? '').split(',').filter(Boolean), String(oi)].join(',')
                                : String(oi))}
                              className="w-4 h-4 text-primary-600"
                            />
                            <input type="text" value={opt} onChange={(e) => updateDraftOption(idx, oi, e.target.value)} className="input flex-1" placeholder={`Option ${oi + 1}`} />
                            {d.options.length > 2 && <button onClick={() => removeDraftOption(idx, oi)} className="p-1 text-slate-400 hover:text-error-500"><X className="w-4 h-4" /></button>}
                          </div>
                        ))}
                        <button onClick={() => addDraftOption(idx)} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Add option</button>
                      </div>
                    </div>
                  )}
                  {d.question_type === 'true_false' && (
                    <div>
                      <label className="label">Correct Answer</label>
                      <select value={d.correct_answer ?? ''} onChange={(e) => updateDraft(idx, 'correct_answer', e.target.value)} className="input">
                        <option value="">Select answer</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="label">Explanation (optional)</label>
                    <input type="text" value={d.explanation} onChange={(e) => updateDraft(idx, 'explanation', e.target.value)} className="input" placeholder="Explanation shown after answering" />
                  </div>
                  <div>
                    <label className="label">Question Image URL (optional)</label>
                    <input type="url" value={d.question_image_url} onChange={(e) => updateDraft(idx, 'question_image_url', e.target.value)} className="input" placeholder="https://..." />
                  </div>
                  <button onClick={() => saveDraft(idx)} disabled={saving} className="btn-primary flex items-center gap-2">
                    {saving && <Spinner className="w-4 h-4" />} <Save className="w-4 h-4" /> Save Question
                  </button>
                </div>
              </div>
            ))}

            <button onClick={addDraft} className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-primary-300 hover:text-primary-600 transition flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete quiz?"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
