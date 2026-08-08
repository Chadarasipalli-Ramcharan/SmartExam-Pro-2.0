import { useEffect, useMemo, useState } from 'react';
import { GraduationCap, Upload, Download, Plus, Edit2, Trash2, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PageHeader } from '@/components/PageHeader';
import { Modal } from '@/components/Modal';
import {
  fetchAcademicRecords, upsertAcademicRecord, deleteAcademicRecord, createMarkUpload,
  fetchSubjects, fetchStudentProfiles, fetchDepartments, fetchAcademicYears, fetchSemesters, fetchSections,
} from '@/lib/queries';
import type { AcademicRecordWithDetails, Subject, Profile, Department, AcademicYear, Semester, Section } from '@/types';

type MarkRow = {
  student_id: string;
  internal_marks: number;
  external_marks: number;
  assignment_marks: number;
  quiz_marks: number;
  lab_marks: number;
  practical_marks: number;
};

const emptyRow = (): MarkRow => ({
  student_id: '',
  internal_marks: 0, external_marks: 0, assignment_marks: 0,
  quiz_marks: 0, lab_marks: 0, practical_marks: 0,
});

export function FacultyAcademicRecords() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [records, setRecords] = useState<AcademicRecordWithDetails[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AcademicRecordWithDetails | null>(null);
  const [uploadMode, setUploadMode] = useState<'manual' | 'csv' | null>(null);

  // Manual entry form state
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [rows, setRows] = useState<MarkRow[]>([emptyRow()]);

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState(false);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    Promise.all([
      fetchSubjects(), fetchStudentProfiles(), fetchDepartments(),
      fetchAcademicYears(), fetchSemesters(), fetchSections(),
    ]).then(([sub, stu, dept, ay, sem, sec]) => {
      setSubjects(sub); setStudents(stu); setDepartments(dept);
      setAcademicYears(ay); setSemesters(sem); setSections(sec);
    }).finally(() => setLoading(false));
  }, []);

  const loadRecords = async () => {
    if (!profile) return;
    const data = await fetchAcademicRecords({ facultyId: profile.id });
    setRecords(data);
  };

  useEffect(() => {
    if (profile) loadRecords();
  }, [profile]);

  const facultySubjects = useMemo(() => {
    if (!profile) return [];
    return subjects.filter((s) => s.faculty_id === profile.id);
  }, [subjects, profile]);

  const facultyStudents = useMemo(() => {
    if (!profile) return [];
    const deptIds = new Set(facultySubjects.map((s) => s.department_id));
    return students.filter((s) => s.department_id && deptIds.has(s.department_id));
  }, [students, facultySubjects]);

  const filteredRecords = useMemo(() => {
    let r = records;
    if (filterSubject) r = r.filter((x) => x.subject_id === filterSubject);
    if (filterSemester) r = r.filter((x) => x.semester_id === filterSemester);
    return r;
  }, [records, filterSubject, filterSemester]);

  const openManualModal = (record?: AcademicRecordWithDetails) => {
    if (record) {
      setEditingRecord(record);
      setSelectedSubject(record.subject_id);
      setSelectedAcademicYear(record.academic_year_id ?? '');
      setSelectedSemester(record.semester_id ?? '');
      setSelectedSection(record.section_id ?? '');
      setRows([{
        student_id: record.student_id,
        internal_marks: record.internal_marks,
        external_marks: record.external_marks,
        assignment_marks: record.assignment_marks,
        quiz_marks: record.quiz_marks,
        lab_marks: record.lab_marks,
        practical_marks: record.practical_marks,
      }]);
    } else {
      setEditingRecord(null);
      setSelectedSubject(''); setSelectedAcademicYear(''); setSelectedSemester(''); setSelectedSection('');
      setRows([emptyRow()]);
    }
    setUploadMode(null);
    setCsvFile(null); setCsvData([]); setCsvErrors([]); setCsvPreview(false);
    setShowModal(true);
  };

  const openCsvModal = () => {
    setEditingRecord(null);
    setSelectedSubject(''); setSelectedAcademicYear(''); setSelectedSemester(''); setSelectedSection('');
    setRows([emptyRow()]);
    setUploadMode('csv');
    setCsvFile(null); setCsvData([]); setCsvErrors([]); setCsvPreview(false);
    setShowModal(true);
  };

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (idx: number) => setRows((r) => r.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof MarkRow, value: string) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: field === 'student_id' ? value : Number(value) || 0 } : row)));

  const downloadTemplate = () => {
    const headers = ['Enrollment Number', 'Student Name', 'Department', 'Semester', 'Section', 'Internal', 'External', 'Assignment', 'Quiz', 'Lab', 'Practical'];
    const csv = [headers.join(','), 'CSE2024001,John Doe,CSE,Semester 1,A,40,55,8,7,15,15'].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'academic_records_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (file: File) => {
    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.trim().split('\n').map((l) => l.split(',').map((c) => c.trim()));
      setCsvData(lines);
      setCsvPreview(true);
    };
    reader.readAsText(file);
  };

  const validateCsv = (): { valid: MarkRow[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: MarkRow[] = [];
    if (csvData.length < 2) { errors.push('File is empty or has no data rows.'); return { valid, errors }; }
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      const enrollment = row[0];
      const student = facultyStudents.find((s) => s.enrollment_number === enrollment);
      if (!student) { errors.push(`Row ${i + 1}: Student "${enrollment}" not found.`); continue; }
      const marks = row.slice(5).map((m) => Number(m) || 0);
      if (marks.some((m) => m < 0 || m > 100)) errors.push(`Row ${i + 1}: Marks out of range.`);
      valid.push({
        student_id: student.id,
        internal_marks: marks[0] || 0, external_marks: marks[1] || 0,
        assignment_marks: marks[2] || 0, quiz_marks: marks[3] || 0,
        lab_marks: marks[4] || 0, practical_marks: marks[5] || 0,
      });
    }
    return { valid, errors };
  };

  const handleSave = async () => {
    if (!profile) return;
    if (!selectedSubject) { toast('Please select a subject.', 'error'); return; }
    const subject = subjects.find((s) => s.id === selectedSubject);
    if (!subject) return;

    try {
      if (uploadMode === 'csv' && csvPreview) {
        const { valid, errors } = validateCsv();
        setCsvErrors(errors);
        if (valid.length === 0) { toast('No valid rows to upload.', 'error'); return; }
        let success = 0;
        for (const row of valid) {
          await upsertAcademicRecord({
            student_id: row.student_id, faculty_id: profile.id, subject_id: selectedSubject,
            department_id: subject.department_id, semester_id: selectedSemester || null,
            section_id: selectedSection || null, academic_year_id: selectedAcademicYear || null,
            internal_marks: row.internal_marks, external_marks: row.external_marks,
            assignment_marks: row.assignment_marks, quiz_marks: row.quiz_marks,
            lab_marks: row.lab_marks, practical_marks: row.practical_marks,
            uploaded_by: profile.id,
          });
          success++;
        }
        await createMarkUpload({
          faculty_id: profile.id, subject_id: selectedSubject, department_id: subject.department_id,
          semester_id: selectedSemester || null, section_id: selectedSection || null,
          academic_year_id: selectedAcademicYear || null, upload_type: 'csv',
          file_name: csvFile?.name ?? null, total_records: valid.length + errors.length,
          success_count: success, error_count: errors.length, status: errors.length > 0 ? 'completed' : 'completed',
          errors: errors.map((e) => ({ error: e })),
        });
        toast(`Uploaded ${success} records${errors.length > 0 ? ` with ${errors.length} errors` : ''}.`, 'success');
      } else {
        for (const row of rows) {
          if (!row.student_id) continue;
          await upsertAcademicRecord({
            student_id: row.student_id, faculty_id: profile.id, subject_id: selectedSubject,
            department_id: subject.department_id, semester_id: selectedSemester || null,
            section_id: selectedSection || null, academic_year_id: selectedAcademicYear || null,
            internal_marks: row.internal_marks, external_marks: row.external_marks,
            assignment_marks: row.assignment_marks, quiz_marks: row.quiz_marks,
            lab_marks: row.lab_marks, practical_marks: row.practical_marks,
            uploaded_by: profile.id,
          });
        }
        await createMarkUpload({
          faculty_id: profile.id, subject_id: selectedSubject, department_id: subject.department_id,
          semester_id: selectedSemester || null, section_id: selectedSection || null,
          academic_year_id: selectedAcademicYear || null, upload_type: 'manual',
          total_records: rows.length, success_count: rows.filter((r) => r.student_id).length,
          error_count: rows.filter((r) => !r.student_id).length, status: 'completed',
        });
        toast(editingRecord ? 'Academic record updated.' : 'Academic records saved.', 'success');
      }
      await loadRecords();
      setShowModal(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save records.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAcademicRecord(id);
      toast('Record deleted.', 'success');
      await loadRecords();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete.', 'error');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Records" subtitle="Upload and manage student academic marks." />

      <div className="flex flex-wrap gap-3">
        <button onClick={() => openManualModal()} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Manual Entry
        </button>
        <button onClick={openCsvModal} className="btn-secondary flex items-center gap-2">
          <Upload className="w-4 h-4" /> CSV Upload
        </button>
        <button onClick={downloadTemplate} className="btn-ghost flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="input">
              <option value="">All Subjects</option>
              {facultySubjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
            <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="input">
              <option value="">All Semesters</option>
              {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Records table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Internal</th>
                <th className="px-4 py-3">External</th>
                <th className="px-4 py-3">Assignment</th>
                <th className="px-4 py-3">Quiz</th>
                <th className="px-4 py-3">Lab</th>
                <th className="px-4 py-3">Practical</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">%</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-12 text-center text-slate-400">No academic records yet. Upload marks to get started.</td></tr>
              ) : filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{r.student?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{r.student?.enrollment_number ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.subject?.code ?? ''}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.internal_marks}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.external_marks}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.assignment_marks}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.quiz_marks}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.lab_marks}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.practical_marks}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.total_marks}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.percentage}%</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${r.grade.startsWith('A') ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : r.grade === 'F' ? 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300' : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'}`}>{r.grade}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${r.pass_fail === 'pass' ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300' : 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300'}`}>{r.pass_fail}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openManualModal(r)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingRecord ? 'Edit Academic Record' : uploadMode === 'csv' ? 'CSV Upload' : 'Manual Marks Entry'} size="xl">
        <div className="space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Subject *</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="input">
                <option value="">Select subject</option>
                {facultySubjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Academic Year</label>
              <select value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)} className="input">
                <option value="">Select year</option>
                {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Semester</label>
              <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="input">
                <option value="">Select semester</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="input">
                <option value="">Select section</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {uploadMode === 'csv' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-2">Upload a CSV file with student marks</p>
                <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleCsvFile(e.target.files[0])} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="btn-secondary cursor-pointer inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Choose File
                </label>
                {csvFile && <p className="text-xs text-slate-400 mt-2">{csvFile.name}</p>}
              </div>

              {csvPreview && csvData.length > 1 && (
                <div className="overflow-x-auto max-h-64 rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>{csvData[0].map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-slate-500">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {csvData.slice(1, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          {row.map((cell, j) => <td key={j} className="px-3 py-2 text-slate-600 dark:text-slate-300">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 51 && <p className="text-xs text-slate-400 p-2 text-center">Showing 50 of {csvData.length - 1} rows</p>}
                </div>
              )}

              {csvErrors.length > 0 && (
                <div className="rounded-lg bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 p-4">
                  <div className="flex items-center gap-2 text-error-600 dark:text-error-400 font-medium text-sm mb-2">
                    <AlertCircle className="w-4 h-4" /> {csvErrors.length} validation errors
                  </div>
                  <ul className="text-xs text-error-500 dark:text-error-400 space-y-1 max-h-32 overflow-y-auto">
                    {csvErrors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Student Marks</p>
                {!editingRecord && <button onClick={addRow} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><Plus className="w-4 h-4" /> Add Row</button>}
              </div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr className="text-xs font-semibold text-slate-500 uppercase">
                      <th className="px-3 py-2 text-left">Student</th>
                      <th className="px-3 py-2">Internal</th>
                      <th className="px-3 py-2">External</th>
                      <th className="px-3 py-2">Assignment</th>
                      <th className="px-3 py-2">Quiz</th>
                      <th className="px-3 py-2">Lab</th>
                      <th className="px-3 py-2">Practical</th>
                      {!editingRecord && <th className="px-3 py-2"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">
                          <select value={row.student_id} onChange={(e) => updateRow(idx, 'student_id', e.target.value)} className="input min-w-[180px]">
                            <option value="">Select student</option>
                            {facultyStudents.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.enrollment_number ?? 'N/A'})</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={row.internal_marks} onChange={(e) => updateRow(idx, 'internal_marks', e.target.value)} className="input w-20 text-center" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={row.external_marks} onChange={(e) => updateRow(idx, 'external_marks', e.target.value)} className="input w-20 text-center" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={row.assignment_marks} onChange={(e) => updateRow(idx, 'assignment_marks', e.target.value)} className="input w-20 text-center" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={row.quiz_marks} onChange={(e) => updateRow(idx, 'quiz_marks', e.target.value)} className="input w-20 text-center" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={row.lab_marks} onChange={(e) => updateRow(idx, 'lab_marks', e.target.value)} className="input w-20 text-center" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} max={100} value={row.practical_marks} onChange={(e) => updateRow(idx, 'practical_marks', e.target.value)} className="input w-20 text-center" /></td>
                        {!editingRecord && <td className="px-3 py-2"><button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-error-500"><X className="w-4 h-4" /></button></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2"><Check className="w-4 h-4" /> Save Records</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
