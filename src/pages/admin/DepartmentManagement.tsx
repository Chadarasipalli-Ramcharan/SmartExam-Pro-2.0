import { useEffect, useState, useMemo } from 'react';
import { Building2, Plus, Pencil, Trash2, Users, GraduationCap, BookOpen, CheckCircle2, UserCog, X, Mail } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { fetchDepartments, fetchFacultyProfiles, assignHOD, removeHOD } from '@/lib/queries';
import type { Department, Profile, Subject, Section, Semester } from '@/types';
import { useToast } from '@/context/ToastContext';

interface DeptRow extends Department {
  facultyCount: number;
  studentCount: number;
  subjectCount: number;
  sectionCount: number;
  isActive: boolean;
  hodName: string | null;
}

export function DepartmentManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<DeptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // HOD assignment state
  const [showHodModal, setShowHodModal] = useState(false);
  const [hodDept, setHodDept] = useState<DeptRow | null>(null);
  const [allFaculty, setAllFaculty] = useState<Profile[]>([]);
  const [selectedHodId, setSelectedHodId] = useState('');
  const [hodSaving, setHodSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [depts, profilesRes, subjectsRes, sectionsRes, semestersRes] = await Promise.all([
        fetchDepartments(),
        supabase.from('profiles').select('id, role, department_id, full_name'),
        supabase.from('subjects').select('id, department_id'),
        supabase.from('sections').select('id, department_id'),
        supabase.from('semesters').select('id, department_id, is_active'),
      ]);
      const profiles = profilesRes.data as Pick<Profile, 'id' | 'role' | 'department_id' | 'full_name'>[] | null;
      const subjects = subjectsRes.data as Pick<Subject, 'id' | 'department_id'>[] | null;
      const sections = sectionsRes.data as Pick<Section, 'id' | 'department_id'>[] | null;
      const semesters = semestersRes.data as Pick<Semester, 'id' | 'department_id' | 'is_active'>[] | null;

      const rows: DeptRow[] = depts.map((d) => {
        const hod = profiles?.find((p) => p.id === d.hod_id) ?? null;
        const activeSemForDept = semesters?.some((s) => s.department_id === d.id && s.is_active) ?? false;
        return {
          ...d,
          hodName: hod?.full_name ?? null,
          facultyCount: profiles?.filter((p) => p.role === 'faculty' && p.department_id === d.id).length ?? 0,
          studentCount: profiles?.filter((p) => p.role === 'student' && p.department_id === d.id).length ?? 0,
          subjectCount: subjects?.filter((s) => s.department_id === d.id).length ?? 0,
          sectionCount: sections?.filter((s) => s.department_id === d.id).length ?? 0,
          isActive: activeSemForDept,
        };
      });
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openForm(d: Department | null) {
    setEditing(d);
    setName(d?.name ?? ''); setCode(d?.code ?? ''); setDescription(d?.description ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) { toast('Name and code are required', 'error'); return; }
    setSaving(true);
    const payload = { name: name.trim(), code: code.trim().toUpperCase(), description: description.trim() || null };
    const { error } = editing ? await supabase.from('departments').update(payload).eq('id', editing.id) : await supabase.from('departments').insert(payload);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast(editing ? 'Department updated' : 'Department created', 'success');
    setShowForm(false); load();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('departments').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to delete department', 'error'); return; }
    toast('Department deleted', 'success');
    setItems((p) => p.filter((d) => d.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  async function openHodModal(d: DeptRow) {
    setHodDept(d);
    setSelectedHodId('');
    const faculty = await fetchFacultyProfiles();
    setAllFaculty(faculty);
    setShowHodModal(true);
  }

  async function handleAssignHod() {
    if (!hodDept || !selectedHodId) return;
    setHodSaving(true);
    try {
      const fac = allFaculty.find((f) => f.id === selectedHodId);
      if (!fac) return;
      await assignHOD(hodDept.id, fac.id, fac.full_name, fac.email);
      toast(`${fac.full_name} assigned as HOD for ${hodDept.name}.`, 'success');
      setShowHodModal(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to assign HOD', 'error');
    } finally {
      setHodSaving(false);
    }
  }

  async function handleRemoveHod() {
    if (!hodDept) return;
    setHodSaving(true);
    try {
      await removeHOD(hodDept.id);
      toast('HOD removed.', 'success');
      setShowHodModal(false);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove HOD', 'error');
    } finally {
      setHodSaving(false);
    }
  }

  const stats = useMemo(() => ({
    active: items.filter((d) => d.isActive).length,
    students: items.reduce((s, d) => s + d.studentCount, 0),
    faculty: items.reduce((s, d) => s + d.facultyCount, 0),
    subjects: items.reduce((s, d) => s + d.subjectCount, 0),
  }), [items]);

  const columns = [
    { key: 'code', label: 'Code', render: (d: DeptRow) => <span className="badge bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{d.code}</span> },
    { key: 'name', label: 'Department', render: (d: DeptRow) => <span className="font-medium text-slate-900 dark:text-white">{d.name}</span> },
    { key: 'hodName', label: 'HOD', render: (d: DeptRow) => (
      <div className="flex items-center gap-2">
        {d.hodName ? (
          <>
            <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{d.hodName}</span>
            {d.hod_email && <span className="text-xs text-slate-400">({d.hod_email})</span>}
          </>
        ) : <span className="text-slate-400 text-sm">Not assigned</span>}
      </div>
    ) },
    { key: 'facultyCount', label: 'Faculty', render: (d: DeptRow) => <span className="text-slate-500 text-sm">{d.facultyCount}</span> },
    { key: 'studentCount', label: 'Students', render: (d: DeptRow) => <span className="text-slate-500 text-sm">{d.studentCount}</span> },
    { key: 'subjectCount', label: 'Subjects', render: (d: DeptRow) => <span className="text-slate-500 text-sm">{d.subjectCount}</span> },
    { key: 'sectionCount', label: 'Sections', render: (d: DeptRow) => <span className="text-slate-500 text-sm">{d.sectionCount}</span> },
    { key: 'isActive', label: 'Status', render: (d: DeptRow) => <span className={`badge ${d.isActive ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{d.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'description', label: 'Description', render: (d: DeptRow) => <span className="text-slate-400 text-xs">{d.description ?? '—'}</span> },
    { key: 'actions', label: '', render: (d: DeptRow) => (
      <div className="flex gap-1">
        <button onClick={() => openHodModal(d)} className="p-2 rounded-lg text-slate-400 hover:bg-accent-50 hover:text-accent-600 dark:hover:bg-accent-900/20" title="Assign HOD"><UserCog className="w-4 h-4" /></button>
        <button onClick={() => openForm(d)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setDeleteTarget(d)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Departments" subtitle="Manage university departments" icon={Building2}
        action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> New department</button>} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Active Departments" value={stats.active} color="success" />
        <StatCard icon={GraduationCap} label="Total Students" value={stats.students} color="primary" />
        <StatCard icon={Users} label="Total Faculty" value={stats.faculty} color="accent" />
        <StatCard icon={BookOpen} label="Total Subjects" value={stats.subjects} color="warning" />
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Building2} title="No departments yet" message="Create your first department to get started" action={<button onClick={() => openForm(null)} className="btn-primary"><Plus className="w-4 h-4" /> Create department</button>} />
      ) : (
        <DataTable columns={columns} data={items} searchKeys={['name', 'code']} pageSize={8} />
      )}
      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Edit department' : 'Create department'} size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Name</label><input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Computer Science & Engineering" /></div>
            <div><label className="label">Code</label><input type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="input" placeholder="CSE" /></div>
            <div><label className="label">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input min-h-[70px]" /></div>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete department?" message={`"${deleteTarget?.name}" and all its semesters, sections, and subjects will be deleted.`} confirmText="Delete" danger />

      {/* HOD Assignment Modal */}
      {showHodModal && hodDept && (
        <Modal open onClose={() => setShowHodModal(false)} title={`Assign HOD — ${hodDept.name}`} size="md">
          <div className="space-y-4">
            {hodDept.hodName && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Current HOD</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{hodDept.hodName}</p>
                  {hodDept.hod_email && <p className="text-sm text-slate-500">{hodDept.hod_email}</p>}
                </div>
                <button onClick={() => handleRemoveHod()} disabled={hodSaving} className="btn-ghost text-error-600 hover:bg-error-50 flex items-center gap-1"><X className="w-4 h-4" /> Remove</button>
              </div>
            )}
            <div>
              <label className="label">Select Faculty to assign as HOD</label>
              <select value={selectedHodId} onChange={(e) => setSelectedHodId(e.target.value)} className="input">
                <option value="">— Select faculty —</option>
                {allFaculty.filter((f) => f.department_id === hodDept.id).map((f) => (
                  <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>
                ))}
              </select>
              {allFaculty.filter((f) => f.department_id === hodDept.id).length === 0 && (
                <p className="text-xs text-error-500 mt-2">No faculty members in this department. Add faculty first.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowHodModal(false)} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleAssignHod} disabled={!selectedHodId || hodSaving} className="btn-primary flex items-center gap-2"><UserCog className="w-4 h-4" /> {hodSaving ? 'Assigning…' : 'Assign HOD'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
