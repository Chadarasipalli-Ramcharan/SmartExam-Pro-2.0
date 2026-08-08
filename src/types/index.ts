export type Role = 'admin' | 'super_admin' | 'dept_admin' | 'faculty' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string | null;
  status: boolean;
  created_at: string;
  updated_at: string;
  department_id: string | null;
  employee_id: string | null;
  enrollment_number: string | null;
  roll_number: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  designation: string | null;
}

export type ExamStatus = 'draft' | 'published';

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  instructions: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  subject_id: string | null;
  section_id: string | null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type OptionKey = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  exam_id: string;
  question: string;
  options: Record<OptionKey, string>;
  correct_option: OptionKey;
  marks: number;
  difficulty: Difficulty;
  explanation: string | null;
  created_at: string;
}

export interface AnswerEntry {
  questionId: string;
  selected: OptionKey | null;
  correct: OptionKey;
  marks: number;
}

export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
export type ResultStatus = 'pass' | 'fail';

export interface Result {
  id: string;
  student_id: string;
  exam_id: string;
  answers: AnswerEntry[];
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  grade: Grade;
  status: ResultStatus;
  submitted_at: string;
}

export interface ExamWithCounts extends Exam {
  question_count?: number;
}

export interface ResultWithDetails extends Result {
  exam?: Pick<Exam, 'id' | 'title' | 'subject' | 'total_marks'>;
  student?: Pick<Profile, 'id' | 'full_name' | 'email'>;
}

