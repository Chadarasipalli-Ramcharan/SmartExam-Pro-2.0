import { useEffect, useState, useMemo } from 'react';
import { CalendarDays, Plus, Pencil, Trash2, Users, Layers, BookOpen, CheckCircle2 } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { fetchAcademicYears } from '@/lib/queries';
import type { AcademicYear, Profile, Section, Subject, Semester } from '@/types';
import { useToast } from '@/context/ToastContext';

interface YearRow extends AcademicYear {
  studentCount: number;
  sectionCount: number;
  subjectCount: number;
}

export function AcademicYearManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<YearRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AcademicYear | null>(null);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [years, profilesRes, sectionsRes, subjectsRes, semestersRes] = await Promise.all([
        fetchAcademicYears(),
        supabase.from('profiles').select('id, role, academic_year_id'),
        supabase.from('sections').select('id, academic_year_id'),
        supabase.from('subjects').select('id, semester_id'),
        supabase.from('semesters').select('id, academic_year_id'),
      ]);
      const profiles = profilesRes.data as Pick<Profile, 'id' | 'role' | 'academic_year_id'>[] | null;
      const sections = sectionsRes.data as Pick<Section, 'id' | 'academic_year_id'>[] | null;
      const subjects = subjectsRes.data as Pick<Subject, 'id' | 'semester_id'>[] | null;
      const semesters = semestersRes.data as Pick<Semester, 'id' | 'academic_year_id'>[] | null;

      // Map semester_id -> academic_year_id for subject counting
      const semToYear = new Map<string, string | null>();
      semesters?.forEach((s) => semToYear.set(s.id, s.academic_year_id));

      const rows: YearRow[] = years.map((y) => ({
        ...y,
        studentCount: profiles?.filter((p) => p.role === 'student' && p.academic_year_id === y.id).length ?? 0,
        sectionCount: sections?.filter((s) => s.academic_year_id === y.id).length ?? 0,
        subjectCount: subjects?.filter((s) => semToYear.get(s.semester_id) === y.id).length ?? 0,
      }));
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openForm(y: AcademicYear | null) {
    setEditing(y); setName(y?.name ?? '');
    setStartDate(y?.start_date ?? ''); setEndDate(y?.end_date ?? ''); setIsActive(y?.is_active ?? true);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast('Name is required', 'error'); return; }
    setSaving(true);
    const payload = { name: name.trim(), start_date: startDate || null, end_date: endDate || null, is_active: isActive };
    const { error } = editing ? await supabase.from('academic_years').update(payload).eq('id', editing.id) : await supabase.from('academic_years').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Academic year updated' : 'Academic year created', 'success');
    setShowForm(false); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('academic_years').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete', 'error'); return; }
    toast('Academic year deleted', 'success');
    setItems((p) => p.filter((y) => y.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((y) => y.is_active).length,
    students: items.reduce((s, y) => s + y.studentCount, 0),
    sections: items.reduce((s, y) => s + y.sectionCount, 0),
  }), [items]);

  const columns = [
    { key: 'name', label: 'Year', render: (y: YearRow) => <span className="font-medium text-slate-900 dark:text-white">{y.name}</span> },
    { key: 'start_date', label: 'Start', render: (y: YearRow) => <span className="text-slate-500 text-sm">{y.start_date ?? '—'}</span> },
    { key: 'end_date', label: 'End', render: (y: YearRow) => <span className="text-slate-500 text-sm">{y.end_date ?? '—'}</span> },
    { key: 'studentCount', label: 'Students', render: (y: YearRow) => <span className="text-slate-500 text-sm">{y.studentCount}</span> },
    { key: 'sectionCount', label: 'Sections', render: (y: YearRow) => <span className="text-slate-500 text-sm">{y.sectionCount}</span> },
    { key: 'subjectCount', label: 'Subjects', render: (y: YearRow) => <span className="text-slate-500 text-sm">{y.subjectCount}</span> },
    { key: 'is_active', label: 'Status', render: (y: YearRow) => <span className={`badge ${y.is_active ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{y.is_active ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: '', render: (y: YearRow) => (
      <div className="flex gap-1">
        <button onClick={() => openForm(y)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(y)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Years" subtitle="Manage academic year periods" icon={CalendarDays}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> New year</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarDays} label="Total Years" value={stats.total} color="primary" />
        <StatCard icon={CheckCircle2} label="Active Years" value={stats.active} color="success" />
        <StatCard icon={Users} label="Total Students" value={stats.students} color="accent" />
        <StatCard icon={Layers} label="Total Sections" value={stats.sections} color="warning" />
      </div>

      {loading ? <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      : items.length === 0 ? <EmptyState icon={CalendarDays} title="No academic years yet" action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Create year</button>} />
      : <DataTable columns={columns} data={items} searchKeys={['name']} pageSize={8} />}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit academic year' : 'Create academic year'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="2025-2026" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Start date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" /></div>
              <div><label className="label">End date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete academic year?" message={`"${deleteTarget?.name}" and all its semesters will be deleted.`} confirmText="Delete" danger />
    </div>
  );
}
