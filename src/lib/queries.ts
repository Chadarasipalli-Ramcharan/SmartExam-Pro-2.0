import { supabase } from '@/lib/supabase';
import type {
  Exam, Question, Result, Profile, AnswerEntry, Grade,
  Department, AcademicYear, Semester, Section, Subject,
  Assignment, AssignmentSubmission, LabTask, LabSubmission,
  Material, Announcement, Notification,
  SubjectWithDetails, AssignmentWithDetails, LabTaskWithDetails,
  MaterialWithDetails, AnnouncementWithDetails,
  AssignmentSubmissionWithDetails, LabSubmissionWithDetails,
  PollWithDetails, Poll,
  AcademicRecord, AcademicRecordWithDetails, MarkUpload,
  DepartmentWithDetails,
  Quiz, QuizWithDetails, QuizQuestion, QuizSubmission,
} from '@/types';
import { computeGrade } from '@/types';

// ===== Original exam queries (preserved) =====

export async function fetchPublishedExams(): Promise<Exam[]> {
  const { data, error } = await supabase.from('exams').select('*').eq('status', 'published').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Exam[];
}

export async function fetchAllExams(): Promise<Exam[]> {
  const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Exam[];
}

export async function fetchExam(id: string): Promise<Exam | null> {
  const { data, error } = await supabase.from('exams').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Exam | null;
}

export async function fetchQuestionsForExam(examId: string): Promise<Question[]> {
  const { data, error } = await supabase.from('questions').select('*').eq('exam_id', examId).order('created_at', { ascending: true });
  if (error) throw error;
  return data as Question[];
}

export async function fetchQuestionCount(examId: string): Promise<number> {
  const { count, error } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('exam_id', examId);
  if (error) throw error;
  return count ?? 0;
}

export async function fetchStudentResults(studentId: string): Promise<Result[]> {
  const { data, error } = await supabase.from('results').select('*').eq('student_id', studentId).order('submitted_at', { ascending: false });
  if (error) throw error;
  return data as Result[];
}

export async function fetchAllResults(): Promise<Result[]> {
  const { data, error } = await supabase.from('results').select('*').order('submitted_at', { ascending: false });
  if (error) throw error;
  return data as Result[];
}

export async function fetchResult(studentId: string, examId: string): Promise<Result | null> {
  const { data, error } = await supabase.from('results').select('*').eq('student_id', studentId).eq('exam_id', examId).maybeSingle();
  if (error) throw error;
  return data as Result | null;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export async function fetchStudentProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export async function fetchFacultyProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'faculty').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Profile[];
}

export interface ScoreResult {
  answers: AnswerEntry[];
  obtained: number;
  total: number;
  percentage: number;
  grade: Grade;
  status: 'pass' | 'fail';
}

export function calculateScore(questions: Question[], selected: Record<string, string | null>, passingMarks: number): ScoreResult {
  const answers: AnswerEntry[] = questions.map((q) => ({
    questionId: q.id,
    selected: (selected[q.id] ?? null) as AnswerEntry['selected'],
    correct: q.correct_option,
    marks: q.marks,
  }));
  const obtained = answers.reduce((sum, a) => sum + (a.selected === a.correct ? a.marks : 0), 0);
  const total = questions.reduce((sum, q) => sum + q.marks, 0);
  const percentage = total > 0 ? Math.round((obtained / total) * 10000) / 100 : 0;
  const grade = computeGrade(percentage);
  const status: 'pass' | 'fail' = obtained >= passingMarks ? 'pass' : 'fail';
  return { answers, obtained, total, percentage, grade, status };
}

export async function submitExamResult(studentId: string, examId: string, score: ScoreResult): Promise<Result> {
  const payload = {
    student_id: studentId, exam_id: examId, answers: score.answers,
    obtained_marks: score.obtained, total_marks: score.total,
    percentage: score.percentage, grade: score.grade, status: score.status,
  };
  const { data, error } = await supabase.from('results').upsert(payload, { onConflict: 'student_id,exam_id' }).select().single();
  if (error) throw error;
  return data as Result;
}