export function computeGrade(percentage: number): Grade {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

// ===== University Structure =====

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  hod_id: string | null;
  hod_name: string | null;
  hod_email: string | null;
  department_admin_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepartmentWithDetails extends Department {
  hod_profile?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
  faculty_count?: number;
  student_count?: number;
  subject_count?: number;
  section_count?: number;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  name: string;
  academic_year_id: string | null;
  department_id: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  name: string;
  semester_id: string | null;
  department_id: string | null;
  capacity: number;
  class_advisor_id: string | null;
  academic_year_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  department_id: string;
  semester_id: string;
  section_id: string | null;
  credits: number;
  faculty_id: string | null;
  room_number: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubjectWithDetails extends Subject {
  department?: Pick<Department, 'id' | 'name' | 'code'>;
  semester?: Pick<Semester, 'id' | 'name'>;
  section?: Pick<Section, 'id' | 'name'>;
  faculty?: Pick<Profile, 'id' | 'full_name' | 'email'>;
}

// ===== Assignments =====

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  faculty_id: string;
  section_id: string | null;
  department_id: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  max_marks: number;
  due_date: string;
  instructions: string | null;
  file_url: string | null;
  attachment_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithDetails extends Assignment {
  subject?: Pick<Subject, 'id' | 'name' | 'code'>;
  section?: Pick<Section, 'id' | 'name'>;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  comments: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: 'submitted' | 'graded' | 'late';
}

export interface AssignmentSubmissionWithDetails extends AssignmentSubmission {
  student?: Pick<Profile, 'id' | 'full_name' | 'email' | 'roll_number'>;
  assignment?: Pick<Assignment, 'id' | 'title' | 'max_marks'>;
}

// ===== Lab Tasks =====

export interface LabTask {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  faculty_id: string;
  section_id: string | null;
  department_id: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  max_marks: number;
  due_date: string;
  instructions: string | null;
  file_url: string | null;
  dataset_url: string | null;
  starter_code_url: string | null;
  attachment_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface LabTaskWithDetails extends LabTask {
  subject?: Pick<Subject, 'id' | 'name' | 'code'>;
}

export interface LabSubmission {
  id: string;
  lab_task_id: string;
  student_id: string;
  file_url: string | null;
  github_url: string | null;
  comments: string | null;
  submitted_at: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: 'submitted' | 'graded' | 'late';
}

export interface LabSubmissionWithDetails extends LabSubmission {
  student?: Pick<Profile, 'id' | 'full_name' | 'email' | 'roll_number'>;
  lab_task?: Pick<LabTask, 'id' | 'title' | 'max_marks'>;
}

// ===== Materials =====

export type MaterialType = 'pdf' | 'ppt' | 'docx' | 'image' | 'video' | 'link';

export interface Material {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  faculty_id: string;
  department_id: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  material_type: MaterialType;
  file_url: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialWithDetails extends Material {
  subject?: Pick<Subject, 'id' | 'name' | 'code'>;
}

// ===== Announcements =====

export type TargetAudience = 'all' | 'students' | 'faculty' | 'department' | 'section' | 'subject' | 'dept_admins' | 'faculty_students';
export type Priority = 'low' | 'normal' | 'high';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  department_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  subject_id: string | null;
  academic_year_id: string | null;
  target_audience: TargetAudience;
  priority: Priority;
  file_attachment_url: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithDetails extends Announcement {
  author?: Pick<Profile, 'id' | 'full_name'>;
  department?: Pick<Department, 'id' | 'name'>;
  subject?: Pick<Subject, 'id' | 'name' | 'code'>;
}

// ===== Notifications =====

export type NotificationType = 'assignment' | 'quiz' | 'exam' | 'lab_task' | 'material' | 'grade' | 'announcement';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link_id: string | null;
  link_type: string | null;
  is_read: boolean;
  created_at: string;
}

// ===== Polls =====

export type PollType = 'single' | 'multiple' | 'yesno';
export type PollTargetAudience = 'students' | 'faculty' | 'both';
export type PollStatus = 'active' | 'closed';

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  poll_type: PollType;
  target_audience: PollTargetAudience;
  department_id: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  is_anonymous: boolean;
  status: PollStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  position: number;
  created_at: string;
}

export interface PollOptionWithVotes extends PollOption {
  vote_count: number;
}

export interface PollWithDetails extends Poll {
  options?: PollOptionWithVotes[];
  total_votes?: number;
  has_voted?: boolean;
  created_by_profile?: Pick<Profile, 'id' | 'full_name'>;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
}

// ===== Academic Records =====

export type PassFail = 'pass' | 'fail';
export type UploadType = 'manual' | 'csv' | 'excel';

export interface AcademicRecord {
  id: string;
  student_id: string;
  faculty_id: string;
  subject_id: string;
  department_id: string;
  semester_id: string | null;
  section_id: string | null;
  academic_year_id: string | null;
  internal_marks: number;
  external_marks: number;
  assignment_marks: number;
  quiz_marks: number;
  lab_marks: number;
  practical_marks: number;
  total_marks: number;
  percentage: number;
  grade: string;
  pass_fail: string;
  remarks: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  updated_at: string;
}

export interface AcademicRecordWithDetails extends AcademicRecord {
  student?: Pick<Profile, 'id' | 'full_name' | 'email' | 'enrollment_number'>;
  subject?: Pick<Subject, 'id' | 'name' | 'code'>;
  department?: Pick<Department, 'id' | 'name' | 'code'>;
  semester?: Pick<Semester, 'id' | 'name'>;
  section?: Pick<Section, 'id' | 'name'>;
  academic_year?: Pick<AcademicYear, 'id' | 'name'>;
  faculty?: Pick<Profile, 'id' | 'full_name'>;
}

export interface MarkUpload {
  id: string;
  faculty_id: string;
  subject_id: string | null;
  department_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  academic_year_id: string | null;
  upload_type: string;
  file_name: string | null;
  total_records: number;
  success_count: number;
  error_count: number;
  status: string;
  errors: Record<string, unknown>[] | null;
  created_at: string;
}

// ===== Quizzes =====

export type QuizQuestionType =
  | 'multiple_choice_single'
  | 'multiple_choice_multiple'
  | 'short_answer'
  | 'paragraph_answer'
  | 'true_false';

export type QuizStatus = 'draft' | 'published';

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  faculty_id: string;
  subject_id: string | null;
  department_id: string | null;
  academic_year_id: string | null;
  semester_id: string | null;
  section_id: string | null;
  duration_minutes: number;
  due_date: string | null;
  total_marks: number;
  instructions: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string | null;
  explanation: string | null;
  marks: number;
  is_required: boolean;
  question_image_url: string | null;
  position: number;
  created_at: string;
}

export interface QuizWithDetails extends Quiz {
  subject?: Pick<Subject, 'id' | 'name' | 'code'>;
  department?: Pick<Department, 'id' | 'name' | 'code'>;
  semester?: Pick<Semester, 'id' | 'name'>;
  section?: Pick<Section, 'id' | 'name'>;
  academic_year?: Pick<AcademicYear, 'id' | 'name'>;
  questions?: QuizQuestion[];
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: Record<string, unknown>[];
  score: number;
  total_marks: number;
  status: string;
  auto_scored: boolean;
  started_at: string;
  submitted_at: string | null;
  created_at: string;
}
