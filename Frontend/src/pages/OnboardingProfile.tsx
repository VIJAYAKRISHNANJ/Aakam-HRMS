import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Edit,
  FileText,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  completeOnboarding,
  createOnboardingDocument,
  createOnboardingEmployee,
  createOnboardingTask,
  deleteOnboardingDocument,
  deleteOnboardingTask,
  getOnboarding,
  getOnboardingErrorMessage,
  joinOnboarding,
  updateOnboarding,
  updateOnboardingDocument,
  updateOnboardingTask,
  type DocumentStatus,
  type DocumentType,
  type OnboardingDetail,
  type OnboardingDocument,
  type OnboardingTask,
  type TaskStatus,
} from "../services/onboardingService";

/* =========================================================
   TYPES
========================================================= */

type WorkflowStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED";

/* =========================================================
   HELPERS
========================================================= */

const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );

const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const statusClass = (status: string) =>
  status === "COMPLETED" || status === "VERIFIED"
    ? "bg-emerald-100 text-emerald-700"
    : status === "REJECTED" ||
        status === "CANCELLED"
      ? "bg-rose-100 text-rose-700"
      : status === "IN_PROGRESS" ||
          status === "SUBMITTED"
        ? "bg-blue-100 text-blue-700"
        : "bg-slate-100 text-slate-700";

const workflowStatusClass = (
  status: WorkflowStatus,
) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const steps = [
  "Offer Accepted",
  "Documents",
  "Verification",
  "Joining",
  "Employee ID",
  "Department Allocation",
  "Assets/System",
  "Completed",
];

/* =========================================================
   COMPONENT
========================================================= */

