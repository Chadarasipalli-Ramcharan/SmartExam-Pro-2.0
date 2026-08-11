import { useEffect, useState } from 'react';
import {
  ClipboardList,
  FlaskConical,
  FileQuestion,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Save,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

import {
  fetchAssignments,
  fetchAssignmentSubmissions,
  gradeAssignmentSubmission,
  fetchLabTasks,
  fetchLabSubmissions,
  gradeLabSubmission,
  fetchQuizzes,
  fetchQuizSubmissionsByQuizIds,
} from '@/lib/queries';

import type {
  AssignmentWithDetails,
  AssignmentSubmissionWithDetails,
  LabTaskWithDetails,
  LabSubmissionWithDetails,
  QuizWithDetails,
  QuizSubmission,
} from '@/types';

type ResultTab = 'assignments' | 'labs' | 'quizzes';

type SubmissionState = {
  grade: string;
  feedback: string;
  saving: boolean;
};

export function FacultyResults() {
  const { profile } = useAuth();

  const [activeTab, setActiveTab] =
    useState<ResultTab>('assignments');

  const [assignments, setAssignments] = useState<
    AssignmentWithDetails[]
  >([]);

  const [labTasks, setLabTasks] = useState<
    LabTaskWithDetails[]
  >([]);

  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);

  const [assignmentSubmissions, setAssignmentSubmissions] =
    useState<AssignmentSubmissionWithDetails[]>([]);

  const [labSubmissions, setLabSubmissions] =
    useState<LabSubmissionWithDetails[]>([]);

  const [quizSubmissions, setQuizSubmissions] =
    useState<QuizSubmission[]>([]);

  const [submissionState, setSubmissionState] = useState<
    Record<string, SubmissionState>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;

    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          assignmentsData,
          labTasksData,
          quizzesData,
        ] = await Promise.all([
          fetchAssignments(undefined, profile.id),
          fetchLabTasks(undefined, profile.id),
          fetchQuizzes({ facultyId: profile.id }),
        ]);

        setAssignments(assignmentsData);
        setLabTasks(labTasksData);
        setQuizzes(quizzesData);

        const assignmentResults =
          await Promise.all(
            assignmentsData.map((assignment) =>
              fetchAssignmentSubmissions(assignment.id)
            )
          );

        const labResults =
          await Promise.all(
            labTasksData.map((labTask) =>
              fetchLabSubmissions(labTask.id)
            )
          );

        const quizIds = quizzesData.map((quiz) => quiz.id);

        const quizResults =
          quizIds.length > 0
            ? await fetchQuizSubmissionsByQuizIds(quizIds)
            : [];

        setAssignmentSubmissions(
          assignmentResults.flat()
        );

        setLabSubmissions(
          labResults.flat()
        );

        setQuizSubmissions(
          quizResults
        );

        const initialState: Record<
          string,
          SubmissionState
        > = {};

        assignmentResults
          .flat()
          .forEach((submission) => {
            initialState[`assignment-${submission.id}`] = {
              grade:
                submission.grade !== null
                  ? String(submission.grade)
                  : '',
              feedback:
                submission.feedback ?? '',
              saving: false,
            };
          });

        labResults
          .flat()
          .forEach((submission) => {
            initialState[`lab-${submission.id}`] = {
              grade:
                submission.grade !== null
                  ? String(submission.grade)
                  : '',
              feedback:
                submission.feedback ?? '',
              saving: false,
            };
          });

        setSubmissionState(initialState);
      } catch (err) {
        console.error(
          'Faculty results load error:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load results.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [profile]);

  if (!profile) return null;

  const updateSubmissionState = (
    key: string,
    field: 'grade' | 'feedback',
    value: string
  ) => {
    setSubmissionState((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        [field]: value,
      },
    }));
  };

  const saveAssignmentGrade = async (
    submission: AssignmentSubmissionWithDetails
  ) => {
    const key = `assignment-${submission.id}`;
    const state = submissionState[key];

    if (!state) return;

    const grade = Number(state.grade);

    if (!Number.isFinite(grade)) {
      alert('Please enter a valid mark.');
      return;
    }

    const maxMarks =
      submission.assignment?.max_marks ?? 0;

    if (grade < 0 || grade > maxMarks) {
      alert(
        `Marks must be between 0 and ${maxMarks}.`
      );
      return;
    }

    try {
      setSubmissionState((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          saving: true,
        },
      }));

      await gradeAssignmentSubmission(
        submission.id,
        grade,
        state.feedback,
        profile.id
      );

      setAssignmentSubmissions((previous) =>
        previous.map((item) =>
          item.id === submission.id
            ? {
                ...item,
                grade,
                feedback: state.feedback,
                graded_by: profile.id,
                graded_at:
                  new Date().toISOString(),
                status: 'graded',
              }
            : item
        )
      );

      alert('Assignment grade saved successfully.');
    } catch (err) {
      console.error(
        'Assignment grading error:',
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : 'Failed to save assignment grade.'
      );
    } finally {
      setSubmissionState((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          saving: false,
        },
      }));
    }
  };

  const saveLabGrade = async (
    submission: LabSubmissionWithDetails
  ) => {
    const key = `lab-${submission.id}`;
    const state = submissionState[key];

    if (!state) return;

    const grade = Number(state.grade);

    if (!Number.isFinite(grade)) {
      alert('Please enter a valid mark.');
      return;
    }

    const maxMarks =
      submission.lab_task?.max_marks ?? 0;

    if (grade < 0 || grade > maxMarks) {
      alert(
        `Marks must be between 0 and ${maxMarks}.`
      );
      return;
    }

    try {
      setSubmissionState((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          saving: true,
        },
      }));

      await gradeLabSubmission(
        submission.id,
        grade,
        state.feedback,
        profile.id
      );

      setLabSubmissions((previous) =>
        previous.map((item) =>
          item.id === submission.id
            ? {
                ...item,
                grade,
                feedback: state.feedback,
                graded_by: profile.id,
                graded_at:
                  new Date().toISOString(),
                status: 'graded',
              }
            : item
        )
      );

      alert('Lab task grade saved successfully.');
    } catch (err) {
      console.error(
        'Lab grading error:',
        err
      );

      alert(
        err instanceof Error
          ? err.message
          : 'Failed to save lab grade.'
      );
    } finally {
      setSubmissionState((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          saving: false,
        },
      }));
    }
  };

  const getAssignmentSubmissionCount = (
    assignmentId: string
  ) =>
    assignmentSubmissions.filter(
      (submission) =>
        submission.assignment_id === assignmentId
    ).length;

  const getLabSubmissionCount = (
    labTaskId: string
  ) =>
    labSubmissions.filter(
      (submission) =>
        submission.lab_task_id === labTaskId
    ).length;

  const getQuizSubmissions = (
    quizId: string
  ) =>
    quizSubmissions.filter(
      (submission) =>
        submission.quiz_id === quizId
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Results
        </h1>

        <p className="text-sm text-slate-500 mt-1">
          Review student submissions, grade assignments and
          lab tasks, and view automatically scored quizzes.
        </p>
      </div>

      {/* Result Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setActiveTab('assignments')
          }
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assignments
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('labs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'labs'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Lab Tasks
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'quizzes'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Quizzes
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-400">
          Loading results...
        </div>
      ) : error ? (
        <div className="card p-6">
          <div className="flex items-start gap-3 text-red-500">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">
                Unable to load results
              </p>
              <p className="text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ================= ASSIGNMENTS ================= */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {assignments.length === 0 ? (
                <div className="card p-10 text-center">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />

                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    No assignments found
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Assignments posted by you will appear here.
                  </p>
                </div>
              ) : (
                assignments.map((assignment) => {
                  const submissions =
                    assignmentSubmissions.filter(
                      (submission) =>
                        submission.assignment_id ===
                        assignment.id
                    );

                  return (
                    <div
                      key={assignment.id}
                      className="card overflow-hidden"
                    >
                      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                              {assignment.title}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                              {assignment.subject?.code
                                ? `${assignment.subject.code} · `
                                : ''}
                              Maximum marks:{' '}
                              {assignment.max_marks}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              {submissions.length}{' '}
                              submission
                              {submissions.length !== 1
                                ? 's'
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {submissions.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">
                          No students have submitted this
                          assignment yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                          {submissions.map(
                            (submission) => {
                              const key = `assignment-${submission.id}`;
                              const state =
                                submissionState[key];

                              return (
                                <div
                                  key={submission.id}
                                  className="p-5"
                                >
                                  <div className="flex flex-col xl:flex-row gap-5">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="font-medium text-slate-900 dark:text-white">
                                            {submission.student
                                              ?.full_name ??
                                              'Unknown student'}
                                          </p>

                                          <p className="text-xs text-slate-400 mt-1">
                                            {submission.student
                                              ?.roll_number ??
                                              submission.student
                                                ?.email ??
                                              ''}
                                          </p>
                                        </div>

                                        {submission.status ===
                                        'graded' ? (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Graded
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            Pending grading
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-4 space-y-2 text-sm">
                                        <p className="text-slate-500 dark:text-slate-400">
                                          Submitted:{' '}
                                          {new Date(
                                            submission.submitted_at
                                          ).toLocaleString()}
                                        </p>

                                        {submission.comments && (
                                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <p className="text-xs font-medium text-slate-500 mb-1">
                                              Student comment
                                            </p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                              {submission.comments}
                                            </p>
                                          </div>
                                        )}

                                        {submission.file_url && (
                                          <a
                                            href={
                                              submission.file_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            Open submitted work
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    <div className="xl:w-80 space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                          Marks
                                        </label>

                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max={
                                              assignment.max_marks
                                            }
                                            step="0.5"
                                            value={
                                              state?.grade ??
                                              ''
                                            }
                                            onChange={(event) =>
                                              updateSubmissionState(
                                                key,
                                                'grade',
                                                event.target.value
                                              )
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Enter marks"
                                          />

                                          <span className="text-sm text-slate-400 whitespace-nowrap">
                                            /{' '}
                                            {
                                              assignment.max_marks
                                            }
                                          </span>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          Feedback
                                        </label>

                                        <textarea
                                          rows={3}
                                          value={
                                            state?.feedback ??
                                            ''
                                          }
                                          onChange={(event) =>
                                            updateSubmissionState(
                                              key,
                                              'feedback',
                                              event.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                          placeholder="Add feedback for the student..."
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          saveAssignmentGrade(
                                            submission
                                          )
                                        }
                                        disabled={
                                          state?.saving
                                        }
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                                      >
                                        <Save className="w-4 h-4" />
                                        {state?.saving
                                          ? 'Saving...'
                                          : 'Save Grade'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= LAB TASKS ================= */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              {labTasks.length === 0 ? (
                <div className="card p-10 text-center">
                  <FlaskConical className="w-10 h-10 mx-auto mb-3 text-slate-300" />

                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    No lab tasks found
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Lab tasks posted by you will appear here.
                  </p>
                </div>
              ) : (
                labTasks.map((labTask) => {
                  const submissions =
                    labSubmissions.filter(
                      (submission) =>
                        submission.lab_task_id ===
                        labTask.id
                    );

                  return (
                    <div
                      key={labTask.id}
                      className="card overflow-hidden"
                    >
                      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                              {labTask.title}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                              {labTask.subject?.code
                                ? `${labTask.subject.code} · `
                                : ''}
                              Maximum marks:{' '}
                              {labTask.max_marks}
                            </p>
                          </div>

                          <span className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                            {submissions.length}{' '}
                            submission
                            {submissions.length !== 1
                              ? 's'
                              : ''}
                          </span>
                        </div>
                      </div>

                      {submissions.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">
                          No students have submitted this lab
                          task yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-800">
                          {submissions.map(
                            (submission) => {
                              const key = `lab-${submission.id}`;
                              const state =
                                submissionState[key];

                              return (
                                <div
                                  key={submission.id}
                                  className="p-5"
                                >
                                  <div className="flex flex-col xl:flex-row gap-5">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>
                                          <p className="font-medium text-slate-900 dark:text-white">
                                            {submission.student
                                              ?.full_name ??
                                              'Unknown student'}
                                          </p>

                                          <p className="text-xs text-slate-400 mt-1">
                                            {submission.student
                                              ?.roll_number ??
                                              submission.student
                                                ?.email ??
                                              ''}
                                          </p>
                                        </div>

                                        {submission.status ===
                                        'graded' ? (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Graded
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                            <Clock3 className="w-3.5 h-3.5" />
                                            Pending grading
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-4 space-y-2 text-sm">
                                        <p className="text-slate-500 dark:text-slate-400">
                                          Submitted:{' '}
                                          {new Date(
                                            submission.submitted_at
                                          ).toLocaleString()}
                                        </p>

                                        {submission.comments && (
                                          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                            <p className="text-xs font-medium text-slate-500 mb-1">
                                              Student comment
                                            </p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                              {submission.comments}
                                            </p>
                                          </div>
                                        )}

                                        <div className="flex flex-wrap gap-3">
                                          {submission.file_url && (
                                            <a
                                              href={
                                                submission.file_url
                                              }
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                              Open submitted file
                                            </a>
                                          )}

                                          {submission.github_url && (
                                            <a
                                              href={
                                                submission.github_url
                                              }
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                              Open GitHub
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="xl:w-80 space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                          Marks
                                        </label>

                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max={
                                              labTask.max_marks
                                            }
                                            step="0.5"
                                            value={
                                              state?.grade ??
                                              ''
                                            }
                                            onChange={(event) =>
                                              updateSubmissionState(
                                                key,
                                                'grade',
                                                event.target.value
                                              )
                                            }
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="Enter marks"
                                          />

                                          <span className="text-sm text-slate-400 whitespace-nowrap">
                                            /{' '}
                                            {
                                              labTask.max_marks
                                            }
                                          </span>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1.5">
                                          <MessageSquare className="w-3.5 h-3.5" />
                                          Feedback
                                        </label>

                                        <textarea
                                          rows={3}
                                          value={
                                            state?.feedback ??
                                            ''
                                          }
                                          onChange={(event) =>
                                            updateSubmissionState(
                                              key,
                                              'feedback',
                                              event.target.value
                                            )
                                          }
                                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                          placeholder="Add feedback for the student..."
                                        />
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          saveLabGrade(
                                            submission
                                          )
                                        }
                                        disabled={
                                          state?.saving
                                        }
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                                      >
                                        <Save className="w-4 h-4" />
                                        {state?.saving
                                          ? 'Saving...'
                                          : 'Save Grade'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ================= QUIZZES ================= */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              {quizzes.length === 0 ? (
                <div className="card p-10 text-center">
                  <FileQuestion className="w-10 h-10 mx-auto mb-3 text-slate-300" />

                  <p className="font-medium text-slate-700 dark:text-slate-200">
                    No quizzes found
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Quizzes posted by you will appear here.
                  </p>
                </div>
              ) : (
                quizzes.map((quiz) => {
                  const submissions =
                    getQuizSubmissions(quiz.id);

                  return (
                    <div
                      key={quiz.id}
                      className="card overflow-hidden"
                    >
                      <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                              {quiz.title}
                            </h2>

                            <p className="text-sm text-slate-500 mt-1">
                              {quiz.subject?.code
                                ? `${quiz.subject.code} · `
                                : ''}
                              Total marks:{' '}
                              {quiz.total_marks}
                            </p>
                          </div>

                          <span className="px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm">
                            {submissions.length}{' '}
                            attempt
                            {submissions.length !== 1
                              ? 's'
                              : ''}
                          </span>
                        </div>
                      </div>

                      {submissions.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">
                          No students have attempted this
                          quiz yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                                <th className="px-5 py-3 font-medium text-slate-500">
                                  Student
                                </th>

                                <th className="px-5 py-3 font-medium text-slate-500">
                                  Status
                                </th>

                                <th className="px-5 py-3 font-medium text-slate-500">
                                  Score
                                </th>

                                <th className="px-5 py-3 font-medium text-slate-500">
                                  Percentage
                                </th>

                                <th className="px-5 py-3 font-medium text-slate-500">
                                  Submitted
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {submissions.map(
                                (submission) => {
                                  const percentage =
                                    submission.total_marks >
                                    0
                                      ? Math.round(
                                          (submission.score /
                                            submission.total_marks) *
                                            100
                                        )
                                      : 0;

                                  return (
                                    <tr
                                      key={
                                        submission.id
                                      }
                                      className="border-b border-slate-100 dark:border-slate-800/70 last:border-0"
                                    >
                                      <td className="px-5 py-4">
                                        <div>
                                          <p className="font-medium text-slate-900 dark:text-white">
                                            Student
                                          </p>

                                          <p className="text-xs text-slate-400">
                                            {submission.student_id}
                                          </p>
                                        </div>
                                      </td>

                                      <td className="px-5 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          {submission.status}
                                        </span>
                                      </td>

                                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                                        {submission.score}{' '}
                                        /{' '}
                                        {
                                          submission.total_marks
                                        }
                                      </td>

                                      <td className="px-5 py-4">
                                        {percentage}%
                                      </td>

                                      <td className="px-5 py-4 text-slate-500">
                                        {submission.submitted_at
                                          ? new Date(
                                              submission.submitted_at
                                            ).toLocaleString()
                                          : 'Not submitted'}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}