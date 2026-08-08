import { useEffect, useState, useMemo } from 'react';
import { Users, Plus, Pencil, Trash2, CalendarDays, Layers, Building2, UserCheck, GraduationCap } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { fetchDepartments, fetchSemesters, fetchSections, fetchAcademicYears } from '@/lib/queries';
import type { Section, Department, Semester, AcademicYear, Profile } from '@/types';
import { useToast } from '@/context/ToastContext';

interface SectionRow extends Section {
  studentCount: number;
  advisorName: string | null;
}

export function SectionManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<SectionRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Section | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [capacity, setCapacity] = useState(60);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, d, sem, ay, profilesRes] = await Promise.all([
        fetchSections(), fetchDepartments(), fetchSemesters(), fetchAcademicYears(),
        supabase.from('profiles').select('id, role, section_id, full_name'),
      ]);
      const profiles = profilesRes.data as Pick<Profile, 'id' | 'role' | 'section_id' | 'full_name'>[] | null;
      const rows: SectionRow[] = s.map((sec) => {
        const advisor = profiles?.find((p) => p.id === sec.class_advisor_id) ?? null;
        return {
          ...sec,
          advisorName: advisor?.full_name ?? null,
          studentCount: profiles?.filter((p) => p.role === 'student' && p.section_id === sec.id).length ?? 0,
        };
      });
      setItems(rows); setDepartments(d); setSemesters(sem); setAcademicYears(ay);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openForm(s: Section | null) {
    setEditing(s); setName(s?.name ?? '');
    setDepartmentId(s?.department_id ?? ''); setSemesterId(s?.semester_id ?? '');
    setAcademicYearId(s?.academic_year_id ?? ''); setCapacity(s?.capacity ?? 60);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !departmentId || !semesterId) { toast('All fields are required', 'error'); return; }
    setSaving(true);
    const payload = { name: name.trim(), department_id: departmentId, semester_id: semesterId, academic_year_id: academicYearId || null, capacity };
    const { error } = editing ? await supabase.from('sections').update(payload).eq('id', editing.id) : await supabase.from('sections').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Section updated' : 'Section created', 'success');
    setShowForm(false); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('sections').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete', 'error'); return; }
    toast('Section deleted', 'success');
    setItems((p) => p.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const deptMap: Record<string, string> = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const semMap: Record<string, string> = Object.fromEntries(semesters.map((s) => [s.id, s.name]));
  const ayMap: Record<string, string> = Object.fromEntries(academicYears.map((y) => [y.id, y.name]));

  const stats = useMemo(() => ({
    total: items.length,
    students: items.reduce((s, x) => s + x.studentCount, 0),
    advisors: items.filter((x) => x.advisorName).length,
    capacity: items.reduce((s, x) => s + (x.capacity ?? 0), 0),
  }), [items]);

  const columns = [
    { key: 'academic_year_id', label: 'Academic Year', render: (s: SectionRow) => <span className="text-slate-500 text-sm">{s.academic_year_id ? ayMap[s.academic_year_id] ?? '—' : '—'}</span> },
    { key: 'semester_id', label: 'Semester', render: (s: SectionRow) => <span className="text-slate-500 text-sm">{s.semester_id ? semMap[s.semester_id] ?? '—' : '—'}</span> },
    { key: 'department_id', label: 'Department', render: (s: SectionRow) => <span className="text-slate-500 text-sm">{s.department_id ? deptMap[s.department_id] ?? '—' : '—'}</span> },
    { key: 'name', label: 'Section', render: (s: SectionRow) => <span className="font-medium text-slate-900 dark:text-white">Section {s.name}</span> },
    { key: 'advisorName', label: 'Class Advisor', render: (s: SectionRow) => <span className="text-slate-500 text-sm">{s.advisorName ?? '—'}</span> },
    { key: 'studentCount', label: 'Students', render: (s: SectionRow) => <span className="text-slate-500 text-sm">{s.studentCount}</span> },
    { key: 'capacity', label: 'Capacity', render: (s: SectionRow) => <span className="text-slate-400 text-xs">{s.capacity}</span> },
    { key: 'actions', label: '', render: (s: SectionRow) => (
      <div className="flex gap-1">
        <button onClick={() => openForm(s)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sections" subtitle="Manage sections within semesters" icon={Users}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> New section</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Sections" value={stats.total} color="primary" />
        <StatCard icon={GraduationCap} label="Total Students" value={stats.students} color="accent" />
        <StatCard icon={UserCheck} label="With Advisor" value={stats.advisors} color="success" />
        <StatCard icon={Layers} label="Total Capacity" value={stats.capacity} color="warning" />
      </div>

      {loading ? <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      : items.length === 0 ? <EmptyState icon={Users} title="No sections yet" action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Create section</button>} />
      : <DataTable columns={columns} data={items} searchKeys={['name']} pageSize={8} />}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit section' : 'Create section'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="A" /></div>
            <div><label className="label">Department</label><select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input" required><option value="">Select department</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label">Academic Year</label><select value={academicYearId} onChange={(e) => setAcademicYearId(e.target.value)} className="input"><option value="">None</option>{academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></div>
            <div><label className="label">Semester</label><select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} className="input" required disabled={!departmentId}><option value="">Select semester</option>{semesters.filter((s) => s.department_id === departmentId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="label">Capacity</label><input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="input" /></div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete section?" message={`Section ${deleteTarget?.name} will be deleted.`} confirmText="Delete" danger />
    </div>
  );
}
