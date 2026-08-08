import { useEffect, useState } from 'react';
import {
  BookOpen, FileText, Presentation, FileSpreadsheet, Image, Video, Link2, Download, ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { SkeletonCard } from '@/components/Loading';
import { fetchMaterials, fetchSubjects } from '@/lib/queries';
import type { MaterialWithDetails, MaterialType, SubjectWithDetails } from '@/types';

const typeConfig: Record<MaterialType, { icon: LucideIcon; color: string }> = {
  pdf: { icon: FileText, color: 'text-error-600 dark:text-error-500 bg-error-50 dark:bg-error-700/20' },
  ppt: { icon: Presentation, color: 'text-warning-600 dark:text-warning-500 bg-warning-50 dark:bg-warning-700/20' },
  docx: { icon: FileSpreadsheet, color: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' },
  image: { icon: Image, color: 'text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-900/30' },
  video: { icon: Video, color: 'text-success-600 dark:text-success-500 bg-success-50 dark:bg-success-700/20' },
  link: { icon: Link2, color: 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800' },
};

export function StudentMaterials() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<MaterialWithDetails[]>([]);

  useEffect(() => {
    if (!profile?.semester_id) return;
    let mounted = true;
    (async () => {
      try {
        const [allMaterials, subjects] = await Promise.all([
          fetchMaterials(),
          fetchSubjects({
            semesterId: profile.semester_id ?? undefined,
            sectionId: profile.section_id ?? undefined,
          }),
        ]);
        if (!mounted) return;
        const subjectIds = new Set(subjects.map((s: SubjectWithDetails) => s.id));
        const filtered = allMaterials.filter((m) => subjectIds.has(m.subject_id));
        if (mounted) setMaterials(filtered);
      } catch (err) {
        console.error('Materials load error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.semester_id, profile?.section_id]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Study Materials" subtitle="Browse materials for your subjects" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Study Materials"
        subtitle="Browse materials for your subjects"
        icon={BookOpen}
      />

      {materials.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No materials found"
          message="No study materials have been uploaded for your subjects yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((m) => {
            const cfg = typeConfig[m.material_type];
            const Icon = cfg.icon;
            const url = m.file_url ?? m.external_url ?? null;
            const isExternal = m.material_type === 'link' || !!m.external_url;
            return (
              <div key={m.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${cfg.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="badge badge-secondary uppercase">{m.material_type}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {m.title}
                </h3>
                {m.description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {m.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {m.subject?.code ?? '—'} · {m.subject?.name ?? ''}
                  </span>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-1.5 text-xs"
                    >
                      {isExternal ? (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" /> Download
                        </>
                      )}
                    </a>
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
