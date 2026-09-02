import {
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Play,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  approvePayroll,
  completePayroll,
  deletePayrollRun,
  getPayrollRuns,
  processPayroll,
  type PayrollRun,
  type PayrollStatus,
} from "../services/payrollService";

const statusLabel: Record<PayrollStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

const statusClass: Record<PayrollStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const formatMonth = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function Payroll() {
  const navigate = useNavigate();

  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PayrollRun | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRuns = async () => {
    try {
      setError("");
      setRuns(await getPayrollRuns());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load payroll runs.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRuns();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const runAction = async (
    run: PayrollRun,
    action: "process" | "approve" | "complete",
  ) => {
    setBusyId(run.id);
    setError("");
    setActionMessage("");

    try {
      const actionRequest =
        action === "process"
          ? processPayroll
          : action === "approve"
            ? approvePayroll
            : completePayroll;

      await actionRequest(run.id);

      setActionMessage(
        `Payroll for ${formatMonth(
          run.payrollMonth,
        )} updated successfully.`,
      );

      await loadRuns();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payroll run.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setError("");
    setActionMessage("");

    try {
      await deletePayrollRun(deleteTarget.id);

      setDeleteTarget(null);

      setActionMessage(
        `Payroll for ${formatMonth(
          deleteTarget.payrollMonth,
        )} was deleted successfully.`,
      );

      await loadRuns();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete payroll run.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const summary = [
    [
      "Total Payroll Runs",
      runs.length,
      CircleDollarSign,
      "text-teal-700",
      "bg-teal-50",
    ],
    [
      "Pending Payroll",
      runs.filter(
        (run) => run.status === "PENDING",
      ).length,
      ShieldCheck,
      "text-amber-700",
      "bg-amber-50",
    ],
    [
      "Processing",
      runs.filter(
        (run) => run.status === "PROCESSING",
      ).length,
      Play,
      "text-sky-700",
      "bg-sky-50",
    ],
    [
      "Completed",
      runs.filter(
        (run) => run.status === "COMPLETED",
      ).length,
      CheckCircle2,
      "text-emerald-700",
      "bg-emerald-50",
    ],
  ] as const;

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
              <CircleDollarSign
                size={22}
                className="text-teal-700"
              />
            </div>

            <div>
              <h1 className="text-[30px] font-semibold leading-9 tracking-tight text-slate-900">
                Payroll
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Manage payroll runs, approvals and payroll processing.
              </p>
            </div>
          </div>

          <Link
            to="/payroll/new"
            className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Create Payroll Run
          </Link>
        </section>

        {/* =====================================================
            SUMMARY CARDS
        ===================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(
            ([
              label,
              value,
              Icon,
              color,
              background,
            ]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {label}
                  </p>

                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${background}`}
                  >
                    <Icon
                      size={18}
                      className={color}
                    />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ),
          )}
        </section>

        {/* =====================================================
            SUCCESS MESSAGE
        ===================================================== */}

        {actionMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        )}

        {/* =====================================================
            ERROR MESSAGE
        ===================================================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading payroll runs...
          </section>
        ) : runs.length === 0 ? (
          /* ===================================================
             EMPTY STATE
          =================================================== */

          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center">
            <CircleDollarSign
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />

            <h2 className="text-base font-semibold text-slate-900">
              No payroll runs found.
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create a payroll run to begin processing.
            </p>
          </section>
        ) : (
          /* ===================================================
             PAYROLL TABLE
          =================================================== */

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Payroll Month
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3">
                      Pending Approvals
                    </th>

                    <th className="px-5 py-3">
                      Created Date
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      onClick={() =>
                        navigate(`/payroll/${run.id}`)
                      }
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      {/* Payroll Month */}

                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {formatMonth(run.payrollMonth)}
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[run.status]}`}
                        >
                          {statusLabel[run.status]}
                        </span>
                      </td>

                      {/* Pending Approvals */}

                      <td className="px-5 py-4 text-slate-600">
                        {run.pendingApprovals}
                      </td>

                      {/* Created Date */}

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(run.createdAt)}
                      </td>

                      {/* Actions */}

                      <td
                        className="px-5 py-4"
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      >
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit */}

                          {run.status !== "COMPLETED" && (
                            <Link
                              to={`/payroll/edit/${run.id}`}
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-teal-700"
                            >
                              <Edit size={14} />
                              Edit
                            </Link>
                          )}

                          {/* Delete */}

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget(run)
                            }
                            disabled={
                              deleting ||
                              busyId === run.id
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>

                          {/* Process */}

                          {run.status === "PENDING" && (
                            <button
                              type="button"
                              disabled={busyId === run.id}
                              onClick={() =>
                                void runAction(
                                  run,
                                  "process",
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Play size={14} />
                              Process
                            </button>
                          )}

                          {/* Approve */}

                          {run.status === "PROCESSING" &&
                            run.pendingApprovals > 0 && (
                              <button
                                type="button"
                                disabled={
                                  busyId === run.id
                                }
                                onClick={() =>
                                  void runAction(
                                    run,
                                    "approve",
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <ShieldCheck
                                  size={14}
                                />
                                Approve
                              </button>
                            )}

                          {/* Complete */}

                          {run.status === "PROCESSING" &&
                            run.pendingApprovals === 0 && (
                              <button
                                type="button"
                                disabled={
                                  busyId === run.id
                                }
                                onClick={() =>
                                  void runAction(
                                    run,
                                    "complete",
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircle2
                                  size={14}
                                />
                                Complete
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================
            DELETE CONFIRMATION MODAL
        ===================================================== */}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                if (!deleting) {
                  setDeleteTarget(null);
                }
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-payroll-title"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Trash2
                      size={20}
                      className="text-red-600"
                    />
                  </div>

                  <div>
                    <h2
                      id="delete-payroll-title"
                      className="text-lg font-semibold text-slate-900"
                    >
                      Delete Payroll Run
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!deleting) {
                      setDeleteTarget(null);
                    }
                  }}
                  disabled={deleting}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close delete dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  {formatMonth(
                    deleteTarget.payrollMonth,
                  )}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Payroll Run #{deleteTarget.id}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Are you sure you want to delete this payroll
                run? All information associated with this run
                will be removed.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />

                  {deleting
                    ? "Deleting..."
                    : "Delete Payroll Run"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Payroll;