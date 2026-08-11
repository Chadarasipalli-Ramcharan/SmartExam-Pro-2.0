import { useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  FlaskConical,
  FileText,
  FolderOpen,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

import { StatCard } from '@/components/StatCard';
import { SkeletonCard } from '@/components/Loading';

import {
  fetchSubjects,
  fetchAssignments,
  fetchAssignmentSubmissions,
  fetchLabTasks,
  fetchLabSubmissions,
  fetchMaterials,
  fetchQuizzes,
  fetchQuizSubmissionsByQuizIds,
} from '@/lib/queries';

import type {
  SubjectWithDetails,
  Assignment,
  LabTask,
  Material,
  QuizWithDetails,
  QuizSubmission,
} from '@/types';

import { useAuth } from '@/context/AuthContext';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export function FacultyDashboard() {
  const { profile } = useAuth();

  const [subjects, setSubjects] = useState<SubjectWithDetails[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [labTasks, setLabTasks] = useState<LabTask[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([]);

const [pendingGrading, setPendingGrading] = useState(0);
const [averageQuizScore, setAverageQuizScore] = useState(0);

const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!profile) return;

    const loadDashboard = async () => {
      try {
        const [
          subjectsData,
          assignmentsData,
          labTasksData,
          materialsData,
          quizzesData,
        ] = await Promise.all([
          fetchSubjects({ facultyId: profile.id }),
          fetchAssignments(undefined, profile.id),
          fetchLabTasks(undefined, profile.id),
          fetchMaterials(),
          fetchQuizzes({ facultyId: profile.id }),
        ]);

        setSubjects(subjectsData);
        setAssignments(assignmentsData);
        setLabTasks(labTasksData);
        setMaterials(materialsData);
        setQuizzes(quizzesData);

        const quizIds = quizzesData.map((quiz) => quiz.id);

let submissionsData: QuizSubmission[] = [];

if (quizIds.length > 0) {
  submissionsData =
    await fetchQuizSubmissionsByQuizIds(quizIds);

  setQuizSubmissions(submissionsData);
} else {
  setQuizSubmissions([]);
}

/* ================================
   Pending Grading
================================ */

const assignmentSubmissionResults = await Promise.all(
  assignmentsData.map((assignment) =>
    fetchAssignmentSubmissions(assignment.id)
  )
);

const labSubmissionResults = await Promise.all(
  labTasksData.map((labTask) =>
    fetchLabSubmissions(labTask.id)
  )
);

const allAssignmentSubmissions =
  assignmentSubmissionResults.flat();

const allLabSubmissions =
  labSubmissionResults.flat();

const pendingAssignments = allAssignmentSubmissions.filter(
  (submission) =>
    submission.status === 'submitted'
);

const pendingLabs = allLabSubmissions.filter(
  (submission) =>
    submission.status === 'submitted'
);

setPendingGrading(
  pendingAssignments.length + pendingLabs.length
);


/* ================================
   Average Quiz Score
================================ */

const completedQuizSubmissions = submissionsData.filter(
  (submission) =>
    submission.status === 'submitted' ||
    submission.status === 'completed'
);

const quizPercentages = completedQuizSubmissions
  .map((submission) => {
    const score = Number(
      (submission as QuizSubmission & {
        score?: number;
      }).score
    );

    const total = Number(submission.total_marks);

    if (
      !Number.isFinite(score) ||
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return null;
    }

    return (score / total) * 100;
  })
  .filter(
    (value): value is number =>
      value !== null
  );

const average =
  quizPercentages.length > 0
    ? Math.round(
        quizPercentages.reduce(
          (sum, value) => sum + value,
          0
        ) / quizPercentages.length
      )
    : 0;

setAverageQuizScore(average);
      } catch (error) {
        console.error('Faculty dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [profile]);

  if (!profile) return null;

  const myMaterials = materials.filter(
    (material) => material.faculty_id === profile.id
  );

  /*
   * Quiz attempts:
   * Count unique students who have submitted at least one
   * of this faculty's quizzes.
   */
  const uniqueQuizStudents = new Set(
    quizSubmissions.map((submission) => submission.student_id)
  );

  const quizAttempts = uniqueQuizStudents.size;

  /*
   * Student performance chart.
   *
   * For now this is based on quiz submissions.
   * We will improve this later when we add the full
   * faculty Results page and quiz analytics.
   */
  const subjectPerformance = subjects.map((subject) => {
    const subjectQuizzes = quizzes.filter(
      (quiz) => quiz.subject_id === subject.id
    );

    const subjectQuizIds = subjectQuizzes.map((quiz) => quiz.id);

    const subjectSubmissions = quizSubmissions.filter((submission) =>
      subjectQuizIds.includes(submission.quiz_id)
    );

    const completedSubmissions = subjectSubmissions.filter(
      (submission) =>
        submission.status === 'submitted' ||
        submission.status === 'completed'
    );

    const scores = completedSubmissions
      .map((submission) => {
        const score = Number(
          (submission as QuizSubmission & { score?: number }).score
        );

        const total = Number(submission.total_marks);

        if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) {
          return null;
        }

        return (score / total) * 100;
      })
      .filter((value): value is number => value !== null);

    const avg =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          )
        : 0;

    return {
      name: subject.code,
      avgScore: avg,
      attempts: completedSubmissions.length,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Faculty Dashboard
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Welcome, {profile.full_name}. Manage your subjects and activities.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Dashboard Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="My Subjects"
              value={subjects.length}
              color="primary"
            />

            <StatCard
              icon={ClipboardList}
              label="Assignments"
              value={assignments.length}
              color="accent"
            />

            <StatCard
              icon={FileText}
              label="Quizzes"
              value={quizzes.length}
              color="warning"
            />

            <StatCard
              icon={FlaskConical}
              label="Lab Tasks"
              value={labTasks.length}
              color="success"
            />

            <StatCard
              icon={FolderOpen}
              label="Materials"
              value={myMaterials.length}
              color="primary"
            />

            <StatCard
              icon={TrendingUp}
              label="Quiz Attempts"
              value={quizAttempts}
              color="accent"
            />

<StatCard
  icon={AlertCircle}
  label="Pending Grading"
  value={pendingGrading}
  color="warning"
/>

<StatCard
  icon={TrendingUp}
  label="Average Quiz Score"
  value={`${averageQuizScore}%`}
  color="success"
/>

          </div>

          {/* Student Performance + Subjects */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                Student Performance
              </h3>

              <p className="text-sm text-slate-400 mb-4">
                Average quiz scores across your subjects
              </p>

              {subjectPerformance.length > 0 &&
              subjectPerformance.some((s) => s.attempts > 0) ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={subjectPerformance}
                    margin={{
                      top: 5,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgb(148 163 184 / 0.2)"
                    />

                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      stroke="rgb(148 163 184 / 0.6)"
                    />

                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      stroke="rgb(148 163 184 / 0.6)"
                    />

                    <Tooltip />

                    <Bar
                      dataKey="avgScore"
                      fill="#3b82f6"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />

                    No quiz results yet.
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                My Subjects
              </h3>

              {subjects.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No subjects assigned yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {subjects.slice(0, 5).map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                          <BookOpen className="w-4 h-4" />
                        </div>

                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {subject.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {subject.code} · {subject.credits} credits
                          </p>
                        </div>
                      </div>

                      <span className="text-xs text-slate-400">
                        {subject.section?.name
                          ? `Sec ${subject.section.name}`
                          : 'All'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}