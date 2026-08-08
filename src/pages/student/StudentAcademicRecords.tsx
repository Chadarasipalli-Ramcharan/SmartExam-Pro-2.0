import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, Download, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonRow } from '@/components/Loading';
import { supabase } from '@/lib/supabase';
import type { AcademicRecordWithDetails } from '@/types';

export function StudentAcademicRecords() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error: err } = await supabase
        .from('academic_records')
        .select('*, student:profiles!student_id(full_name, enrollment_number), subject:subjects(name, code), semester:semesters(name), section:sections(name), faculty:profiles!faculty_id(full_name)')
        .eq('student_id', profile.id)
        .order('updated_at', { ascending: false });
      if (err) throw err;
      setRecords((data as unknown as AcademicRecordWithDetails[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadRecords();
    if (!profile?.id) return;
    const channel = supabase
      .channel('academic-records-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academic_records', filter: `student_id=eq.${profile.id}` }, () => {
        loadRecords();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.id, loadRecords]);

  function downloadPDF() {
    if (!profile || records.length === 0) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = records.map((r) => `
      <tr>
        <td>${r.subject?.code ?? ''}</td>
        <td>${r.subject?.name ?? ''}</td>
        <td>${r.internal_marks}</td>
        <td>${r.external_marks}</td>
        <td>${r.assignment_marks}</td>
        <td>${r.quiz_marks}</td>
        <td>${r.lab_marks}</td>
        <td>${r.practical_marks}</td>
        <td><strong>${r.total_marks}</strong></td>
        <td>${r.percentage}%</td>
        <td>${r.grade}</td>
        <td>${r.pass_fail === 'pass' ? 'Pass' : 'Fail'}</td>
      </tr>`).join('');
    printWindow.document.write(`
      <html><head><title>Mark Sheet - ${profile.full_name}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; color: #64748b; margin-bottom: 24px; }
        .info { margin-bottom: 24px; }
        .info p { margin: 4px 0; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: center; font-size: 13px; }
        th { background: #f1f5f9; font-weight: 600; }
        .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style></head><body>
      <h1>SmartExam Pro - Academic Mark Sheet</h1>
      <p class="sub">Official Academic Record</p>
      <div class="info">
        <p><strong>Name:</strong> ${profile.full_name}</p>
        <p><strong>Enrollment Number:</strong> ${profile.enrollment_number ?? 'N/A'}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <table>
        <thead><tr>
          <th>Code</th><th>Subject</th><th>Internal</th><th>External</th>
          <th>Assignment</th><th>Quiz</th><th>Lab</th><th>Practical</th>
          <th>Total</th><th>%</th><th>Grade</th><th>Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer">This is a system-generated mark sheet. SmartExam Pro 2.0</p>
      </body></html>`);
    printWindow.document.close();
    printWindow.print();
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Academic Records" subtitle="Your academic performance across all subjects" />
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Records"
        subtitle="Your academic performance across all subjects"
        icon={GraduationCap}
        action={
          records.length > 0 ? (
            <button onClick={downloadPDF} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Mark Sheet
            </button>
          ) : undefined
        }
      />

      {error && <p className="text-sm text-error-600 dark:text-error-500 mb-4">{error}</p>}

      {records.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No academic records"
          message="Your marks will appear here once your faculty uploads them."
        />
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {r.subject?.name ?? 'Unknown Subject'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.subject?.code ?? ''} · {r.semester?.name ?? ''} · Section {r.section?.name ?? 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${r.pass_fail === 'pass' ? 'badge-success' : 'badge-error'}`}>
                    {r.pass_fail === 'pass' ? 'Pass' : 'Fail'}
                  </span>
                  <span className={`badge ${r.grade.startsWith('A') ? 'badge-success' : r.grade === 'F' ? 'badge-error' : 'badge-warning'}`}>
                    Grade {r.grade}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { label: 'Internal', value: r.internal_marks },
                  { label: 'External', value: r.external_marks },
                  { label: 'Assignment', value: r.assignment_marks },
                  { label: 'Quiz', value: r.quiz_marks },
                  { label: 'Lab', value: r.lab_marks },
                  { label: 'Practical', value: r.practical_marks },
                  { label: 'Total', value: r.total_marks, highlight: true },
                ].map((m) => (
                  <div key={m.label} className={`rounded-lg p-3 text-center ${m.highlight ? 'bg-primary-50 dark:bg-primary-900/30' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                    <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                    <p className={`text-lg font-bold ${m.highlight ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Percentage</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{r.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Faculty</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{r.faculty?.full_name ?? '—'}</p>
                  </div>
                  {r.remarks && (
                    <div>
                      <p className="text-xs text-slate-400">Remarks</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{r.remarks}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Updated {new Date(r.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
