import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, HelpCircle, ArrowLeft, AlertCircle, Check, X } from 'lucide-react';
import { fetchExam, fetchQuestionsForExam } from '@/lib/queries';
import type { Exam, Question, OptionKey, Difficulty } from '@/types';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { DataTable } from '@/components/DataTable';
import { Spinner } from '@/components/Loading';

export function QuestionManagement() {
  const { examId } = useParams<{ examId: string }>();
  const { toast } = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  async function load() {
    if (!examId) return;
    setLoading(true);
    try {
      const [e, q] = await Promise.all([fetchExam(examId), fetchQuestionsForExam(examId)]);
      setExam(e);
      setQuestions(q);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [examId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('questions').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete question', 'error'); return; }
    toast('Question deleted', 'success');
    setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
  }

  const columns = [
    {
      key: 'question',
      label: 'Question',
      render: (q: Question) => (
        <div className="max-w-md">
          <p className="font-medium text-slate-900 dark:text-white line-clamp-2">{q.question}</p>
          <p className="text-xs text-slate-400 mt-0.5">Correct: {q.options[q.correct_option]}</p>
        </div>
      ),
    },
    {
      key: 'correct_option',
      label: 'Answer',
      render: (q: Question) => (
        <span className="badge bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300">{q.correct_option}: {q.options[q.correct_option]}</span>
      ),
    },
    {
      key: 'marks',
      label: 'Marks',
      render: (q: Question) => <span className="font-medium text-slate-700 dark:text-slate-300">{q.marks}</span>,
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (q: Question) => (
        <span className={`badge ${
          q.difficulty === 'easy' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' :
          q.difficulty === 'medium' ? 'bg-warning-100 dark:bg-warning-700/30 text-warning-700 dark:text-warning-300' :
          'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300'
        }`}>{q.difficulty}</span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (q: Question) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditing(q); setShowForm(true); }} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(q)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary-500" />
      </div>
    );
  }
  if (!exam) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Exam not found.</p>
        <Link to="/admin/exams" className="btn-secondary mt-4 inline-flex">Back to exams</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/admin/exams" className="text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Back to exams
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Questions</h1>
          <p className="text-sm text-slate-500 mt-1">{exam.title} · {questions.length} questions</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="card p-12 text-center">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No questions yet.</p>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Add the first question
          </button>
        </div>
      ) : (
        <DataTable columns={columns} data={questions} searchKeys={['question']} pageSize={8} />
      )}

      {showForm && (
        <QuestionForm
          question={editing}
          examId={exam.id}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete question?"
        message="This question will be permanently removed from the exam."
        confirmText="Delete"
        danger
      />
    </div>
  );
}

function QuestionForm({ question, examId, onClose, onSaved }: {
  question: Question | null;
  examId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [text, setText] = useState(question?.question ?? '');
  const [options, setOptions] = useState<Record<OptionKey, string>>(question?.options ?? { A: '', B: '', C: '', D: '' });
  const [correct, setCorrect] = useState<OptionKey>(question?.correct_option ?? 'A');
  const [marks, setMarks] = useState(question?.marks ?? 5);
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? 'medium');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (!text.trim()) return 'Question text is required.';
    for (const k of ['A', 'B', 'C', 'D'] as OptionKey[]) {
      if (!options[k].trim()) return `Option ${k} is required.`;
    }
    if (marks <= 0) return 'Marks must be greater than 0.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { toast(v, 'error'); return; }
    setSaving(true);
    const payload = {
      exam_id: examId,
      question: text.trim(),
      options: { A: options.A.trim(), B: options.B.trim(), C: options.C.trim(), D: options.D.trim() },
      correct_option: correct,
      marks,
      difficulty,
      explanation: explanation.trim() || null,
    };
    const { error } = question
      ? await supabase.from('questions').update(payload).eq('id', question.id)
      : await supabase.from('questions').insert(payload);
    setSaving(false);
    if (error) { toast('Failed to save question', 'error'); return; }
    toast(question ? 'Question updated' : 'Question added', 'success');
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={question ? 'Edit question' : 'Add question'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Question</label>
          <textarea required value={text} onChange={(e) => setText(e.target.value)} className="input min-h-[70px]" placeholder="Enter the question" />
        </div>
        <div className="space-y-2.5">
          <label className="label">Options <span className="text-slate-400 font-normal">(select the correct one)</span></label>
          {(['A', 'B', 'C', 'D'] as OptionKey[]).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(k)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition ${
                  correct === k ? 'bg-success-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {correct === k ? <Check className="w-4 h-4" /> : k}
              </button>
              <input
                type="text"
                required
                value={options[k]}
                onChange={(e) => setOptions((prev) => ({ ...prev, [k]: e.target.value }))}
                className="input"
                placeholder={`Option ${k}`}
              />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Marks</label>
            <input type="number" required min={1} value={marks} onChange={(e) => setMarks(Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="label">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="input">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Explanation <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} className="input min-h-[60px]" placeholder="Shown to students after the exam" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save question'}</button>
        </div>
      </form>
    </Modal>
  );
}
