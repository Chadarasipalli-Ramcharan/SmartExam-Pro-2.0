import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Clock, Award, BookOpen, FileText, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchExam, fetchQuestionsForExam, fetchResult } from '@/lib/queries';
import type { Exam, Question } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/Loading';

export function ExamInstructions() {
  const { examId } = useParams<{ examId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!examId || !profile) return;
    Promise.all([fetchExam(examId), fetchQuestionsForExam(examId), fetchResult(profile.id, examId)])
      .then(([e, q, r]) => {
        setExam(e);
        setQuestions(q);
        setAlreadySubmitted(!!r);
      })
      .finally(() => setLoading(false));
  }, [examId, profile]);

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
        <Link to="/exams" className="btn-secondary mt-4 inline-flex">Back to exams</Link>
      </div>
    );
  }
  if (alreadySubmitted) {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto">
        <CheckCircle2 className="w-12 h-12 mx-auto text-success-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">You've already taken this exam</h2>
        <p className="text-slate-500 mt-2">You can view your result instead.</p>
        <Link to={`/results/${examId}`} className="btn-primary mt-6 inline-flex">View result <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">This exam has no questions yet.</p>
        <Link to="/exams" className="btn-secondary mt-4 inline-flex">Back to exams</Link>
      </div>
    );
  }

  function handleStart() {
    setStarting(true);
    navigate(`/exam/${examId}/take`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link to="/exams" className="text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1">
        ← Back to exams
      </Link>

      <div className="card p-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">{exam.subject}</span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{exam.title}</h1>
            <p className="text-slate-500 mt-1">{exam.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <Clock className="w-5 h-5 mx-auto text-slate-400 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{exam.duration_minutes}</p>
            <p className="text-xs text-slate-500">Minutes</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <Award className="w-5 h-5 mx-auto text-slate-400 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{exam.total_marks}</p>
            <p className="text-xs text-slate-500">Total marks</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <BookOpen className="w-5 h-5 mx-auto text-slate-400 mb-1" />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{questions.length}</p>
            <p className="text-xs text-slate-500">Questions</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Instructions</h3>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> The exam is timed — it will auto-submit when the timer reaches zero.</li>
            <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> Each question has exactly one correct answer.</li>
            <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> Passing marks: <span className="font-semibold text-slate-700 dark:text-slate-300">{exam.passing_marks}</span></li>
            <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> You can navigate between questions before submitting.</li>
            <li className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> Once submitted, your answers cannot be changed.</li>
            {(exam.instructions ?? '').split('\n').filter(Boolean).map((line, i) => (
              <li key={i} className="flex gap-2"><span className="text-primary-500 mt-0.5">•</span> {line}</li>
            ))}
          </ul>
        </div>

        <button onClick={handleStart} disabled={starting} className="btn-primary w-full mt-8 text-base py-3">
          {starting ? 'Starting…' : <>Start exam now <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
    </div>
  );
}
