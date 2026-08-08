import { useEffect, useState, useMemo } from 'react';
import { Layers, Plus, Pencil, Trash2, BookOpen, Users, CheckCircle2, CalendarDays } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { fetchSemesters, fetchDepartments, fetchAcademicYears } from '@/lib/queries';
import type { Semester, Department, AcademicYear, Profile, Subject } from '@/types';
import { useToast } from '@/context/ToastContext';

interface SemRow extends Semester {
  subjectCount: number;
  studentCount: number;
}

export function SemesterManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<SemRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Semester | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Semester | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, d, y, profilesRes, subjectsRes] = await Promise.all([
        fetchSemesters(), fetchDepartments(), fetchAcademicYears(),
        supabase.from('profiles').select('id, role, semester_id'),
        supabase.from('subjects').select('id, semester_id'),
      ]);
      const profiles = profilesRes.data as Pick<Profile, 'id' | 'role' | 'semester_id'>[] | null;
      const subjects = subjectsRes.data as Pick<Subject, 'id' | 'semester_id'>[] | null;
      const rows: SemRow[] = s.map((sem) => ({
        ...sem,
        subjectCount: subjects?.filter((sub) => sub.semester_id === sem.id).length ?? 0,
        studentCount: profiles?.filter((p) => p.role === 'student' && p.semester_id === sem.id).length ?? 0,
      }));
      setItems(rows); setDepartments(d); setAcademicYears(y);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openForm(s: Semester | null) {
    setEditing(s); setName(s?.name ?? '');
    setDepartmentId(s?.department_id ?? ''); setAcademicYearId(s?.academic_year_id ?? ''); setIsActive(s?.is_active ?? true);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !departmentId || !academicYearId) { toast('All fields are required', 'error'); return; }
    setSaving(true);
    const payload = { name: name.trim(), department_id: departmentId, academic_year_id: academicYearId, is_active: isActive };
    const { error } = editing ? await supabase.from('semesters').update(payload).eq('id', editing.id) : await supabase.from('semesters').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Semester updated' : 'Semester created', 'success');
    setShowForm(false); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('semesters').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete', 'error'); return; }
    toast('Semester deleted', 'success');
    setItems((p) => p.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const deptMap: Record<string, string> = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const ayMap: Record<string, string> = Object.fromEntries(academicYears.map((y) => [y.id, y.name]));

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((s) => s.is_active).length,
    subjects: items.reduce((s, x) => s + x.subjectCount, 0),
    students: items.reduce((s, x) => s + x.studentCount, 0),
  }), [items]);

  const columns = [
    { key: 'name', label: 'Semester', render: (s: SemRow) => <span className="font-medium text-slate-900 dark:text-white">{s.name}</span> },
    { key: 'academic_year_id', label: 'Academic Year', render: (s: SemRow) => <span className="text-slate-500 text-sm">{s.academic_year_id ? ayMap[s.academic_year_id] ?? '—' : '—'}</span> },
    { key: 'department_id', label: 'Department', render: (s: SemRow) => <span className="text-slate-500 text-sm">{s.department_id ? deptMap[s.department_id] ?? '—' : '—'}</span> },
    { key: 'subjectCount', label: 'Subjects', render: (s: SemRow) => <span className="text-slate-500 text-sm">{s.subjectCount}</span> },
    { key: 'studentCount', label: 'Students', render: (s: SemRow) => <span className="text-slate-500 text-sm">{s.studentCount}</span> },
    { key: 'is_active', label: 'Status', render: (s: SemRow) => <span className={`badge ${s.is_active ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: '', render: (s: SemRow) => (
      <div className="flex gap-1">
        <button onClick={() => openForm(s)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Semesters" subtitle="Manage semesters within departments" icon={Layers}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> New semester</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Semesters" value={stats.total} color="primary" />
        <StatCard icon={CheckCircle2} label="Active Semesters" value={stats.active} color="success" />
        <StatCard icon={BookOpen} label="Total Subjects" value={stats.subjects} color="warning" />
        <StatCard icon={Users} label="Total Students" value={stats.students} color="accent" />
      </div>

      {loading ? <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      : items.length === 0 ? <EmptyState icon={Layers} title="No semesters yet" action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Create semester</button>} />
      : <DataTable columns={columns} data={items} searchKeys={['name']} pageSize={8} />}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit semester' : 'Create semester'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Semester 1" /></div>
            <div><label className="label">Department</label><select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input" required><option value="">Select department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label">Academic Year</label><select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input" required><option value="">Select year</option>{academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete semester?" message={`"${deleteTarget?.name}" and all its sections will be deleted.`} confirmText="Delete" danger />
    </div>
  );
}
