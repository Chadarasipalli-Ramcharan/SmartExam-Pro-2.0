import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, CheckCircle2, XCircle, ArrowRight, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { fetchExam, fetchQuestionsForExam, fetchResult } from '@/lib/queries';
import type { Exam, Question, Result } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/Loading';

export function ResultDetail() {
  const { examId } = useParams<{ examId: string }>();
  const { profile } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!examId || !profile) return;
    Promise.all([fetchExam(examId), fetchResult(profile.id, examId), fetchQuestionsForExam(examId)])
      .then(([e, r, q]) => {
        setExam(e);
        setResult(r);
        setQuestions(q);
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
  if (!exam || !result) {
    return (
      <div className="card p-12 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Result not found.</p>
        <Link to="/results" className="btn-secondary mt-4 inline-flex">Back to results</Link>
      </div>
    );
  }

  const passed = result.status === 'pass';
  const gradeColor =
    result.grade === 'A+' ? 'text-success-600 dark:text-success-400' :
    result.grade === 'A' ? 'text-success-600 dark:text-success-400' :
    result.grade === 'B' ? 'text-primary-600 dark:text-primary-400' :
    result.grade === 'C' ? 'text-accent-600 dark:text-accent-400' :
    result.grade === 'D' ? 'text-warning-600 dark:text-warning-400' :
    'text-error-600 dark:text-error-400';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Link to="/results" className="text-sm text-slate-500 hover:text-primary-600 inline-flex items-center gap-1">
        ← Back to results
      </Link>

      {/* Score hero */}
      <div className={`card p-8 text-center relative overflow-hidden ${passed ? 'border-success-200 dark:border-success-800' : 'border-error-200 dark:border-error-800'}`}>
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${passed ? 'bg-success-100 dark:bg-success-700/20' : 'bg-error-100 dark:bg-error-700/20'}`} />
        <div className="relative">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${passed ? 'bg-success-100 dark:bg-success-700/30 text-success-600 dark:text-success-400' : 'bg-error-100 dark:bg-error-700/30 text-error-600 dark:text-error-400'}`}>
            {passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{exam.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{exam.subject}</p>
          <div className="mt-6 flex items-center justify-center gap-8">
            <div>
              <p className={`text-5xl font-extrabold ${gradeColor}`}>{result.percentage}%</p>
              <p className="text-sm text-slate-400 mt-1">Score</p>
            </div>
            <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <p className={`text-5xl font-extrabold ${gradeColor}`}>{result.grade}</p>
              <p className="text-sm text-slate-400 mt-1">Grade</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className={`badge ${passed ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <Award className="w-5 h-5 mx-auto text-slate-400 mb-1" />
          <p className="text-xl font-bold text-slate-900 dark:text-white">{result.obtained_marks}/{result.total_marks}</p>
          <p className="text-xs text-slate-500">Marks obtained</p>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="w-5 h-5 mx-auto text-slate-400 mb-1" />
          <p className="text-xl font-bold text-slate-900 dark:text-white">{exam.passing_marks}</p>
          <p className="text-xs text-slate-500">Passing marks</p>
        </div>
        <div className="card p-4 text-center">
          <Clock className="w-5 h-5 mx-auto text-slate-400 mb-1" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(result.submitted_at).toLocaleDateString()}</p>
          <p className="text-xs text-slate-500">Submitted</p>
        </div>
      </div>

      {/* Answer review */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Answer Review</h3>
        <div className="space-y-4">
          {questions.map((q, i) => {
            const ans = result.answers?.find((a) => a.questionId === q.id);
            const isCorrect = ans?.selected === q.correct_option;
            return (
              <div key={q.id} className={`p-4 rounded-lg border ${isCorrect ? 'border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-700/10' : 'border-error-200 dark:border-error-800 bg-error-50/50 dark:bg-error-700/10'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect ? 'bg-success-500 text-white' : 'bg-error-500 text-white'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{q.question}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p className={isCorrect ? 'text-success-700 dark:text-success-300' : 'text-error-700 dark:text-error-300'}>
                        {isCorrect ? (
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Correct — {q.options[q.correct_option]}</span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 text-error-700 dark:text-error-300"><XCircle className="w-4 h-4" /> Your answer: {ans?.selected ? q.options[ans.selected] : 'Not answered'}</span>
                            <span className="flex items-center gap-1 text-success-700 dark:text-success-300 mt-1"><CheckCircle2 className="w-4 h-4" /> Correct: {q.options[q.correct_option]}</span>
                          </>
                        )}
                      </p>
                      {q.explanation && (
                        <p className="text-xs text-slate-500 mt-2 pl-5">Explanation: {q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Link to="/exams" className="btn-primary inline-flex">Take another exam <ArrowRight className="w-4 h-4" /></Link>
    </div>
  );
}
