import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, AlertCircle, Flag } from 'lucide-react';
import { fetchExam, fetchQuestionsForExam, calculateScore, submitExamResult } from '@/lib/queries';
import type { Exam, Question, OptionKey } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Spinner } from '@/components/Loading';

export function LiveExam() {
  const { examId } = useParams<{ examId: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!examId) return;
    Promise.all([fetchExam(examId), fetchQuestionsForExam(examId)])
      .then(([e, q]) => {
        setExam(e);
        setQuestions(q);
        setTimeLeft((e?.duration_minutes ?? 0) * 60);
      })
      .finally(() => setLoading(false));
  }, [examId]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current || !profile || !exam) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const score = calculateScore(questions, answers, exam.passing_marks);
      await submitExamResult(profile.id, exam.id, score);
      toast('Exam submitted successfully!', 'success');
      navigate(`/results/${exam.id}`, { replace: true });
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      toast(err instanceof Error ? err.message : 'Submission failed', 'error');
    }
  }, [profile, exam, questions, answers, navigate, toast]);

  // Timer
  useEffect(() => {
    if (loading || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          toast('Time is up! Auto-submitting your exam.', 'warning');
          doSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, timeLeft, doSubmit, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-primary-500" />
      </div>
    );
  }
  if (!exam || questions.length === 0) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Exam not available.</p>
        <Link to="/exams" className="btn-secondary mt-4 inline-flex">Back to exams</Link>
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeLow = timeLeft <= 30;

  function selectOption(opt: OptionKey) {
    setAnswers((prev) => ({ ...prev, [q.id]: opt }));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Sticky timer bar */}
      <div className="sticky top-20 z-10 card px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{exam.title}</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-sm text-slate-500">Question {current + 1} of {questions.length}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-lg px-3 py-1 rounded-lg ${timeLow ? 'bg-error-100 dark:bg-error-700/30 text-error-600 dark:text-error-400 animate-pulse' : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'}`}>
          <Clock className="w-4 h-4" />
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        {/* Question card */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{q.difficulty}</span>
            <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">{q.marks} marks</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{q.question}</h2>
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => (
              <button
                key={opt}
                onClick={() => selectOption(opt)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[q.id] === opt
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    answers[q.id] === opt
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {opt}
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{q.options[opt]}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="btn-secondary disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => setShowConfirm(true)} className="btn-primary bg-success-600 hover:bg-success-700">
                <Flag className="w-4 h-4" /> Submit exam
              </button>
            )}
          </div>
        </div>

        {/* Question navigator */}
        <div className="card p-5 h-fit">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Questions</h3>
          <p className="text-xs text-slate-400 mb-4">{answeredCount} answered</p>
          <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setCurrent(i)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                  i === current
                    ? 'bg-primary-600 text-white'
                    : answers[qq.id]
                    ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="btn-primary w-full mt-5 bg-success-600 hover:bg-success-700 text-sm"
          >
            Submit exam
          </button>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-md card p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Submit exam?</h3>
            <p className="text-sm text-slate-500 mt-2">
              You've answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && ' Unanswered questions will be marked as incorrect.'}
              <br />This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="btn-secondary">Cancel</button>
              <button onClick={doSubmit} disabled={submitting} className="btn-primary bg-success-600 hover:bg-success-700">
                {submitting ? <Spinner className="w-4 h-4" /> : 'Confirm submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