// ===== University structure queries =====

export async function fetchDepartments(): Promise<Department[]> {
  console.log('🔵 fetchDepartments() called');

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name');

  console.log('🟢 Departments data:', data);
  console.log('🔴 Departments error:', error);

  if (error) {
    throw error;
  }

  return data as Department[];
}

export async function fetchAcademicYears(): Promise<AcademicYear[]> {
  console.log('🔵 fetchAcademicYears() called');

  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .order('name');

  console.log('🟢 Academic years data:', data);
  console.log('🔴 Academic years error:', error);

  if (error) {
    throw error;
  }

  return data as AcademicYear[];
}

export async function fetchSemesters(departmentId?: string): Promise<Semester[]> {
  let q = supabase.from('semesters').select('*').order('name');
  if (departmentId) q = q.eq('department_id', departmentId);
  const { data, error } = await q;
  if (error) throw error;
  return data as Semester[];
}

export async function fetchSections(semesterId?: string): Promise<Section[]> {
  let q = supabase.from('sections').select('*').order('name');
  if (semesterId) q = q.eq('semester_id', semesterId);
  const { data, error } = await q;
  if (error) throw error;
  return data as Section[];
}

export async function fetchSubjects(
  filters?: {
    departmentId?: string;
    semesterId?: string;
    sectionId?: string;
    facultyId?: string;
  }
): Promise<SubjectWithDetails[]> {
  let q = supabase
    .from('subjects')
    .select(`
      *,
      department:departments(id,name,code),
      semester:semesters(id,name),
      section:sections(id,name),
      faculty:profiles(id,full_name,email)
    `)
    .order('code');

  if (filters?.departmentId) {
    q = q.eq('department_id', filters.departmentId);
  }

  if (filters?.semesterId) {
    q = q.eq('semester_id', filters.semesterId);
  }

  if (filters?.sectionId) {
    q = q.eq('section_id', filters.sectionId);
  }

  if (filters?.facultyId) {
    q = q.eq('faculty_id', filters.facultyId);
  }

  const { data, error } = await q;

  if (error) throw error;

  return data as SubjectWithDetails[];
}


export async function fetchSubject(
  id: string
): Promise<SubjectWithDetails | null> {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      department:departments(id,name,code),
      semester:semesters(id,name),
      section:sections(id,name),
      faculty:profiles(id,full_name,email)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;

  return data as SubjectWithDetails | null;
}

// ===== Assignment queries =====

export async function fetchAssignments(subjectId?: string, facultyId?: string): Promise<AssignmentWithDetails[]> {
  let q = supabase.from('assignments').select('*, subject:subjects(id,name,code), section:sections(id,name)').order('created_at', { ascending: false });
  if (subjectId) q = q.eq('subject_id', subjectId);
  if (facultyId) q = q.eq('faculty_id', facultyId);
  const { data, error } = await q;
  if (error) throw error;
  return data as AssignmentWithDetails[];
}

export async function fetchAssignment(id: string): Promise<AssignmentWithDetails | null> {
  const { data, error } = await supabase
    .from('assignments').select('*, subject:subjects(id,name,code), section:sections(id,name)')
    .eq('id', id).maybeSingle();
  if (error) throw error;
  return data as AssignmentWithDetails | null;
}

export async function fetchAssignmentSubmissions(assignmentId: string): Promise<AssignmentSubmissionWithDetails[]> {
  const { data, error } = await supabase
    .from('assignment_submissions').select('*, student:profiles(id,full_name,email,roll_number), assignment:assignments(id,title,max_marks)')
    .eq('assignment_id', assignmentId).order('submitted_at', { ascending: false });
  if (error) throw error;
  return data as AssignmentSubmissionWithDetails[];
}

export async function fetchMyAssignmentSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
  const { data, error } = await supabase
    .from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', studentId).maybeSingle();
  if (error) throw error;
  return data as AssignmentSubmission | null;
}

