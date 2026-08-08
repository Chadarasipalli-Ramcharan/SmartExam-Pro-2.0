import { useEffect, useState, useCallback, useRef } from 'react';
import { FileQuestion, Clock, CheckCircle2, AlertCircle, Timer } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonRow, Spinner } from '@/components/Loading';
import { Modal } from '@/components/Modal';
import {
  fetchQuizzes, fetchQuizQuestions, fetchQuizSubmission,
  createQuizSubmission, updateQuizSubmission, autoScoreQuiz,
} from '@/lib/queries';
import type { QuizWithDetails, QuizQuestion, QuizSubmission } from '@/types';

export function StudentQuizzes() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, QuizSubmission | null>>({});
  const [activeQuiz, setActiveQuiz] = useState<QuizWithDetails | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadQuizzes = useCallback(async () => {
    if (!profile) return;
    try {
      const all = await fetchQuizzes();
      const mine = all.filter((q) => {
        if (q.status !== 'published') return false;
        if (q.section_id && q.section_id !== profile.section_id) return false;
        if (q.semester_id && q.semester_id !== profile.semester_id) return false;
        if (q.department_id && q.department_id !== profile.department_id) return false;
        return true;
      });
      setQuizzes(mine);
      const subMap: Record<string, QuizSubmission | null> = {};
      for (const q of mine) {
        try {
          subMap[q.id] = await fetchQuizSubmission(q.id, profile.id);
        } catch { subMap[q.id] = null; }
      }
      setSubmissions(subMap);
    } catch (err) {
      console.error('Quiz load error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  async function startQuiz(quiz: QuizWithDetails) {
    setActiveQuiz(quiz);
    setResult(null);
    setAnswers({});
    setModalOpen(true);
    setSubmitting(false);
    try {
      const qs = await fetchQuizQuestions(quiz.id);
      setQuestions(qs);
      let sub = await fetchQuizSubmission(quiz.id, profile!.id);
      if (!sub) {
        sub = await createQuizSubmission({ quiz_id: quiz.id, student_id: profile!.id, total_marks: quiz.total_marks });
      }
      setSubmission(sub);
      if (sub.answers && Array.isArray(sub.answers)) {
        const ansMap: Record<string, unknown> = {};
        (sub.answers as Record<string, unknown>[]).forEach((a) => {
          if (a && typeof a === 'object' && 'question_id' in a) {
            ansMap[a.question_id as string] = (a as Record<string, unknown>).answer;
          }
        });
        setAnswers(ansMap);
      }
      setTimeLeft(quiz.duration_minutes * 60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            handleSubmit(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      autoSaveRef.current = setInterval(() => {
        autoSave();
      }, 15000);
    } catch (err) {
      console.error('Start quiz error:', err);
    }
  }

  async function autoSave() {
    if (!submission || !activeQuiz) return;
    const answersArray = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
    try {
      await updateQuizSubmission(submission.id, { answers: answersArray });
    } catch (err) {
      console.error('Auto-save error:', err);
    }
  }

  async function handleSubmit(timeout = false) {
    if (!submission || !activeQuiz || !profile) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    try {
      const answersArray = Object.entries(answers).map(([question_id, answer]) => ({ question_id, answer }));
      const { score, total } = autoScoreQuiz(questions, answers);
      await updateQuizSubmission(submission.id, {
        answers: answersArray,
        score,
        total_marks: total,
        status: 'submitted',
        auto_scored: true,
        submitted_at: new Date().toISOString(),
      });
      setResult({ score, total });
      setSubmissions((prev) => ({ ...prev, [activeQuiz.id]: { ...submission, status: 'submitted', score, total_marks: total } }));
      if (timeout) {
        console.log('Quiz auto-submitted due to timeout');
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSave();
    setModalOpen(false);
    setActiveQuiz(null);
    setQuestions([]);
    setAnswers({});
    setSubmission(null);
    setResult(null);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, []);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Quizzes" subtitle="Test your knowledge with interactive quizzes" />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Quizzes" subtitle="Test your knowledge with interactive quizzes" icon={FileQuestion} />

      {quizzes.length === 0 ? (
        <EmptyState icon={FileQuestion} title="No quizzes available" message="No quizzes have been published for your section yet." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((q) => {
            const sub = submissions[q.id];
            const completed = sub?.status === 'submitted';
            return (
              <div key={q.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  {completed ? (
                    <span className="badge badge-success">Completed</span>
                  ) : (
                    <span className="badge badge-warning">Available</span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{q.title}</h3>
                {q.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{q.description}</p>}
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {q.duration_minutes} min</span>
                  <span>{q.total_marks} marks</span>
                  {q.subject && <span>{q.subject.code}</span>}
                </div>
                {completed && sub && (
                  <div className="mt-3 p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
                    <p className="text-sm font-bold text-success-700 dark:text-success-300">
                      Score: {sub.score}/{sub.total_marks}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => startQuiz(q)}
                  disabled={completed}
                  className="mt-4 w-full btn-primary disabled:opacity-50"
                >
                  {completed ? 'Already Submitted' : 'Start Quiz'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && activeQuiz && (
        <Modal open onClose={closeModal} title={activeQuiz.title} size="xl">
          <div className="space-y-4">
            {result ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-success-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Quiz Submitted!</h3>
                <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">
                  Your score: <span className="font-bold text-primary-600 dark:text-primary-400">{result.score}/{result.total}</span>
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {result.total > 0 ? Math.round((result.score / result.total) * 100) : 0}%
                </p>
                <button onClick={closeModal} className="mt-6 btn-primary">Close</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Timer className="w-4 h-4 text-primary-500" />
                    Time remaining: <span className="font-bold text-primary-600 dark:text-primary-400">{formatTime(timeLeft)}</span>
                  </div>
                  <span className="text-sm text-slate-500">{questions.length} questions</span>
                </div>

                {activeQuiz.instructions && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-300">
                    {activeQuiz.instructions}
                  </div>
                )}

                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-bold text-slate-400 shrink-0">Q{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {q.question_text}
                            {q.is_required && <span className="text-error-500 ml-1">*</span>}
                          </p>
                          <span className="text-xs text-slate-400">{q.marks} marks</span>
                        </div>
                      </div>

                      {q.question_image_url && (
                        <img src={q.question_image_url} alt="Question" className="rounded-lg max-h-48 object-contain" />
                      )}

                      {(q.question_type === 'multiple_choice_single' || q.question_type === 'true_false') && (
                        <div className="space-y-2 pl-6">
                          {(q.question_type === 'true_false' ? ['True', 'False'] : q.options).map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={String(answers[q.id] ?? '') === (q.question_type === 'true_false' ? String(i === 0) : String(i))}
                                onChange={() => setAnswers((a) => ({ ...a, [q.id]: q.question_type === 'true_false' ? String(i === 0) : String(i) }))}
                                className="w-4 h-4 text-primary-600"
                              />
                              <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.question_type === 'multiple_choice_multiple' && (
                        <div className="space-y-2 pl-6">
                          {q.options.map((opt, i) => {
                            const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(String(i)) : false;
                            return (
                              <label key={i} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() => {
                                    setAnswers((a) => {
                                      const cur = Array.isArray(a[q.id]) ? a[q.id] as string[] : [];
                                      return { ...a, [q.id]: selected ? cur.filter((x) => x !== String(i)) : [...cur, String(i)] };
                                    });
                                  }}
                                  className="w-4 h-4 text-primary-600 rounded"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.question_type === 'short_answer' && (
                        <input
                          type="text"
                          value={(answers[q.id] as string) ?? ''}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                          placeholder="Your answer..."
                          className="input ml-6 max-w-md"
                        />
                      )}

                      {q.question_type === 'paragraph_answer' && (
                        <textarea
                          value={(answers[q.id] as string) ?? ''}
                          onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                          placeholder="Your answer..."
                          rows={4}
                          className="input ml-6 resize-none"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Responses auto-save every 15 seconds
                  </p>
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={submitting}
                    className="btn-primary flex items-center gap-2"
                  >
                    {submitting && <Spinner className="w-4 h-4" />}
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
