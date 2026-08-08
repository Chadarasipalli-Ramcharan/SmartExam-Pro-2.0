import { useEffect, useState } from 'react';
import { BookOpen, Hash, Award, User, Building2, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonCard } from '@/components/Loading';
import { fetchSubjects } from '@/lib/queries';
import type { SubjectWithDetails } from '@/types';

export function StudentSubjects() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);

  useEffect(() => {
    if (!profile?.semester_id) return;
    let mounted = true;
    (async () => {
      try {
        const data = await fetchSubjects({
          semesterId: profile.semester_id ?? undefined,
          sectionId: profile.section_id ?? undefined,
        });
        if (mounted) setSubjects(data);
      } catch (err) {
        console.error('Subjects load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.semester_id, profile?.section_id]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="My Subjects" subtitle="Subjects assigned to your semester and section" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Subjects"
        subtitle="Subjects assigned to your semester and section"
        icon={BookOpen}
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects found"
          message="No subjects have been assigned to your semester and section yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <div key={s.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="badge badge-primary">{s.code}</span>
                    <span className={`badge ${s.status === 'active' || !s.status ? 'badge-success' : 'badge-warning'}`}>
                      {s.status === 'active' || !s.status ? 'Active' : s.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                    {s.name}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shrink-0 ml-2">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{s.faculty?.full_name ?? 'No faculty assigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Award className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{s.credits} Credits</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{s.department?.name ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{s.semester?.name ?? 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Section {s.section?.name ?? 'N/A'}</span>
                </div>
                {s.room_number && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Room {s.room_number}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success-500" />
                <span className="text-xs text-slate-400">Enrolled</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