export async function submitAssignment(payload: { assignment_id: string; student_id: string; file_url?: string; comments?: string }): Promise<AssignmentSubmission> {
  const { data, error } = await supabase
    .from('assignment_submissions').upsert({
      assignment_id: payload.assignment_id,
      student_id: payload.student_id,
      file_url: payload.file_url ?? null,
      comments: payload.comments ?? null,
      status: 'submitted',
    }, { onConflict: 'assignment_id,student_id' }).select().single();
  if (error) throw error;
  return data as AssignmentSubmission;
}

export async function gradeAssignmentSubmission(submissionId: string, grade: number, feedback: string, gradedBy: string): Promise<void> {
  const { error } = await supabase.from('assignment_submissions')
    .update({ grade, feedback, graded_by: gradedBy, graded_at: new Date().toISOString(), status: 'graded' })
    .eq('id', submissionId);
  if (error) throw error;
}

// ===== Lab Task queries =====

export async function fetchLabTasks(subjectId?: string, facultyId?: string): Promise<LabTaskWithDetails[]> {
  let q = supabase.from('lab_tasks').select('*, subject:subjects(id,name,code)').order('created_at', { ascending: false });
  if (subjectId) q = q.eq('subject_id', subjectId);
  if (facultyId) q = q.eq('faculty_id', facultyId);
  const { data, error } = await q;
  if (error) throw error;
  return data as LabTaskWithDetails[];
}

export async function fetchLabTask(id: string): Promise<LabTaskWithDetails | null> {
  const { data, error } = await supabase.from('lab_tasks').select('*, subject:subjects(id,name,code)').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as LabTaskWithDetails | null;
}

export async function fetchLabSubmissions(labTaskId: string): Promise<LabSubmissionWithDetails[]> {
  const { data, error } = await supabase
    .from('lab_submissions').select('*, student:profiles(id,full_name,email,roll_number), lab_task:lab_tasks(id,title,max_marks)')
    .eq('lab_task_id', labTaskId).order('submitted_at', { ascending: false });
  if (error) throw error;
  return data as LabSubmissionWithDetails[];
}

export async function fetchMyLabSubmission(labTaskId: string, studentId: string): Promise<LabSubmission | null> {
  const { data, error } = await supabase.from('lab_submissions').select('*').eq('lab_task_id', labTaskId).eq('student_id', studentId).maybeSingle();
  if (error) throw error;
  return data as LabSubmission | null;
}

export async function submitLabTask(payload: { lab_task_id: string; student_id: string; file_url?: string; github_url?: string; comments?: string }): Promise<LabSubmission> {
  const { data, error } = await supabase
    .from('lab_submissions').upsert({
      lab_task_id: payload.lab_task_id,
      student_id: payload.student_id,
      file_url: payload.file_url ?? null,
      github_url: payload.github_url ?? null,
      comments: payload.comments ?? null,
      status: 'submitted',
    }, { onConflict: 'lab_task_id,student_id' }).select().single();
  if (error) throw error;
  return data as LabSubmission;
}

export async function gradeLabSubmission(submissionId: string, grade: number, feedback: string, gradedBy: string): Promise<void> {
  const { error } = await supabase.from('lab_submissions')
    .update({ grade, feedback, graded_by: gradedBy, graded_at: new Date().toISOString(), status: 'graded' })
    .eq('id', submissionId);
  if (error) throw error;
}

// ===== Materials queries =====

export async function fetchMaterials(subjectId?: string): Promise<MaterialWithDetails[]> {
  let q = supabase.from('materials').select('*, subject:subjects(id,name,code)').order('created_at', { ascending: false });
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q;
  if (error) throw error;
  return data as MaterialWithDetails[];
}

// ===== Announcements queries =====

export async function fetchAnnouncements(departmentId?: string): Promise<AnnouncementWithDetails[]> {
  let q = supabase.from('announcements').select('*, author:profiles(id,full_name), department:departments(id,name), subject:subjects(id,name,code)').order('created_at', { ascending: false });
  if (departmentId) q = q.or(`department_id.eq.${departmentId},target_audience.eq.all`);
  const { data, error } = await q;
  if (error) throw error;
  return data as AnnouncementWithDetails[];
}

