import {
  ArrowLeft,
  BookOpen,
  Edit,
  // FileCheck2,
  GraduationCap,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  createTrainingEnrollment,
  createTrainingSkill,
  deleteTrainingEnrollment,
  deleteTrainingSkill,
  enrollmentStatuses,
  getTrainingErrorMessage,
  getTrainingEnrollments,
  getTrainingProgram,
  getTrainingSkills,
  skillLevels,
  updateTrainingEnrollment,
  updateTrainingSkill,
  type AssessmentResult,
  type EmployeeSkill,
  type EnrollmentStatus,
  type SkillLevel,
  type TrainingEnrollment,
  type TrainingProgramDetail,
} from "../services/trainingService";

import {
  getEmployees,
  type Employee,
} from "../services/workforceService";

const format = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value: string | null) =>
  value
    ? new Date(
        `${value.length === 10 ? `${value}T00:00:00Z` : value}`,
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "-";

const statusClass = (value: string) =>
  value === "COMPLETED" || value === "CERTIFICATE"
    ? "bg-emerald-100 text-emerald-700"
    : value === "ASSESSMENT"
      ? "bg-amber-100 text-amber-700"
      : "bg-sky-100 text-sky-700";

const skillLevelClass = (value: string) => {
  switch (value) {
    case "BEGINNER":
      return "bg-slate-100 text-slate-700";

    case "INTERMEDIATE":
      return "bg-sky-100 text-sky-700";

    case "ADVANCED":
      return "bg-violet-100 text-violet-700";

    case "EXPERT":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

interface EnrollmentDraft {
  status: EnrollmentStatus;
  registeredDate: string;
  attendedDate: string;
  completedDate: string;
  assessmentScore: string;
  assessmentResult: "" | AssessmentResult;
  certificateName: string;
  certificateUrl: string;
  certificateDate: string;
  remarks: string;
}

interface SkillDraft {
  employeeId: string;
  skillName: string;
  skillLevel: SkillLevel;
  acquiredDate: string;
  remarks: string;
}

type DeleteTarget =
  | {
      type: "enrollment";
      id: number;
      name: string;
    }
  | {
      type: "skill";
      id: number;
      name: string;
    }
  | null;

function draftFromEnrollment(
  enrollment: TrainingEnrollment,
): EnrollmentDraft {
  return {
    status: enrollment.status as EnrollmentStatus,
    registeredDate: enrollment.registeredDate ?? "",
    attendedDate: enrollment.attendedDate ?? "",
    completedDate: enrollment.completedDate ?? "",
    assessmentScore:
      enrollment.assessmentScore === null
        ? ""
        : String(enrollment.assessmentScore),
    assessmentResult:
      enrollment.assessmentResult === "PASS" ||
      enrollment.assessmentResult === "FAIL"
        ? enrollment.assessmentResult
        : "",
    certificateName: enrollment.certificateName ?? "",
    certificateUrl: enrollment.certificateUrl ?? "",
    certificateDate: enrollment.certificateDate ?? "",
    remarks: enrollment.remarks ?? "",
  };
}

function draftFromSkill(skill: EmployeeSkill): SkillDraft {
  return {
    employeeId: String(skill.employeeId),
    skillName: skill.skillName,
    skillLevel: skill.skillLevel as SkillLevel,
    acquiredDate: skill.acquiredDate ?? "",
    remarks: skill.remarks ?? "",
  };
}

function TrainingDetails() {
  const { id } = useParams();

  const [program, setProgram] =
    useState<TrainingProgramDetail | null>(null);

  const [enrollments, setEnrollments] =
    useState<TrainingEnrollment[]>([]);

  const [skills, setSkills] =
    useState<EmployeeSkill[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState("");

  const [enrollmentEmployee, setEnrollmentEmployee] =
    useState("");

  const [enrollmentDate, setEnrollmentDate] =
    useState("");

  const [enrollmentRemarks, setEnrollmentRemarks] =
    useState("");

  const [skillEmployee, setSkillEmployee] =
    useState("");

  const [skillName, setSkillName] =
    useState("");

  const [skillLevel, setSkillLevel] =
    useState<SkillLevel>("BEGINNER");

  const [skillDate, setSkillDate] =
    useState("");

  const [skillRemarks, setSkillRemarks] =
    useState("");

  const [editingEnrollment, setEditingEnrollment] =
    useState<number | null>(null);

  const [enrollmentDraft, setEnrollmentDraft] =
    useState<EnrollmentDraft | null>(null);

  const [editingSkill, setEditingSkill] =
    useState<number | null>(null);

  const [skillDraft, setSkillDraft] =
    useState<SkillDraft | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<DeleteTarget>(null);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const [
        programData,
        enrollmentData,
        skillData,
        employeeData,
      ] = await Promise.all([
        getTrainingProgram(id),
        getTrainingEnrollments(id),
        getTrainingSkills(id),
        getEmployees(),
      ]);

      setProgram(programData);
      setEnrollments(enrollmentData);
      setSkills(skillData);

      /*
       * IMPORTANT:
       * getEmployees() returns EmployeeDirectoryData.
       * The actual employee array is employeeData.employees.
       */
      setEmployees(employeeData.employees);
    } catch (requestError) {
      setError(
        getTrainingErrorMessage(
          requestError,
          "Unable to load this training program.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const run = async (
    name: string,
    request: () => Promise<void>,
    message = "Training information updated successfully.",
  ) => {
    try {
      setBusy(name);
      setError("");
      setSuccess("");

      await request();

      setSuccess(message);

      await load();
    } catch (requestError) {
      setError(
        getTrainingErrorMessage(
          requestError,
          "Unable to update training information.",
        ),
      );
    } finally {
      setBusy("");
    }
  };

  const addEnrollment = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!id || !enrollmentEmployee) {
      setError("Employee is required.");
      return;
    }

    await run(
      "enrollment",
      async () => {
        await createTrainingEnrollment(id, {
          employeeId: Number(enrollmentEmployee),
          assignedDate: enrollmentDate || null,
          remarks: enrollmentRemarks.trim() || null,
        });

        setEnrollmentEmployee("");
        setEnrollmentDate("");
        setEnrollmentRemarks("");
      },
      "Employee enrolled successfully.",
    );
  };

  const addSkill = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !id ||
      !skillEmployee ||
      !skillName.trim()
    ) {
      setError(
        "Employee and skill name are required.",
      );
      return;
    }

    await run(
      "skill",
      async () => {
        await createTrainingSkill(id, {
          employeeId: Number(skillEmployee),
          skillName: skillName.trim(),
          skillLevel,
          acquiredDate: skillDate || null,
          remarks: skillRemarks.trim() || null,

          /*
           * DO NOT require an enrollment here.
           * Skill development is independent from enrollment.
           */
        });

        setSkillEmployee("");
        setSkillName("");
        setSkillLevel("BEGINNER");
        setSkillDate("");
        setSkillRemarks("");
      },
      "Skill added successfully.",
    );
  };

  const saveEnrollment = async (
    enrollment: TrainingEnrollment,
  ) => {
    if (!id || !enrollmentDraft) return;

    const score =
      enrollmentDraft.assessmentScore === ""
        ? null
        : Number(enrollmentDraft.assessmentScore);

    if (
      score !== null &&
      (!Number.isInteger(score) ||
        score < 0 ||
        score > 100)
    ) {
      setError(
        "Assessment score must be between 0 and 100.",
      );
      return;
    }

    await run(
      `enrollment-${enrollment.id}`,
      async () => {
        await updateTrainingEnrollment(
          id,
          enrollment.id,
          {
            status: enrollmentDraft.status,

            registeredDate:
              enrollmentDraft.registeredDate || null,

            attendedDate:
              enrollmentDraft.attendedDate || null,

            completedDate:
              enrollmentDraft.completedDate || null,

            assessmentScore: score,

            assessmentResult:
              enrollmentDraft.assessmentResult || null,

            certificateName:
              enrollmentDraft.certificateName.trim() ||
              null,

            certificateUrl:
              enrollmentDraft.certificateUrl.trim() ||
              null,

            certificateDate:
              enrollmentDraft.certificateDate || null,

            remarks:
              enrollmentDraft.remarks.trim() || null,
          },
        );

        setEditingEnrollment(null);
        setEnrollmentDraft(null);
      },
      "Training enrollment updated successfully.",
    );
  };

  const saveSkill = async (
    skill: EmployeeSkill,
  ) => {
    if (!id || !skillDraft) return;

    if (!skillDraft.skillName.trim()) {
      setError("Skill name is required.");
      return;
    }

    await run(
      `skill-${skill.id}`,
      async () => {
        await updateTrainingSkill(
          id,
          skill.id,
          {
            employeeId:
              Number(skillDraft.employeeId),

            skillName:
              skillDraft.skillName.trim(),

            skillLevel:
              skillDraft.skillLevel,

            acquiredDate:
              skillDraft.acquiredDate || null,

            remarks:
              skillDraft.remarks.trim() || null,

            /*
             * Preserve the existing relationship if
             * this skill already has one.
             */
            trainingEnrollmentId:
              skill.trainingEnrollmentId,
          },
        );

        setEditingSkill(null);
        setSkillDraft(null);
      },
      "Employee skill updated successfully.",
    );
  };

  const confirmDelete = async () => {
    if (!id || !deleteTarget) return;

    const target = deleteTarget;

    if (target.type === "enrollment") {
      await run(
        `delete-enrollment-${target.id}`,
        async () => {
          await deleteTrainingEnrollment(
            id,
            target.id,
          );

          if (
            editingEnrollment === target.id
          ) {
            setEditingEnrollment(null);
            setEnrollmentDraft(null);
          }
        },
        "Training enrollment deleted successfully.",
      );
    }

    if (target.type === "skill") {
      await run(
        `delete-skill-${target.id}`,
        async () => {
          await deleteTrainingSkill(
            id,
            target.id,
          );

          if (
            editingSkill === target.id
          ) {
            setEditingSkill(null);
            setSkillDraft(null);
          }
        },
        "Employee skill deleted successfully.",
      );
    }

    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <StateMessage type="loading">
          Loading training program...
        </StateMessage>
      </DashboardLayout>
    );
  }

  if (error && !program) {
    return (
      <DashboardLayout>
        <StateMessage type="error">
          {error}
        </StateMessage>
      </DashboardLayout>
    );
  }

  if (!program || !id) {
    return null;
  }

  /*
   * Employee enrollment dropdown:
   * only employees who aren't already enrolled.
   */
  const enrolledEmployeeIds = new Set(
    enrollments.map(
      (enrollment) => enrollment.employeeId,
    ),
  );

  const availableEnrollmentEmployees =
    employees.filter(
      (employee) =>
        !enrolledEmployeeIds.has(employee.id),
    );

  /*
   * Skill dropdown:
   * ALL employees are available.
   *
   * This is the important fix.
   */
  const availableSkillEmployees = employees;

  return (
    <DashboardLayout>
      <div className="flex min-w-0 w-full flex-col gap-6">
        <Link
          to="/training"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Training"
        >
          <ArrowLeft size={17} />
          Back to Training
        </Link>

        <PageHeader
          title={program.courseName}
          subtitle={`${program.category} · ${format(
            program.status,
          )}`}
          icon={GraduationCap}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* =====================================================
            TRAINING INFORMATION
        ===================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
              <BookOpen size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Training Information
              </h2>

              <p className="text-sm text-slate-500">
                Details of this training program.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Course
              </p>

              <p className="mt-1 text-sm font-medium text-slate-900">
                {program.courseName}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {program.category}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Trainer
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {program.trainer}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Duration
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {program.duration}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mode
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {format(program.mode)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cost
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {currency(program.cost)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assessment
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {program.assessment || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </p>

              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  program.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {format(program.status)}
              </span>
            </div>
          </div>

          {program.description && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {program.description}
              </p>
            </div>
          )}
        </section>

        {/* =====================================================
            EMPLOYEE ENROLLMENTS
        ===================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <Users size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Employee Enrollments
                </h2>

                <p className="text-sm text-slate-500">
                  Employees enrolled in this training program.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
              }}
              className="hidden"
            >
              Hidden
            </button>
          </div>

          <form
            onSubmit={addEnrollment}
            className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr_auto]">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Employee
                </label>

                <select
                  value={enrollmentEmployee}
                  onChange={(event) =>
                    setEnrollmentEmployee(
                      event.target.value,
                    )
                  }
                  disabled={
                    busy === "enrollment" ||
                    availableEnrollmentEmployees.length === 0
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 disabled:bg-slate-100"
                >
                  <option value="">
                    Select employee
                  </option>

                  {availableEnrollmentEmployees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.firstName}{" "}
                        {employee.lastName} ·{" "}
                        {employee.employeeCode}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Assigned Date
                </label>

                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(event) =>
                    setEnrollmentDate(
                      event.target.value,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Remarks
                </label>

                <input
                  type="text"
                  value={enrollmentRemarks}
                  onChange={(event) =>
                    setEnrollmentRemarks(
                      event.target.value,
                    )
                  }
                  placeholder="Optional remarks"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={
                    busy === "enrollment" ||
                    availableEnrollmentEmployees.length === 0
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />

                  {busy === "enrollment"
                    ? "Adding..."
                    : "Enroll"}
                </button>
              </div>
            </div>

            {availableEnrollmentEmployees.length === 0 &&
              employees.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  All available employees are already
                  enrolled in this training.
                </p>
              )}
          </form>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {enrollments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Users
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No employee enrollments yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Employee
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Department
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Registered
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Attended
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Completed
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Assessment
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Certificate
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id}>
                        {editingEnrollment ===
                        enrollment.id &&
                        enrollmentDraft ? (
                          <td
                            colSpan={9}
                            className="p-5"
                          >
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Status
                                  </label>

                                  <select
                                    value={
                                      enrollmentDraft.status
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                status:
                                                  event
                                                    .target
                                                    .value as EnrollmentStatus,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  >
                                    {enrollmentStatuses.map(
                                      (item) => (
                                        <option
                                          key={item}
                                          value={item}
                                        >
                                          {format(item)}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Registered Date
                                  </label>

                                  <input
                                    type="date"
                                    value={
                                      enrollmentDraft.registeredDate
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                registeredDate:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Attended Date
                                  </label>

                                  <input
                                    type="date"
                                    value={
                                      enrollmentDraft.attendedDate
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                attendedDate:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Completed Date
                                  </label>

                                  <input
                                    type="date"
                                    value={
                                      enrollmentDraft.completedDate
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                completedDate:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Assessment Score
                                  </label>

                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={
                                      enrollmentDraft.assessmentScore
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                assessmentScore:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Assessment Result
                                  </label>

                                  <select
                                    value={
                                      enrollmentDraft.assessmentResult
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                assessmentResult:
                                                  event
                                                    .target
                                                    .value as
                                                    | ""
                                                    | AssessmentResult,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  >
                                    <option value="">
                                      Select result
                                    </option>

                                    <option value="PASS">
                                      Pass
                                    </option>

                                    <option value="FAIL">
                                      Fail
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Certificate Name
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      enrollmentDraft.certificateName
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                certificateName:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Certificate Date
                                  </label>

                                  <input
                                    type="date"
                                    value={
                                      enrollmentDraft.certificateDate
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                certificateDate:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div className="md:col-span-2 lg:col-span-4">
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Certificate URL
                                  </label>

                                  <input
                                    type="url"
                                    value={
                                      enrollmentDraft.certificateUrl
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                certificateUrl:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div className="md:col-span-2 lg:col-span-4">
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Remarks
                                  </label>

                                  <textarea
                                    rows={3}
                                    value={
                                      enrollmentDraft.remarks
                                    }
                                    onChange={(event) =>
                                      setEnrollmentDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                remarks:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="mt-5 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingEnrollment(
                                      null,
                                    );
                                    setEnrollmentDraft(
                                      null,
                                    );
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveEnrollment(
                                      enrollment,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    `enrollment-${enrollment.id}`
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  <Save size={16} />

                                  {busy ===
                                  `enrollment-${enrollment.id}`
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-900">
                                {enrollment.employeeName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {enrollment.employeeCode}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {enrollment.employeeDepartment ??
                                "Unassigned"}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                                  enrollment.status,
                                )}`}
                              >
                                {format(
                                  enrollment.status,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(
                                enrollment.registeredDate,
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(
                                enrollment.attendedDate,
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(
                                enrollment.completedDate,
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {enrollment.assessmentResult
                                ? format(
                                    enrollment.assessmentResult,
                                  )
                                : "-"}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {enrollment.certificateName ||
                                "-"}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  title="Edit enrollment"
                                  onClick={() => {
                                    setEditingEnrollment(
                                      enrollment.id,
                                    );

                                    setEnrollmentDraft(
                                      draftFromEnrollment(
                                        enrollment,
                                      ),
                                    );

                                    setError("");
                                    setSuccess("");
                                  }}
                                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                                >
                                  <Edit size={16} />
                                </button>

                                <button
                                  type="button"
                                  title="Delete enrollment"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "enrollment",
                                      id: enrollment.id,
                                      name: enrollment.employeeName,
                                    })
                                  }
                                  className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            SKILL DEVELOPMENT
        ===================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <GraduationCap size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Skill Development
                </h2>

                <p className="text-sm text-slate-500">
                  Track skills acquired through this training
                  program.
                </p>
              </div>
            </div>
          </div>

          {/*
           * IMPORTANT:
           *
           * There is NO:
           *
           * enrollments.length === 0
           *
           * restriction here.
           *
           * Any employee can be selected.
           */}

          <form
            onSubmit={addSkill}
            className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Employee
                </label>

                <select
                  value={skillEmployee}
                  onChange={(event) =>
                    setSkillEmployee(
                      event.target.value,
                    )
                  }
                  disabled={
                    busy === "skill" ||
                    availableSkillEmployees.length === 0
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600 disabled:bg-slate-100"
                >
                  <option value="">
                    Select employee
                  </option>

                  {availableSkillEmployees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.firstName}{" "}
                        {employee.lastName} ·{" "}
                        {employee.employeeCode}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Skill
                </label>

                <input
                  type="text"
                  value={skillName}
                  onChange={(event) =>
                    setSkillName(event.target.value)
                  }
                  placeholder="e.g. React.js"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Skill Level
                </label>

                <select
                  value={skillLevel}
                  onChange={(event) =>
                    setSkillLevel(
                      event.target.value as SkillLevel,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                >
                  {skillLevels.map((level) => (
                    <option
                      key={level}
                      value={level}
                    >
                      {format(level)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Acquired Date
                </label>

                <input
                  type="date"
                  value={skillDate}
                  onChange={(event) =>
                    setSkillDate(event.target.value)
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={
                    busy === "skill" ||
                    availableSkillEmployees.length === 0
                  }
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} />

                  {busy === "skill"
                    ? "Adding..."
                    : "Add Skill"}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Remarks
              </label>

              <input
                type="text"
                value={skillRemarks}
                onChange={(event) =>
                  setSkillRemarks(
                    event.target.value,
                  )
                }
                placeholder="Optional remarks"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
              />
            </div>

            {employees.length === 0 && (
              <p className="mt-3 text-sm text-amber-700">
                No employees are available in the workforce.
              </p>
            )}

            {employees.length > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                Skills can be added independently of employee
                enrollment.
              </p>
            )}
          </form>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {skills.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <GraduationCap
                  size={38}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No skill development records yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Employee
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Skill
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Level
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Acquired Date
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Remarks
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {skills.map((skill) => (
                      <tr key={skill.id}>
                        {editingSkill === skill.id &&
                        skillDraft ? (
                          <td
                            colSpan={6}
                            className="p-5"
                          >
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Employee
                                  </label>

                                  <select
                                    value={
                                      skillDraft.employeeId
                                    }
                                    onChange={(event) =>
                                      setSkillDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                employeeId:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  >
                                    {availableSkillEmployees.map(
                                      (employee) => (
                                        <option
                                          key={employee.id}
                                          value={employee.id}
                                        >
                                          {employee.firstName}{" "}
                                          {employee.lastName}{" "}
                                          ·{" "}
                                          {employee.employeeCode}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Skill
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      skillDraft.skillName
                                    }
                                    onChange={(event) =>
                                      setSkillDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                skillName:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Skill Level
                                  </label>

                                  <select
                                    value={
                                      skillDraft.skillLevel
                                    }
                                    onChange={(event) =>
                                      setSkillDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                skillLevel:
                                                  event
                                                    .target
                                                    .value as SkillLevel,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  >
                                    {skillLevels.map(
                                      (level) => (
                                        <option
                                          key={level}
                                          value={level}
                                        >
                                          {format(level)}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Acquired Date
                                  </label>

                                  <input
                                    type="date"
                                    value={
                                      skillDraft.acquiredDate
                                    }
                                    onChange={(event) =>
                                      setSkillDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                acquiredDate:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Remarks
                                  </label>

                                  <input
                                    type="text"
                                    value={
                                      skillDraft.remarks
                                    }
                                    onChange={(event) =>
                                      setSkillDraft(
                                        (current) =>
                                          current
                                            ? {
                                                ...current,
                                                remarks:
                                                  event
                                                    .target
                                                    .value,
                                              }
                                            : current,
                                      )
                                    }
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="mt-5 flex justify-end gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSkill(
                                      null,
                                    );

                                    setSkillDraft(
                                      null,
                                    );
                                  }}
                                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                                >
                                  Cancel
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void saveSkill(
                                      skill,
                                    )
                                  }
                                  disabled={
                                    busy ===
                                    `skill-${skill.id}`
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                  <Save size={16} />

                                  {busy ===
                                  `skill-${skill.id}`
                                    ? "Saving..."
                                    : "Save"}
                                </button>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-900">
                                {skill.employeeName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {skill.employeeCode}
                              </p>
                            </td>

                            <td className="px-5 py-4 font-medium text-slate-800">
                              {skill.skillName}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${skillLevelClass(
                                  skill.skillLevel,
                                )}`}
                              >
                                {format(
                                  skill.skillLevel,
                                )}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {formatDate(
                                skill.acquiredDate,
                              )}
                            </td>

                            <td className="px-5 py-4 text-slate-600">
                              {skill.remarks || "-"}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  title="Edit skill"
                                  onClick={() => {
                                    setEditingSkill(
                                      skill.id,
                                    );

                                    setSkillDraft(
                                      draftFromSkill(
                                        skill,
                                      ),
                                    );

                                    setError("");
                                    setSuccess("");
                                  }}
                                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                                >
                                  <Edit size={16} />
                                </button>

                                <button
                                  type="button"
                                  title="Delete skill"
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "skill",
                                      id: skill.id,
                                      name: skill.skillName,
                                    })
                                  }
                                  className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            DELETE CONFIRMATION MODAL
        ===================================================== */}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
            role="presentation"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !busy
              ) {
                setDeleteTarget(null);
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-training-item-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex rounded-lg bg-red-50 p-2.5 text-red-600">
                    <Trash2 size={20} />
                  </div>

                  <h2
                    id="delete-training-item-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    {deleteTarget.type ===
                    "skill"
                      ? "Delete skill?"
                      : "Delete enrollment?"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold text-slate-700">
                      {deleteTarget.name}
                    </span>
                    ?
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  disabled={Boolean(busy)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                  aria-label="Close confirmation"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  disabled={Boolean(busy)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={Boolean(busy)}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 size={16} />

                  {busy
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TrainingDetails;