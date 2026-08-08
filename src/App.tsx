import { Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SearchPage } from '@/pages/SearchPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

// Student pages
import { StudentDashboard } from '@/pages/student/StudentDashboard';
import { AvailableExams } from '@/pages/student/AvailableExams';
import { ExamInstructions } from '@/pages/student/ExamInstructions';
import { LiveExam } from '@/pages/student/LiveExam';
import { ResultDetail } from '@/pages/student/ResultDetail';
import { MyResults } from '@/pages/student/MyResults';
import { ProfilePage } from '@/pages/student/ProfilePage';
import { StudentSubjects } from '@/pages/student/StudentSubjects';
import { StudentAssignments } from '@/pages/student/StudentAssignments';
import { StudentLabTasks } from '@/pages/student/StudentLabTasks';
import { StudentMaterials } from '@/pages/student/StudentMaterials';
import { StudentAnnouncements } from '@/pages/student/StudentAnnouncements';
import { StudentPolls } from '@/pages/student/StudentPolls';
import { StudentAcademicRecords } from '@/pages/student/StudentAcademicRecords';
import { StudentQuizzes } from '@/pages/student/StudentQuizzes';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { StudentManagement } from '@/pages/admin/StudentManagement';
import { FacultyManagement } from '@/pages/admin/FacultyManagement';
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage';
import { DepartmentManagement } from '@/pages/admin/DepartmentManagement';
import { AcademicYearManagement } from '@/pages/admin/AcademicYearManagement';
import { SemesterManagement } from '@/pages/admin/SemesterManagement';
import { SectionManagement } from '@/pages/admin/SectionManagement';
import { SubjectManagement } from '@/pages/admin/SubjectManagement';
import { AnnouncementManagement } from '@/pages/admin/AnnouncementManagement';
import { PollManagement } from '@/pages/admin/PollManagement';
import { PollResults } from '@/pages/admin/PollResults';
import { AcademicRecords } from '@/pages/admin/AcademicRecords';

// Faculty pages
import { FacultyDashboard } from '@/pages/faculty/FacultyDashboard';
import { FacultySubjects } from '@/pages/faculty/FacultySubjects';
import { FacultyAssignments } from '@/pages/faculty/FacultyAssignments';
import { FacultyLabTasks } from '@/pages/faculty/FacultyLabTasks';
import { FacultyMaterials } from '@/pages/faculty/FacultyMaterials';
import { FacultyPolls } from '@/pages/faculty/FacultyPolls';
import { FacultyAnnouncements } from '@/pages/faculty/FacultyAnnouncements';
import { FacultyQuizManagement } from '@/pages/faculty/FacultyQuizManagement';

// Dept Admin pages
import { DeptAdminDashboard } from '@/pages/deptadmin/DeptAdminDashboard';
import { DeptAdminAnalytics } from '@/pages/deptadmin/DeptAdminAnalytics';
import { DeptAdminAcademicRecords } from '@/pages/deptadmin/DeptAdminAcademicRecords';

// Faculty pages
import { FacultyAcademicRecords } from '@/pages/faculty/FacultyAcademicRecords';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Student routes */}
      <Route element={<ProtectedRoute roles={['student']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/student/subjects" element={<StudentSubjects />} />
        <Route path="/student/assignments" element={<StudentAssignments />} />
        <Route path="/exams" element={<AvailableExams />} />
        <Route path="/exam/:examId" element={<ExamInstructions />} />
        <Route path="/exam/:examId/take" element={<LiveExam />} />
        <Route path="/student/lab-tasks" element={<StudentLabTasks />} />
        <Route path="/student/materials" element={<StudentMaterials />} />
        <Route path="/student/announcements" element={<StudentAnnouncements />} />
        <Route path="/student/polls" element={<StudentPolls />} />
        <Route path="/student/academic-records" element={<StudentAcademicRecords />} />
        <Route path="/student/quizzes" element={<StudentQuizzes />} />
        <Route path="/results" element={<MyResults />} />
        <Route path="/results/:examId" element={<ResultDetail />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Super Admin routes */}
      <Route element={<ProtectedRoute roles={['super_admin', 'admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<DepartmentManagement />} />
        <Route path="/admin/academic-years" element={<AcademicYearManagement />} />
        <Route path="/admin/semesters" element={<SemesterManagement />} />
        <Route path="/admin/sections" element={<SectionManagement />} />
        <Route path="/admin/subjects" element={<SubjectManagement />} />
        <Route path="/admin/students" element={<StudentManagement />} />
        <Route path="/admin/faculty" element={<FacultyManagement />} />
        <Route path="/admin/polls" element={<PollManagement />} />
        <Route path="/admin/poll-results" element={<PollResults />} />
        <Route path="/admin/announcements" element={<AnnouncementManagement />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/academic-records" element={<AcademicRecords />} />
      </Route>

      {/* Dept Admin routes */}
      <Route element={<ProtectedRoute roles={['dept_admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dept-admin" element={<DeptAdminDashboard />} />
        <Route path="/dept-admin/faculty" element={<FacultyManagement />} />
        <Route path="/dept-admin/students" element={<StudentManagement />} />
        <Route path="/dept-admin/subjects" element={<SubjectManagement />} />
        <Route path="/dept-admin/sections" element={<SectionManagement />} />
        <Route path="/dept-admin/polls" element={<PollManagement />} />
        <Route path="/dept-admin/academic-records" element={<DeptAdminAcademicRecords />} />
        <Route path="/dept-admin/announcements" element={<AnnouncementManagement />} />
        <Route path="/dept-admin/analytics" element={<DeptAdminAnalytics />} />
      </Route>

      {/* Faculty routes */}
      <Route element={<ProtectedRoute roles={['faculty']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/subjects" element={<FacultySubjects />} />
        <Route path="/faculty/assignments" element={<FacultyAssignments />} />
        <Route path="/faculty/lab-tasks" element={<FacultyLabTasks />} />
        <Route path="/faculty/materials" element={<FacultyMaterials />} />
        <Route path="/faculty/academic-records" element={<FacultyAcademicRecords />} />
        <Route path="/faculty/quizzes" element={<FacultyQuizManagement />} />
        <Route path="/faculty/polls" element={<FacultyPolls />} />
        <Route path="/faculty/announcements" element={<FacultyAnnouncements />} />
      </Route>

      {/* Shared routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/search" element={<SearchPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