// ===== Notifications queries =====

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  if (error) throw error;
}

// ===== Global search =====

export async function globalSearch(query: string): Promise<{
  students: Profile[];
  faculty: Profile[];
  subjects: SubjectWithDetails[];
  departments: Department[];
}> {
  const q = `%${query}%`;
  const [studentsRes, facultyRes, subjectsRes, departmentsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'student').or(`full_name.ilike.${q},email.ilike.${q},enrollment_number.ilike.${q},roll_number.ilike.${q}`).limit(10),
    supabase.from('profiles').select('*').eq('role', 'faculty').or(`full_name.ilike.${q},email.ilike.${q},employee_id.ilike.${q}`).limit(10),
    supabase.from('subjects').select('*, department:departments(id,name,code), semester:semesters(id,name), section:sections(id,name), faculty:profiles(id,full_name,email)').or(`name.ilike.${q},code.ilike.${q}`).limit(10),
    supabase.from('departments').select('*').or(`name.ilike.${q},code.ilike.${q}`).limit(10),
  ]);
  return {
    students: (studentsRes.data ?? []) as Profile[],
    faculty: (facultyRes.data ?? []) as Profile[],
    subjects: (subjectsRes.data ?? []) as SubjectWithDetails[],
    departments: (departmentsRes.data ?? []) as Department[],
  };
}

export { computeGrade };

// ===== Poll queries =====

export async function fetchPolls(filters?: { departmentId?: string; status?: string }): Promise<PollWithDetails[]> {
  let q = supabase.from('polls').select(
    '*, options:poll_options(*), created_by_profile:profiles!polls_created_by_fkey(id,full_name)'
  ).order('created_at', { ascending: false });
  if (filters?.departmentId) q = q.eq('department_id', filters.departmentId);
  if (filters?.status) q = q.eq('status', filters.status);
  const { data, error } = await q;
  if (error) throw error;
  const polls = data as unknown as PollWithDetails[];
  // Fetch vote counts
  for (const poll of polls) {
    if (poll.options) {
      for (const opt of poll.options) {
        const { count } = await supabase.from('poll_votes')
          .select('*', { count: 'exact', head: true })
          .eq('option_id', opt.id);
        opt.vote_count = count ?? 0;
      }
    }
    poll.total_votes = poll.options?.reduce((s, o) => s + (o.vote_count ?? 0), 0) ?? 0;
  }
  return polls;
}

