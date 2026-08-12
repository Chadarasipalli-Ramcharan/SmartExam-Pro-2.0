import { useEffect, useState } from 'react';
import { ClipboardList, Award, Download } from 'lucide-react';
import { fetchAllResults, fetchAllExams, fetchAllProfiles } from '@/lib/queries';
import type { Result, Exam, Profile } from '@/types';
import { DataTable } from '@/components/DataTable';
import { SkeletonRow } from '@/components/Loading';
import { useToast } from '@/context/ToastContext';

export function ResultManagement() {
  const { toast } = useToast();
  const [results, setResults] = useState<Result[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllResults(), fetchAllExams(), fetchAllProfiles()])
      .then(([r, e, p]) => {
        setResults(r);
        setExams(e);
        setProfiles(p);
      })
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    const rows = [
      ['Student', 'Email', 'Exam', 'Subject', 'Obtained', 'Total', 'Percentage', 'Grade', 'Status', 'Submitted At'],
      ...results.map((r) => {
        const student = profiles.find((p) => p.id === r.student_id);
        const exam = exams.find((e) => e.id === r.exam_id);
        return [
          student?.full_name ?? '',
          student?.email ?? '',
          exam?.title ?? '',
          exam?.subject ?? '',
          String(r.obtained_marks),
          String(r.total_marks),
          String(r.percentage),
          r.grade,
          r.status,
          new Date(r.submitted_at).toLocaleString(),
        ];
      }),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AcadNexus-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast('Results exported to CSV', 'success');
  }

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (r: Result) => {
        const s = profiles.find((p) => p.id === r.student_id);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-xs shrink-0">
              {s?.full_name?.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">{s?.full_name ?? 'Unknown'}</p>
              <p className="text-xs text-slate-400">{s?.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'exam',
      label: 'Exam',
      render: (r: Result) => {
        const e = exams.find((x) => x.id === r.exam_id);
        return (
          <div>
            <p className="font-medium text-slate-900 dark:text-white text-sm">{e?.title ?? 'Exam'}</p>
            <p className="text-xs text-slate-400">{e?.subject}</p>
          </div>
        );
      },
    },
    {
      key: 'obtained_marks',
      label: 'Score',
      render: (r: Result) => <span className="font-medium text-slate-700 dark:text-slate-300">{r.obtained_marks}/{r.total_marks}</span>,
    },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (r: Result) => <span className="font-bold text-slate-900 dark:text-white">{r.percentage}%</span>,
    },
    {
      key: 'grade',
      label: 'Grade',
      render: (r: Result) => (
        <span className={`badge font-bold ${
          r.grade === 'A+' || r.grade === 'A' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' :
          r.grade === 'B' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' :
          r.grade === 'C' ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300' :
          r.grade === 'D' ? 'bg-warning-100 dark:bg-warning-700/30 text-warning-700 dark:text-warning-300' :
          'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300'
        }`}>{r.grade}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (r: Result) => (
        <span className={`badge ${r.status === 'pass' ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-error-100 dark:bg-error-700/30 text-error-700 dark:text-error-300'}`}>
          {r.status}
        </span>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (r: Result) => <span className="text-xs text-slate-500">{new Date(r.submitted_at).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Result Management</h1>
          <p className="text-sm text-slate-500 mt-1">All exam attempts and scores across students.</p>
        </div>
        {results.length > 0 && (
          <button onClick={exportCSV} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">No results yet.</p>
          <p className="text-xs text-slate-400 mt-1">Results appear here once students submit exams.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={results}
          searchKeys={[]}
          searchable={false}
          pageSize={10}
        />
      )}
    </div>
  );
}