function OnboardingProfile() {
  const { id } = useParams();

  const [record, setRecord] =
    useState<OnboardingDetail | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState("");

  /* -------------------------------------------------------
     Forms
  ------------------------------------------------------- */

  const [taskName, setTaskName] =
    useState("");

  const [taskOwner, setTaskOwner] =
    useState("");

  const [taskDueDate, setTaskDueDate] =
    useState("");

  const [documentName, setDocumentName] =
    useState("");

  const [documentType, setDocumentType] =
    useState<DocumentType>("OTHER");

  const [employeeCode, setEmployeeCode] =
    useState("");

  const [joinDate, setJoinDate] =
    useState("");

  /* -------------------------------------------------------
     Modals
  ------------------------------------------------------- */

  const [showEmployeeForm, setShowEmployeeForm] =
    useState(false);

  const [showCompleteModal, setShowCompleteModal] =
    useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<{
      type: "document" | "task";
      id: number;
      name: string;
    } | null>(null);

  /* -------------------------------------------------------
     Date picker
  ------------------------------------------------------- */

  const joinDateInputRef =
    useRef<HTMLInputElement>(null);

  const taskDueDateInputRef =
    useRef<HTMLInputElement>(null);

  const openDatePicker = (
    inputRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    const input = inputRef.current as
      | (HTMLInputElement & {
          showPicker?: () => void;
        })
      | null;

    if (!input) return;

    try {
      input.showPicker?.();
    } catch {
      // Browser may not support showPicker.
    }

    input.focus();
  };

  /* =======================================================
     LOAD
  ======================================================= */

  const load = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getOnboarding(id);

      setRecord(data);
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          "Unable to load onboarding profile.",
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

    return () =>
      window.clearTimeout(timer);
  }, [load]);

  /* =======================================================
     GENERIC ACTION
  ======================================================= */

  const run = async (
    name: string,
    action: () => Promise<void>,
  ) => {
    try {
      setActionLoading(name);
      setError("");
      setSuccess("");

      await action();

      setSuccess(
        "Action completed successfully.",
      );

      await load();
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          "Unable to complete action.",
        ),
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =======================================================
     UPDATE WORKFLOW STATUS
  ======================================================= */

  const updateWorkflowStatus = async (
    field:
      | "assetAllocationStatus"
      | "systemAccessStatus",
    status: WorkflowStatus,
  ) => {
    if (!id) return;

    await run(
      field,
      async () => {
        await updateOnboarding(id, {
          [field]: status,
        });
      },
    );
  };

  /* =======================================================
     DOCUMENT VERIFICATION STATUS
  ======================================================= */

  const getDocumentVerificationStatus =
    (): WorkflowStatus => {
      if (!record || record.documents.length === 0) {
        return "PENDING";
      }

      const total =
        record.documents.length;

      const verified =
        record.documents.filter(
          (document) =>
            document.status === "VERIFIED",
        ).length;

      if (verified === total) {
        return "COMPLETED";
      }

      if (verified > 0) {
        return "IN_PROGRESS";
      }

      return "PENDING";
    };

  const documentVerificationStatus =
    getDocumentVerificationStatus();

  /* =======================================================
     ADD TASK
  ======================================================= */

  const addTask = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!id || !taskName.trim()) {
      setError("Task name is required.");
      return;
    }

    await run("task", async () => {
      await createOnboardingTask(id, {
        taskName: taskName.trim(),
        owner: taskOwner.trim() || null,
        dueDate: taskDueDate || null,
      });

      setTaskName("");
      setTaskOwner("");
      setTaskDueDate("");
    });
  };

  /* =======================================================
     ADD DOCUMENT
  ======================================================= */

  const addDocument = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!id || !documentName.trim()) {
      setError(
        "Document name is required.",
      );
      return;
    }

    await run("document", async () => {
      await createOnboardingDocument(id, {
        documentName: documentName.trim(),
        documentType,
      });

      setDocumentName("");
    });
  };

  /* =======================================================
     UPDATE TASK
  ======================================================= */

  const updateTask = (
    task: OnboardingTask,
    status: TaskStatus,
  ) =>
    run(
      `task-${task.id}`,
      async () => {
        await updateOnboardingTask(
          id!,
          task.id,
          { status },
        );
      },
    );

  /* =======================================================
     UPDATE DOCUMENT
  ======================================================= */

  const updateDocument = (
    document: OnboardingDocument,
    status: DocumentStatus,
  ) =>
    run(
      `document-${document.id}`,
      async () => {
        await updateOnboardingDocument(
          id!,
          document.id,
          { status },
        );
      },
    );

  /* =======================================================
     DELETE DOCUMENT / TASK
  ======================================================= */

  const confirmDelete = async () => {
    if (!id || !deleteTarget) return;

    const target = deleteTarget;

    try {
      setActionLoading(
        `${target.type}-${target.id}-delete`,
      );

      setError("");
      setSuccess("");

      if (target.type === "document") {
        await deleteOnboardingDocument(
          id,
          target.id,
        );
      } else {
        await deleteOnboardingTask(
          id,
          target.id,
        );
      }

      setDeleteTarget(null);

      setSuccess(
        `${
          target.type === "document"
            ? "Document"
            : "Task"
        } deleted successfully.`,
      );

      await load();
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          `Unable to delete ${
            target.type === "document"
              ? "document"
              : "task"
          }.`,
        ),
      );
    } finally {
      setActionLoading("");
    }
  };

  /* =======================================================
     WORKFLOW INDEX
  ======================================================= */

  const stepIndex = record
    ? record.status === "COMPLETED"
      ? 7
      : record.employeeId
        ? 4
        : record.actualJoiningDate
          ? 3
          : record.documentVerificationStatus ===
              "VERIFIED"
            ? 2
            : record.documentProgress
                  .completed > 0
              ? 1
              : 0
    : 0;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <DashboardLayout>
        <StateMessage type="loading">
          Loading onboarding profile...
        </StateMessage>
      </DashboardLayout>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error && !record) {
    return (
      <DashboardLayout>
        <StateMessage type="error">
          {error}
        </StateMessage>
      </DashboardLayout>
    );
  }

  if (!record || !id) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">

        {/* =================================================
            BACK + EDIT
        ================================================= */}

        <div className="flex items-center justify-between gap-3">

          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
            Back to Onboarding
          </Link>

          <Link
            to={`/onboarding/edit/${id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Edit size={16} />
            Edit
          </Link>

        </div>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <PageHeader
          title={record.candidateName}
          subtitle={`${record.onboardingCode} · ${
            record.jobPosition ??
            "No job position"
          }`}
          icon={UserRound}
        />

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            WORKFLOW PROGRESS
        ================================================= */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="font-semibold text-slate-900">
                Workflow progress
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {label(record.status)}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                record.status,
              )}`}
            >
              {label(record.status)}
            </span>

          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-4 lg:grid-cols-8">

            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-2 lg:block"
              >

                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    index <= stepIndex
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-400"
                  }`}
                >
                  {index < stepIndex ? (
                    <Check size={15} />
                  ) : (
                    index + 1
                  )}
                </div>

                <p
                  className={`mt-2 text-xs ${
                    index <= stepIndex
                      ? "font-semibold text-blue-700"
                      : "text-slate-500"
                  }`}
                >
                  {step}
                </p>

              </div>
            ))}

          </div>

        </section>

        {/* =================================================
            CANDIDATE + DOCUMENTS
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* CANDIDATE */}

          <section className="rounded-xl border border-slate-200 bg-white p-6">

            <h2 className="font-semibold text-slate-900">
              Candidate information
            </h2>

            <dl className="mt-5 space-y-4 border-t border-slate-100 pt-5 text-sm">

              {[
                [
                  "Candidate",
                  record.candidateName,
                ],
                [
                  "Email",
                  record.candidateEmail,
                ],
                [
                  "Job position",
                  record.jobPosition ?? "-",
                ],
                [
                  "Recruitment stage",
                  label(record.recruitmentStage),
                ],
                [
                  "Expected joining date",
                  date(
                    record.expectedJoiningDate,
                  ),
                ],
                [
                  "Actual joining date",
                  date(
                    record.actualJoiningDate,
                  ),
                ],
                [
                  "Department",
                  record.department,
                ],
                [
                  "Employee ID",
                  record.employeeCode ??
                    "Not created",
                ],
              ].map(
                ([term, value]) => (
                  <div
                    key={term}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-slate-500">
                      {term}
                    </dt>

                    <dd className="text-right font-medium text-slate-800">
                      {value}
                    </dd>
                  </div>
                ),
              )}

            </dl>

          </section>

          {/* DOCUMENTS */}

          <section className="rounded-xl border border-slate-200 bg-white p-6">

            <h2 className="font-semibold text-slate-900">
              Documents
            </h2>

            {/* ADD DOCUMENT */}

            <form
              onSubmit={addDocument}
              className="mt-4 grid gap-2 sm:grid-cols-[1fr_180px_auto]"
            >

              <input
                value={documentName}
                onChange={(event) =>
                  setDocumentName(
                    event.target.value,
                  )
                }
                placeholder="Document name"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />

              <select
                value={documentType}
                onChange={(event) =>
                  setDocumentType(
                    event.target
                      .value as DocumentType,
                  )
                }
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
              >
                <option value="OTHER">
                  Other
                </option>

                <option value="RESUME">
                  Resume
                </option>

                <option value="IDENTITY_PROOF">
                  Identity proof
                </option>

                <option value="ADDRESS_PROOF">
                  Address proof
                </option>

                <option value="EDUCATIONAL_CERTIFICATE">
                  Educational certificate
                </option>

                <option value="EXPERIENCE_CERTIFICATE">
                  Experience certificate
                </option>

                <option value="OFFER_DOCUMENTATION">
                  Offer documentation
                </option>
              </select>

              <button
                type="submit"
                disabled={
                  actionLoading ===
                  "document"
                }
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus size={15} />
                Add
              </button>

            </form>

            {/* DOCUMENT LIST */}

            <div className="mt-5 divide-y divide-slate-100">

              {record.documents.length ===
              0 ? (
                <p className="py-4 text-sm text-slate-500">
                  No documents added.
                </p>
              ) : (
                record.documents.map(
                  (document) => {

                    const deleting =
                      actionLoading ===
                      `document-${document.id}-delete`;

                    const updating =
                      actionLoading ===
                      `document-${document.id}`;

                    return (
                      <div
                        key={document.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >

                        <div className="flex min-w-0 items-center gap-2">

                          <FileText
                            size={17}
                            className="shrink-0 text-slate-400"
                          />

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium text-slate-800">
                              {
                                document.documentName
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {label(
                                document.documentType,
                              )}
                            </p>

                          </div>

                        </div>

                        <div className="flex shrink-0 items-center gap-2">

                          <select
                            value={
                              document.status
                            }
                            disabled={
                              deleting ||
                              updating
                            }
                            onChange={(
                              event,
                            ) =>
                              void updateDocument(
                                document,
                                event.target
                                  .value as DocumentStatus,
                              )
                            }
                            className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${statusClass(
                              document.status,
                            )}`}
                          >

                            <option value="PENDING">
                              Pending
                            </option>

                            <option value="SUBMITTED">
                              Submitted
                            </option>

                            <option value="VERIFIED">
                              Verified
                            </option>

                            <option value="REJECTED">
                              Rejected
                            </option>

                          </select>

                          <button
                            type="button"
                            disabled={
                              !!actionLoading
                            }
                            onClick={() =>
                              setDeleteTarget({
                                type: "document",
                                id: document.id,
                                name: document.documentName,
                              })
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={`Delete ${document.documentName}`}
                            title="Delete document"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </div>
                    );
                  },
                )
              )}

            </div>

          </section>

        </div>

        {/* =================================================
            CHECKLIST / TASKS
        ================================================= */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">

          <div className="flex items-center gap-2">

            <ClipboardCheck
              size={19}
              className="text-blue-600"
            />

            <h2 className="font-semibold text-slate-900">
              Checklist / tasks
            </h2>

          </div>

          {/* ADD TASK */}

          <form
            onSubmit={addTask}
            className="mt-4 grid gap-2 md:grid-cols-[1fr_180px_160px_auto]"
          >

            <input
              value={taskName}
              onChange={(event) =>
                setTaskName(
                  event.target.value,
                )
              }
              placeholder="Task name"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            />

            <input
              value={taskOwner}
              onChange={(event) =>
                setTaskOwner(
                  event.target.value,
                )
              }
              placeholder="Owner"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            />

            <div
              className="cursor-pointer"
              onClick={() =>
                openDatePicker(
                  taskDueDateInputRef,
                )
              }
            >
              <input
                ref={taskDueDateInputRef}
                type="date"
                value={taskDueDate}
                onChange={(event) =>
                  setTaskDueDate(
                    event.target.value,
                  )
                }
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />
            </div>

            <button
              type="submit"
              disabled={
                actionLoading === "task"
              }
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={15} />
              Add task
            </button>

          </form>

          {/* TASK LIST */}

          <div className="mt-5 divide-y divide-slate-100">

            {record.tasks.length ===
            0 ? (
              <p className="py-4 text-sm text-slate-500">
                No checklist tasks added.
              </p>
            ) : (
              record.tasks.map(
                (task) => {

                  const deleting =
                    actionLoading ===
                    `task-${task.id}-delete`;

                  const updating =
                    actionLoading ===
                    `task-${task.id}`;

                  return (
                    <div
                      key={task.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >

                      <div className="min-w-0">

                        <p className="text-sm font-medium text-slate-800">
                          {task.taskName}
                        </p>

                        <p className="text-xs text-slate-500">
                          {task.owner ??
                            "Unassigned"}{" "}
                          · Due{" "}
                          {date(task.dueDate)}
                        </p>

                      </div>

                      <div className="flex shrink-0 items-center gap-2">

                        <select
                          value={
                            task.status
                          }
                          disabled={
                            deleting ||
                            updating
                          }
                          onChange={(
                            event,
                          ) =>
                            void updateTask(
                              task,
                              event.target
                                .value as TaskStatus,
                            )
                          }
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold outline-none ${statusClass(
                            task.status,
                          )}`}
                        >

                          <option value="PENDING">
                            Pending
                          </option>

                          <option value="IN_PROGRESS">
                            In progress
                          </option>

                          <option value="COMPLETED">
                            Completed
                          </option>

                        </select>

                        <button
                          type="button"
                          disabled={
                            !!actionLoading
                          }
                          onClick={() =>
                            setDeleteTarget({
                              type: "task",
                              id: task.id,
                              name: task.taskName,
                            })
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${task.taskName}`}
                          title="Delete task"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </div>
                  );
                },
              )
            )}

          </div>

        </section>

        {/* =================================================
            STATUS CARDS
        ================================================= */}

        <section className="grid gap-6 md:grid-cols-3">

          {/* ASSET ALLOCATION */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Asset allocation
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Track employee asset allocation.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ClipboardCheck size={18} />
              </div>

            </div>

            <div className="mt-4">

              <select
                value={
                  (record.assetAllocationStatus ||
                    "PENDING") as WorkflowStatus
                }
                disabled={
                  actionLoading ===
                  "assetAllocationStatus"
                }
                onChange={(event) =>
                  void updateWorkflowStatus(
                    "assetAllocationStatus",
                    event.target
                      .value as WorkflowStatus,
                  )
                }
                className={`w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${workflowStatusClass(
                  (record.assetAllocationStatus ||
                    "PENDING") as WorkflowStatus,
                )}`}
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>

            </div>

          </div>

          {/* SYSTEM ACCESS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  System access
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Track account and system access.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <UserRound size={18} />
              </div>

            </div>

            <div className="mt-4">

              <select
                value={
                  (record.systemAccessStatus ||
                    "PENDING") as WorkflowStatus
                }
                disabled={
                  actionLoading ===
                  "systemAccessStatus"
                }
                onChange={(event) =>
                  void updateWorkflowStatus(
                    "systemAccessStatus",
                    event.target
                      .value as WorkflowStatus,
                  )
                }
                className={`w-full cursor-pointer rounded-lg border px-3 py-2.5 text-sm font-semibold outline-none transition-colors ${workflowStatusClass(
                  (record.systemAccessStatus ||
                    "PENDING") as WorkflowStatus,
                )}`}
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>

            </div>

          </div>

          {/* DOCUMENT VERIFICATION */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">

            <div className="flex items-start justify-between gap-3">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Document verification
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Automatically calculated from documents.
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <FileText size={18} />
              </div>

            </div>

            <div className="mt-4">

              <div
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${workflowStatusClass(
                  documentVerificationStatus,
                )}`}
              >

                <span className="text-sm font-semibold">
                  {label(
                    documentVerificationStatus,
                  )}
                </span>

                <span className="text-xs font-medium opacity-80">
                  {
                    record.documents.filter(
                      (document) =>
                        document.status ===
                        "VERIFIED",
                    ).length
                  }
                  /
                  {record.documents.length}{" "}
                  verified
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            WORKFLOW ACTIONS
        ================================================= */}

        <section className="rounded-xl border border-slate-200 bg-white p-6">

          <h2 className="font-semibold text-slate-900">
            Workflow actions
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">

            {!record.actualJoiningDate && (
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={() =>
                  void run(
                    "join",
                    async () => {
                      await joinOnboarding(
                        id,
                        joinDate ||
                          undefined,
                      );
                    },
                  )
                }
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading === "join"
                  ? "Joining..."
                  : "Mark as joined"}
              </button>
            )}

            {!record.employeeId && (
              <button
                type="button"
                disabled={!!actionLoading}
                onClick={() =>
                  setShowEmployeeForm(
                    (current) => !current,
                  )
                }
                className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-800 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create employee
              </button>
            )}

            <button
              type="button"
              disabled={
                !!actionLoading ||
                !record.employeeId
              }
              onClick={() =>
                setShowCompleteModal(true)
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Complete onboarding
            </button>

          </div>

          {/* JOIN DATE */}

          {!record.actualJoiningDate && (
            <div
              className="relative mt-4 cursor-pointer"
              onClick={() =>
                openDatePicker(
                  joinDateInputRef,
                )
              }
            >

              <input
                ref={joinDateInputRef}
                type="date"
                value={joinDate}
                onChange={(event) =>
                  setJoinDate(
                    event.target.value,
                  )
                }
                className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              />

            </div>
          )}

          {/* EMPLOYEE FORM */}

          {showEmployeeForm && (
            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (!employeeCode.trim()) {
                  setError(
                    "Employee code is required.",
                  );
                  return;
                }

                void run(
                  "employee",
                  async () => {
                    await createOnboardingEmployee(
                      id,
                      {
                        employeeCode:
                          employeeCode.trim(),
                        joiningDate:
                          joinDate ||
                          undefined,
                      },
                    );

                    setShowEmployeeForm(
                      false,
                    );
                  },
                );
              }}
              className="mt-5 flex flex-wrap gap-2"
            >

              <input
                required
                value={employeeCode}
                onChange={(event) =>
                  setEmployeeCode(
                    event.target.value,
                  )
                }
                placeholder="Employee code"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600"
              />

              <button
                type="submit"
                disabled={
                  actionLoading ===
                  "employee"
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading ===
                "employee"
                  ? "Creating..."
                  : "Create and link employee"}
              </button>

            </form>
          )}

        </section>

        {/* =================================================
            DELETE CONFIRMATION MODAL
        ================================================= */}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            role="presentation"
          >

            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-modal-title"
            >

              <div className="flex items-start justify-between gap-4">

                <div>

                  <h2
                    id="delete-modal-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Delete{" "}
                    {deleteTarget.type ===
                    "document"
                      ? "Document"
                      : "Task"}
                    ?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Are you sure you want to
                    delete{" "}
                    <span className="font-semibold text-slate-900">
                      "{deleteTarget.name}"
                    </span>
                    ?
                    <br />
                    This action cannot be
                    undone.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  disabled={!!actionLoading}
                  aria-label="Close"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="mt-7 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  disabled={!!actionLoading}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void confirmDelete()
                  }
                  disabled={!!actionLoading}
                  className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading
                    ? "Deleting..."
                    : "Delete"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            COMPLETE ONBOARDING MODAL
        ================================================= */}

        {showCompleteModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            role="presentation"
          >

            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
              role="dialog"
              aria-modal="true"
            >

              <div className="flex justify-between">

                <h2 className="font-semibold text-slate-900">
                  Complete onboarding?
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowCompleteModal(
                      false,
                    )
                  }
                  aria-label="Close"
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>

              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The backend will verify that
                every document and task is
                complete.
              </p>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowCompleteModal(
                      false,
                    )
                  }
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(
                      false,
                    );

                    void run(
                      "complete",
                      async () => {
                        await completeOnboarding(
                          id,
                        );
                      },
                    );
                  }}
                  disabled={
                    !!actionLoading
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Complete
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default OnboardingProfile;