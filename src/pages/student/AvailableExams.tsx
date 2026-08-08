import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Award, ArrowRight, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchPublishedExams, fetchStudentResults, fetchQuestionCount } from '@/lib/queries';
import type { Exam } from '@/types';
import { SkeletonCard } from '@/components/Loading';

export function AvailableExams() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([fetchPublishedExams(), fetchStudentResults(profile.id)])
      .then(([e, r]) => {
        setExams(e);
        setCompleted(new Set(r.map((x) => x.exam_id)));
        return Promise.all(e.map((exam) => fetchQuestionCount(exam.id).then((c) => [exam.id, c] as const)));
      })
      .then((entries) => {
        setQuestionCounts(Object.fromEntries(entries));
      })
      .finally(() => setLoading(false));
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Available Exams</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Available Exams</h1>
        <p className="text-sm text-slate-500 mt-1">Choose an exam to begin. Each exam is timed.</p>
      </div>

      {exams.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No exams are available right now.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => {
            const isDone = completed.has(exam.id);
            const qCount = questionCounts[exam.id] ?? 0;
            return (
              <div key={exam.id} className="card p-5 flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  {isDone && (
                    <span className="badge bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">{exam.title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 flex-1">{exam.description ?? 'No description'}</p>
                <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exam.duration_minutes} min</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {exam.total_marks} marks</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {qCount} questions</span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isDone ? (
                    <Link to={`/results/${exam.id}`} className="btn-secondary w-full text-sm">
                      View result <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link to={`/exam/${exam.id}`} className="btn-primary w-full text-sm">
                      Start exam <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
