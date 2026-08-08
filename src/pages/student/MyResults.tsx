import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchStudentResults, fetchPublishedExams } from '@/lib/queries';
import type { Result, Exam } from '@/types';
import { SkeletonRow } from '@/components/Loading';

export function MyResults() {
  const { profile } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    Promise.all([fetchStudentResults(profile.id), fetchPublishedExams()])
      .then(([r, e]) => {
        setResults(r);
        setExams(e);
      })
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Results</h1>
        <p className="text-sm text-slate-500 mt-1">All your exam attempts and scores.</p>
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">You haven't taken any exams yet.</p>
          <Link to="/exams" className="btn-primary mt-4 inline-flex">Browse exams <ArrowRight className="w-4 h-4" /></Link>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {results.map((r) => {
            const exam = exams.find((e) => e.id === r.exam_id);
            return (
              <Link
                key={r.id}
                to={`/results/${r.exam_id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${r.status === 'pass' ? 'bg-success-100 dark:bg-success-700/30 text-success-600 dark:text-success-400' : 'bg-error-100 dark:bg-error-700/30 text-error-600 dark:text-error-400'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{exam?.title ?? 'Exam'}</p>
                    <p className="text-xs text-slate-400">{new Date(r.submitted_at).toLocaleDateString()} · {r.obtained_marks}/{r.total_marks} marks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{r.percentage}%</p>
                    <p className={`text-xs font-medium ${r.status === 'pass' ? 'text-success-600' : 'text-error-600'}`}>{r.grade} · {r.status}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