export async function fetchPoll(pollId: string, userId?: string): Promise<PollWithDetails | null> {
  const { data, error } = await supabase.from('polls').select(
    '*, options:poll_options(*), created_by_profile:profiles!polls_created_by_fkey(id,full_name)'
  ).eq('id', pollId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const poll = data as unknown as PollWithDetails;
  if (poll.options) {
    for (const opt of poll.options) {
      const { count } = await supabase.from('poll_votes')
        .select('*', { count: 'exact', head: true })
        .eq('option_id', opt.id);
      opt.vote_count = count ?? 0;
    }
  }
  poll.total_votes = poll.options?.reduce((s, o) => s + (o.vote_count ?? 0), 0) ?? 0;
  if (userId) {
    const { data: voteData } = await supabase.from('poll_votes')
      .select('option_id').eq('poll_id', pollId).eq('user_id', userId);
    poll.has_voted = (voteData && voteData.length > 0) ?? false;
  }
  return poll;
}

export async function createPoll(payload: {
  title: string; description?: string; poll_type: string; target_audience: string;
  department_id?: string; academic_year_id?: string; semester_id?: string; section_id?: string;
  is_anonymous: boolean; created_by: string; options: string[];
}): Promise<Poll | null> {
  const { data: poll, error } = await supabase.from('polls').insert({
    title: payload.title, description: payload.description ?? null,
    poll_type: payload.poll_type, target_audience: payload.target_audience,
    department_id: payload.department_id ?? null, academic_year_id: payload.academic_year_id ?? null,
    semester_id: payload.semester_id ?? null, section_id: payload.section_id ?? null,
    is_anonymous: payload.is_anonymous, status: 'active', created_by: payload.created_by,
  }).select().single();
  if (error) throw error;
  if (poll && payload.options.length > 0) {
    const opts = payload.options.map((label, i) => ({ poll_id: poll.id, label, position: i }));
    const { error: optErr } = await supabase.from('poll_options').insert(opts);
    if (optErr) throw optErr;
  }
  return poll as Poll;
}

export async function updatePollStatus(pollId: string, status: 'active' | 'closed'): Promise<void> {
  const { error } = await supabase.from('polls').update({ status }).eq('id', pollId);
  if (error) throw error;
}

export async function deletePoll(pollId: string): Promise<void> {
  const { error } = await supabase.from('polls').delete().eq('id', pollId);
  if (error) throw error;
}

export async function votePoll(pollId: string, optionIds: string[], userId: string): Promise<void> {
  const votes = optionIds.map((oid) => ({ poll_id: pollId, option_id: oid, user_id: userId }));
  const { error } = await supabase.from('poll_votes').insert(votes);
  if (error) throw error;
}

export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('poll_votes')
    .select('id').eq('poll_id', pollId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

// ===== Academic Records queries =====

export function computeAcademicTotals(marks: {
  internal_marks: number; external_marks: number; assignment_marks: number;
  quiz_marks: number; lab_marks: number; practical_marks: number;
}) {
  const total = Math.round(
    (marks.internal_marks || 0) + (marks.external_marks || 0) + (marks.assignment_marks || 0) +
    (marks.quiz_marks || 0) + (marks.lab_marks || 0) + (marks.practical_marks || 0)
  );
  // Max possible: internal(40) + external(60) + assignment(10) + quiz(10) + lab(20) + practical(20) = 160
  const maxTotal = 160;
  const percentage = Math.round((total / maxTotal) * 10000) / 100;
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  const passFail = percentage >= 40 ? 'pass' : 'fail';
  return { total_marks: total, percentage, grade, pass_fail: passFail };
}

export async function fetchAcademicRecords(filters?: {
  facultyId?: string; studentId?: string; subjectId?: string; departmentId?: string;
  semesterId?: string; sectionId?: string; academicYearId?: string;
}): Promise<AcademicRecordWithDetails[]> {
  let q = supabase.from('academic_records').select(
    '*, student:profiles!academic_records_student_id_fkey(id,full_name,email,enrollment_number), faculty:profiles!academic_records_faculty_id_fkey(id,full_name), subject:subjects(id,name,code), department:departments(id,name,code), semester:semesters(id,name), section:sections(id,name), academic_year:academic_years(id,name)'
  ).order('uploaded_at', { ascending: false });
  if (filters?.facultyId) q = q.eq('faculty_id', filters.facultyId);
  if (filters?.studentId) q = q.eq('student_id', filters.studentId);
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId);
  if (filters?.departmentId) q = q.eq('department_id', filters.departmentId);
  if (filters?.semesterId) q = q.eq('semester_id', filters.semesterId);
  if (filters?.sectionId) q = q.eq('section_id', filters.sectionId);
  if (filters?.academicYearId) q = q.eq('academic_year_id', filters.academicYearId);
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as AcademicRecordWithDetails[];
}

export async function upsertAcademicRecord(payload: {
  student_id: string; faculty_id: string; subject_id: string; department_id: string;
  semester_id?: string | null; section_id?: string | null; academic_year_id?: string | null;
  internal_marks: number; external_marks: number; assignment_marks: number;
  quiz_marks: number; lab_marks: number; practical_marks: number;
  uploaded_by: string;
}): Promise<AcademicRecord> {
  const totals = computeAcademicTotals(payload);
  const { data, error } = await supabase.from('academic_records').upsert({
    student_id: payload.student_id,
    faculty_id: payload.faculty_id,
    subject_id: payload.subject_id,
    department_id: payload.department_id,
    semester_id: payload.semester_id ?? null,
    section_id: payload.section_id ?? null,
    academic_year_id: payload.academic_year_id ?? null,
    internal_marks: payload.internal_marks,
    external_marks: payload.external_marks,
    assignment_marks: payload.assignment_marks,
    quiz_marks: payload.quiz_marks,
    lab_marks: payload.lab_marks,
    practical_marks: payload.practical_marks,
    total_marks: totals.total_marks,
    percentage: totals.percentage,
    grade: totals.grade,
    pass_fail: totals.pass_fail,
    uploaded_by: payload.uploaded_by,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'student_id,subject_id,academic_year_id' }).select().single();
  if (error) throw error;
  return data as AcademicRecord;
}

export async function deleteAcademicRecord(id: string): Promise<void> {
  const { error } = await supabase.from('academic_records').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMarkUploads(facultyId: string): Promise<MarkUpload[]> {
  const { data, error } = await supabase.from('mark_uploads')
    .select('*').eq('faculty_id', facultyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as MarkUpload[];
}

export async function createMarkUpload(payload: {
  faculty_id: string; subject_id?: string | null; department_id?: string | null;
  semester_id?: string | null; section_id?: string | null; academic_year_id?: string | null;
  upload_type: string; file_name?: string | null; total_records: number;
  success_count: number; error_count: number; status: string;
  errors?: Record<string, unknown>[] | null;
}): Promise<MarkUpload> {
  const { data, error } = await supabase.from('mark_uploads').insert({
    faculty_id: payload.faculty_id,
    subject_id: payload.subject_id ?? null,
    department_id: payload.department_id ?? null,
    semester_id: payload.semester_id ?? null,
    section_id: payload.section_id ?? null,
    academic_year_id: payload.academic_year_id ?? null,
    upload_type: payload.upload_type,
    file_name: payload.file_name ?? null,
    total_records: payload.total_records,
    success_count: payload.success_count,
    error_count: payload.error_count,
    status: payload.status,
    errors: payload.errors ?? [],
  }).select().single();
  if (error) throw error;
  return data as MarkUpload;
}

// ===== HOD Assignment queries =====

export async function assignHOD(departmentId: string, facultyId: string, facultyName: string, facultyEmail: string): Promise<void> {
  const { error } = await supabase.from('departments').update({
    hod_id: facultyId,
    hod_name: facultyName,
    hod_email: facultyEmail,
  }).eq('id', departmentId);
  if (error) throw error;
}

export async function removeHOD(departmentId: string): Promise<void> {
  const { error } = await supabase.from('departments').update({
    hod_id: null,
    hod_name: null,
    hod_email: null,
  }).eq('id', departmentId);
  if (error) throw error;
}

export async function fetchDepartmentsWithHOD(): Promise<DepartmentWithDetails[]> {
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw error;
  return data as DepartmentWithDetails[];
}

// ===== Quiz queries =====

export async function fetchQuizzes(filters?: { facultyId?: string; subjectId?: string; sectionId?: string; semesterId?: string; departmentId?: string }): Promise<QuizWithDetails[]> {
  let q = supabase.from('quizzes').select(
    '*, subject:subjects(id,name,code), department:departments(id,name,code), semester:semesters(id,name), section:sections(id,name), academic_year:academic_years(id,name)'
  ).order('created_at', { ascending: false });
  if (filters?.facultyId) q = q.eq('faculty_id', filters.facultyId);
  if (filters?.subjectId) q = q.eq('subject_id', filters.subjectId);
  if (filters?.sectionId) q = q.eq('section_id', filters.sectionId);
  if (filters?.semesterId) q = q.eq('semester_id', filters.semesterId);
  if (filters?.departmentId) q = q.eq('department_id', filters.departmentId);
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as QuizWithDetails[];
}

export async function fetchQuiz(id: string): Promise<QuizWithDetails | null> {
  const { data, error } = await supabase.from('quizzes').select(
    '*, subject:subjects(id,name,code), department:departments(id,name,code), semester:semesters(id,name), section:sections(id,name), academic_year:academic_years(id,name)'
  ).eq('id', id).maybeSingle();
  if (error) throw error;
  return data as unknown as QuizWithDetails | null;
}

export async function fetchQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
  const { data, error } = await supabase.from('quiz_questions').select('*').eq('quiz_id', quizId).order('position', { ascending: true });
  if (error) throw error;
  return data as unknown as QuizQuestion[];
}

export async function createQuiz(payload: {
  title: string; description?: string | null; faculty_id: string;
  subject_id?: string | null; department_id?: string | null;
  academic_year_id?: string | null; semester_id?: string | null; section_id?: string | null;
  duration_minutes?: number; due_date?: string | null;
  total_marks?: number; instructions?: string | null;
  status?: string;
}): Promise<Quiz> {
  const { data, error } = await supabase.from('quizzes').insert({
    title: payload.title,
    description: payload.description ?? null,
    faculty_id: payload.faculty_id,
    subject_id: payload.subject_id ?? null,
    department_id: payload.department_id ?? null,
    academic_year_id: payload.academic_year_id ?? null,
    semester_id: payload.semester_id ?? null,
    section_id: payload.section_id ?? null,
    duration_minutes: payload.duration_minutes ?? 30,
    due_date: payload.due_date ?? null,
    total_marks: payload.total_marks ?? 0,
    instructions: payload.instructions ?? null,
    status: payload.status ?? 'draft',
  }).select().single();
  if (error) throw error;
  return data as Quiz;
}

export async function updateQuiz(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('quizzes').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function deleteQuiz(id: string): Promise<void> {
  const { error } = await supabase.from('quizzes').delete().eq('id', id);
  if (error) throw error;
}

export async function saveQuizQuestion(payload: {
  quiz_id: string; question_text: string; question_type: string;
  options: string[]; correct_answer?: string | null;
  explanation?: string | null; marks?: number; is_required?: boolean;
  question_image_url?: string | null; position?: number;
}): Promise<QuizQuestion> {
  const { data, error } = await supabase.from('quiz_questions').insert({
    quiz_id: payload.quiz_id,
    question_text: payload.question_text,
    question_type: payload.question_type,
    options: payload.options,
    correct_answer: payload.correct_answer ?? null,
    explanation: payload.explanation ?? null,
    marks: payload.marks ?? 1,
    is_required: payload.is_required ?? true,
    question_image_url: payload.question_image_url ?? null,
    position: payload.position ?? 0,
  }).select().single();
  if (error) throw error;
  return data as unknown as QuizQuestion;
}

export async function updateQuizQuestion(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('quiz_questions').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteQuizQuestion(id: string): Promise<void> {
  const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchQuizSubmission(quizId: string, studentId: string): Promise<QuizSubmission | null> {
  const { data, error } = await supabase.from('quiz_submissions')
    .select('*').eq('quiz_id', quizId).eq('student_id', studentId).maybeSingle();
  if (error) throw error;
  return data as unknown as QuizSubmission | null;
}

export async function createQuizSubmission(payload: {
  quiz_id: string; student_id: string; total_marks: number;
}): Promise<QuizSubmission> {
  const { data, error } = await supabase.from('quiz_submissions').insert({
    quiz_id: payload.quiz_id,
    student_id: payload.student_id,
    total_marks: payload.total_marks,
    status: 'in_progress',
  }).select().single();
  if (error) throw error;
  return data as unknown as QuizSubmission;
}

export async function updateQuizSubmission(id: string, payload: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('quiz_submissions').update(payload).eq('id', id);
  if (error) throw error;
}

export function autoScoreQuiz(questions: QuizQuestion[], answers: Record<string, unknown>): { score: number; total: number } {
  let score = 0;
  let total = 0;
  for (const q of questions) {
    total += q.marks;
    const studentAnswer = answers[q.id];
    if (q.question_type === 'multiple_choice_single' || q.question_type === 'true_false') {
      if (String(studentAnswer) === q.correct_answer) score += q.marks;
    } else if (q.question_type === 'multiple_choice_multiple') {
      const correctIndices = (q.correct_answer ?? '').split(',').sort();
      const studentIndices = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
      if (correctIndices.length === studentIndices.length && correctIndices.every((v, i) => v === studentIndices[i])) {
        score += q.marks;
      }
    }
  }
  return { score, total };
}
