import { useEffect, useState, useMemo } from 'react';
import { User, Trash2, Pencil, Filter, BookOpen, CheckCircle2, Users, Building2, UserCog } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/PageHeader';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { SkeletonRow } from '@/components/Loading';
import { StatCard } from '@/components/StatCard';
import { supabase } from '@/lib/supabase';
import { fetchFacultyProfiles, fetchDepartments, fetchSubjects } from '@/lib/queries';
import type { Profile, Department, SubjectWithDetails } from '@/types';
import { useToast } from '@/context/ToastContext';

interface FacultyRow extends Profile {
  subjectCount: number;
}

export function FacultyManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<FacultyRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [editTarget, setEditTarget] = useState<Profile | null>(null);
  const [assignTarget, setAssignTarget] = useState<Profile | null>(null);
  const [fDept, setFDept] = useState('');
  // edit form state
  const [eDept, setEDept] = useState('');
  const [eDesignation, setEDesignation] = useState('');
  const [eStatus, setEStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  // assign subjects state
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [f, d, s] = await Promise.all([fetchFacultyProfiles(), fetchDepartments(), fetchSubjects()]);
      const rows: FacultyRow[] = f.map((fac) => ({
        ...fac,
        subjectCount: s.filter((sub) => sub.faculty_id === fac.id).length,
      }));
      setItems(rows); setDepartments(d); setSubjects(s);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from('profiles').delete().eq('id', deleteTarget.id);
    if (error) { toast('Failed to remove faculty', 'error'); return; }
    toast('Faculty removed', 'success');
    setItems((p) => p.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  function openEdit(f: Profile) {
    setEditTarget(f); setEDept(f.department_id ?? ''); setEDesignation(f.designation ?? ''); setEStatus(f.status);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      department_id: eDept || null, designation: eDesignation.trim() || null, status: eStatus,
    }).eq('id', editTarget.id);
    setSaving(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Faculty updated', 'success');
    setEditTarget(null); load();
  }

  async function toggleStatus(f: Profile) {
    const next = !f.status;
    const { error } = await supabase.from('profiles').update({ status: next }).eq('id', f.id);
    if (error) { toast('Failed to update status', 'error'); return; }
    toast(next ? 'Account enabled' : 'Account disabled', 'success');
    setItems((prev) => prev.map((p) => p.id === f.id ? { ...p, status: next } : p));
  }

  function openAssign(f: Profile) {
    setAssignTarget(f);
    const ids = new Set(subjects.filter((s) => s.faculty_id === f.id).map((s) => s.id));
    setAssignedIds(ids);
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTarget) return;
    setAssignSaving(true);
    const deptSubjects = subjects.filter((s) => s.department_id === assignTarget.department_id);
    const updates: Promise<void>[] = [];
    for (const sub of deptSubjects) {
      const shouldAssign = assignedIds.has(sub.id);
      const isAssigned = sub.faculty_id === assignTarget.id;
      if (shouldAssign && !isAssigned) {
        updates.push(supabase.from('subjects').update({ faculty_id: assignTarget.id }).eq('id', sub.id).then(({ error }) => { if (error) throw error; }) as Promise<void>);
      } else if (!shouldAssign && isAssigned) {
        updates.push(supabase.from('subjects').update({ faculty_id: null }).eq('id', sub.id).then(({ error }) => { if (error) throw error; }) as Promise<void>);
      }
    }
    try {
      await Promise.all(updates);
      toast('Subjects assigned', 'success');
      setAssignTarget(null); load();
    } catch (err: unknown) {
      toast((err as Error).message, 'error');
    } finally { setAssignSaving(false); }
  }

  const deptMap: Record<string, string> = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const filtered = useMemo(() => items.filter((f) => !fDept || f.department_id === fDept), [items, fDept]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((f) => f.status).length,
    subjects: items.reduce((s, f) => s + f.subjectCount, 0),
    departments: new Set(items.map((f) => f.department_id).filter(Boolean)).size,
  }), [items]);

  const columns = [
    { key: 'employee_id', label: 'Employee ID', render: (f: FacultyRow) => <span className="text-slate-500 text-sm font-mono">{f.employee_id ?? '—'}</span> },
    { key: 'full_name', label: 'Faculty', render: (f: FacultyRow) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">{f.full_name.charAt(0).toUpperCase()}</div>
        <div><p className="font-medium text-slate-900 dark:text-white">{f.full_name}</p><p className="text-xs text-slate-400">{f.email}</p></div>
      </div>
    ) },
    { key: 'email', label: 'Email', render: (f: FacultyRow) => <span className="text-slate-500 hidden md:table-cell">{f.email}</span> },
    { key: 'department_id', label: 'Department', render: (f: FacultyRow) => <span className="text-slate-500 text-sm">{f.department_id ? deptMap[f.department_id] ?? '—' : '—'}</span> },
    { key: 'designation', label: 'Designation', render: (f: FacultyRow) => <span className="text-slate-500 text-sm">{f.designation ?? '—'}</span> },
    { key: 'subjectCount', label: 'Subjects', render: (f: FacultyRow) => <span className="text-slate-500 text-sm">{f.subjectCount}</span> },
    { key: 'created_at', label: 'Registered', render: (f: FacultyRow) => <span className="text-slate-500 text-xs">{new Date(f.created_at).toLocaleDateString()}</span> },
    { key: 'status', label: 'Status', render: (f: FacultyRow) => <span className={`badge ${f.status ? 'bg-success-100 dark:bg-success-700/30 text-success-700 dark:text-success-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{f.status ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: '', render: (f: FacultyRow) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(f)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit"><Pencil className="w-4 h-4" /></button>
        <button onClick={() => openAssign(f)} className="p-2 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-700/20" title="Assign subjects"><BookOpen className="w-4 h-4" /></button>
        <button onClick={() => toggleStatus(f)} className={`p-2 rounded-lg ${f.status ? 'text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-700/20' : 'text-success-500 hover:bg-success-50 dark:hover:bg-success-700/20'}`} title={f.status ? 'Disable' : 'Enable'}>{f.status ? <UserCog className="w-4 h-4" /> : <UserCog className="w-4 h-4" />}</button>
        <button onClick={() => setDeleteTarget(f)} className="p-2 rounded-lg text-slate-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    ) },
  ];

  const deptSubjects = assignTarget ? subjects.filter((s) => s.department_id === assignTarget.department_id) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Faculty" subtitle="Manage faculty members" icon={User} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Faculty" value={stats.total} color="primary" />
        <StatCard icon={CheckCircle2} label="Active" value={stats.active} color="success" />
        <StatCard icon={BookOpen} label="Assigned Subjects" value={stats.subjects} color="warning" />
        <StatCard icon={Building2} label="Departments" value={stats.departments} color="accent" />
      </div>

      {loading ? (
        <div className="card p-6 divide-y divide-slate-100 dark:divide-slate-800">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={User} title="No faculty members yet" message="Faculty appear here after they register." />
      ) : (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Filter className="w-4 h-4" /> Filter</div>
            <div><label className="label text-xs">Department</label><select value={fDept} onChange={(e) => setFDept(e.target.value)} className="input"><option value="">All</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            {fDept && <button onClick={() => setFDept('')} className="btn-secondary">Clear</button>}
          </div>
          <DataTable columns={columns} data={filtered} searchKeys={['full_name', 'email', 'employee_id']} pageSize={8} />
        </div>
      )}

      {editTarget && (
        <Modal open onClose={() => setEditTarget(null)} title={`Edit ${editTarget.full_name}`} size="md">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div><label className="label">Department</label><select value={eDept} onChange={(e) => setEDept(e.target.value)} className="input"><option value="">None</option>{departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="label">Designation</label><input type="text" value={eDesignation} onChange={(e) => setEDesignation(e.target.value)} className="input" placeholder="Professor" /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eStatus} onChange={(e) => setEStatus(e.target.checked)} className="rounded" /> Active</label>
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button></div>
          </form>
        </Modal>
      )}

      {assignTarget && (
        <Modal open onClose={() => setAssignTarget(null)} title={`Assign subjects — ${assignTarget.full_name}`} size="lg">
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">Select subjects from <strong>{deptMap[assignTarget.department_id ?? ''] ?? 'their department'}</strong> to assign to this faculty.</p>
            {deptSubjects.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No subjects in this department.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {deptSubjects.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer">
                    <input type="checkbox" checked={assignedIds.has(s.id)} onChange={(e) => {
                      setAssignedIds((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(s.id); else next.delete(s.id);
                        return next;
                      });
                    }} className="rounded" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.code} · {s.credits} credits</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setAssignTarget(null)} className="btn-secondary">Cancel</button><button type="submit" disabled={assignSaving} className="btn-primary">{assignSaving ? 'Saving…' : 'Save assignments'}</button></div>
          </form>
        </Modal>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Remove faculty?" message={`${deleteTarget?.full_name} will be removed from the system.`} confirmText="Remove" danger />
    </div>
  );
}
