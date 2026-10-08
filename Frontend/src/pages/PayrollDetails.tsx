import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Play,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import {
  approveEmployeePayrollPayment,
  approvePayroll,
  completeEmployeePayrollPayment,
  completePayroll,
  deleteEmployeePayrollPayment,
  getEmployeePayrollPayments,
  getPayrollRun,
  processPayroll,
  type EmployeePayrollPayment,
  type PayrollRun,
  type PayrollStatus,
} from "../services/payrollService";

const labels: Record<PayrollStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

const badgeClasses: Record<PayrollStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const paymentLabels: Record<
  EmployeePayrollPayment["status"],
  string
> = {
  READY_TO_PAY: "Ready to Pay",
  APPROVED: "Approved",
  COMPLETED: "Completed",
};

const paymentBadgeClasses: Record<
  EmployeePayrollPayment["status"],
  string
> = {
  READY_TO_PAY: "bg-amber-100 text-amber-700",
  APPROVED: "bg-sky-100 text-sky-700",
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

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

function PayrollDetails() {
  const { id } = useParams();
  const { hasPermission } = useAuth();

  const canViewPayroll =
    hasPermission("payroll.view") ||
    hasPermission("payroll.view.own");

  const canUpdatePayroll = hasPermission("payroll.update");
  const canApprovePayroll = hasPermission("payroll.approve");
  const canDeletePayroll = hasPermission("payroll.delete");

  const [run, setRun] = useState<PayrollRun | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [confirmComplete, setConfirmComplete] = useState(false);

  const [payments, setPayments] = useState<EmployeePayrollPayment[]>(
    [],
  );
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentBusyId, setPaymentBusyId] = useState<number | null>(
    null,
  );

  const [confirmPaymentComplete, setConfirmPaymentComplete] =
    useState<EmployeePayrollPayment | null>(null);

  const [paymentDeleteTarget, setPaymentDeleteTarget] =
    useState<EmployeePayrollPayment | null>(null);

  const [paymentDeleting, setPaymentDeleting] = useState(false);

  const loadPayments = useCallback(async () => {
    if (!id || !canViewPayroll) return;

    setPaymentsLoading(true);
    setPaymentError("");

    try {
      const data = await getEmployeePayrollPayments(id);
      setPayments(data);
    } catch (requestError) {
      setPaymentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employee payment records.",
      );
    } finally {
      setPaymentsLoading(false);
    }
  }, [id, canViewPayroll]);

  const load = useCallback(async () => {
    if (!id) {
      setError("Invalid payroll run ID.");
      setLoading(false);
      return;
    }

    if (!canViewPayroll) {
      setLoading(false);
      return;
    }

    try {
      const payrollRun = await getPayrollRun(id);

      setRun(payrollRun);
      setError("");

      if (payrollRun.status === "COMPLETED") {
        await loadPayments();
      } else {
        setPayments([]);
        setPaymentError("");
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load payroll run.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, canViewPayroll, loadPayments]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const action = async (
    kind: "process" | "approve" | "complete",
  ) => {
    if (!id) return;

    if (
      kind === "process" &&
      !canUpdatePayroll
    ) {
      setError("You do not have permission to process payroll.");
      return;
    }

    if (
      kind === "approve" &&
      !canApprovePayroll
    ) {
      setError("You do not have permission to approve payroll.");
      return;
    }

    if (
      kind === "complete" &&
      !canUpdatePayroll
    ) {
      setError("You do not have permission to complete payroll.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const request =
        kind === "process"
          ? processPayroll
          : kind === "approve"
            ? approvePayroll
            : completePayroll;

      await request(id);

      setMessage("Payroll run updated successfully.");
      setConfirmComplete(false);

      await load();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update payroll run.",
      );
    } finally {
      setBusy(false);
    }
  };

  const approvePayment = async (
    payment: EmployeePayrollPayment,
  ) => {
    if (!canApprovePayroll) {
      setPaymentError(
        "You do not have permission to approve employee payments.",
      );
      return;
    }

    setPaymentBusyId(payment.id);
    setPaymentError("");
    setMessage("");

    try {
      await approveEmployeePayrollPayment(payment.id);

      setMessage(
        `${payment.employeeName}'s payment was approved successfully.`,
      );

      await loadPayments();
    } catch (requestError) {
      setPaymentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to approve employee payment.",
      );
    } finally {
      setPaymentBusyId(null);
    }
  };

  const completePayment = async (
    payment: EmployeePayrollPayment,
  ) => {
    if (!canUpdatePayroll) {
      setPaymentError(
        "You do not have permission to complete employee payments.",
      );
      return;
    }

    setPaymentBusyId(payment.id);
    setPaymentError("");
    setMessage("");

    try {
      await completeEmployeePayrollPayment(payment.id);

      setMessage(
        `${payment.employeeName}'s payment was completed successfully.`,
      );

      setConfirmPaymentComplete(null);

      await loadPayments();
    } catch (requestError) {
      setPaymentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete employee payment.",
      );
    } finally {
      setPaymentBusyId(null);
    }
  };

  const deletePayment = async (
    payment: EmployeePayrollPayment,
  ) => {
    if (!canDeletePayroll) {
      setPaymentError(
        "You do not have permission to delete employee payments.",
      );
      return;
    }

    setPaymentDeleting(true);
    setPaymentError("");
    setMessage("");

    try {
      await deleteEmployeePayrollPayment(payment.id);

      setMessage(
        `${payment.employeeName}'s payment record was deleted successfully.`,
      );

      setPaymentDeleteTarget(null);

      await loadPayments();
    } catch (requestError) {
      setPaymentError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete employee payment.",
      );
    } finally {
      setPaymentDeleting(false);
    }
  };

  if (!canViewPayroll) {
    return (
      <DashboardLayout>
        <div className="flex min-w-0 flex-col gap-6">
          <Link
            to="/payroll"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={17} />
            Back to Payroll
          </Link>

          <section className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
            <ShieldCheck
              size={36}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-4 text-lg font-semibold text-red-800">
              Access Restricted
            </h1>

            <p className="mt-2 text-sm text-red-700">
              You do not have permission to view payroll details.
            </p>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <Link
          to="/payroll"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Payroll"
        >
          <ArrowLeft size={17} />
          Back to Payroll
        </Link>

        {loading ? (
          <section className="rounded-xl border border-slate-300 bg-white px-6 py-16 text-center text-sm text-slate-500">
            Loading payroll run...
          </section>
        ) : error && !run ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "Payroll run not found."}
          </div>
        ) : !run ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Payroll run not found.
          </div>
        ) : (
          <>
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
                    {formatMonth(run.payrollMonth)}
                  </h1>

                  <p className="mt-1 text-sm text-slate-600">
                    Payroll run #{run.id}
                    <span className="mx-1 text-slate-300">
                      •
                    </span>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[run.status]}`}
                    >
                      {labels[run.status]}
                    </span>
                  </p>
                </div>
              </div>

              {run.status !== "COMPLETED" &&
                canUpdatePayroll && (
                  <Link
                    to={`/payroll/edit/${run.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                  >
                    <Edit size={16} />
                    Edit Payroll
                  </Link>
                )}
            </section>

            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Payroll information
                </h2>

                <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate-500">
                      Payroll Month
                    </dt>

                    <dd className="mt-1 font-medium text-slate-800">
                      {formatMonth(run.payrollMonth)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">
                      Status
                    </dt>

                    <dd className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[run.status]}`}
                      >
                        {labels[run.status]}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">
                      Pending Approvals
                    </dt>

                    <dd className="mt-1 font-medium text-slate-800">
                      {run.pendingApprovals}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-slate-500">
                      Created Date
                    </dt>

                    <dd className="mt-1 font-medium text-slate-800">
                      {formatDate(run.createdAt)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Workflow status
                </h2>

                <div className="mt-6 flex items-center justify-between gap-2">
                  {(
                    [
                      "PENDING",
                      "PROCESSING",
                      "COMPLETED",
                    ] as PayrollStatus[]
                  ).map((stage, index) => (
                    <div
                      key={stage}
                      className="flex min-w-0 flex-1 items-center gap-2"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          run.status === stage
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <span
                        className={`text-xs font-semibold ${
                          run.status === stage
                            ? "text-teal-700"
                            : "text-slate-500"
                        }`}
                      >
                        {labels[stage]}
                      </span>

                      {index < 2 && (
                        <div
                          className={`h-px min-w-3 flex-1 ${
                            run.status === "COMPLETED" ||
                            (run.status === "PROCESSING" &&
                              index === 0)
                              ? "bg-teal-500"
                              : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {run.status === "PENDING" &&
                    canUpdatePayroll && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void action("process")}
                        className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                      >
                        <Play size={16} />

                        {busy
                          ? "Processing..."
                          : "Process Payroll"}
                      </button>
                    )}

                  {run.status === "PROCESSING" &&
                    run.pendingApprovals > 0 &&
                    canApprovePayroll && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void action("approve")}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                      >
                        <ShieldCheck size={16} />

                        {busy
                          ? "Approving..."
                          : "Approve One"}
                      </button>
                    )}

                  {run.status === "PROCESSING" &&
                    run.pendingApprovals === 0 &&
                    canUpdatePayroll && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          setConfirmComplete(true)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <CheckCircle2 size={16} />
                        Complete Payroll
                      </button>
                    )}

                  {run.status === "COMPLETED" && (
                    <span className="text-sm text-emerald-700">
                      This payroll run is complete.
                    </span>
                  )}
                </div>
              </section>
            </div>

            {/* EMPLOYEE PAYMENTS */}
            {run.status === "COMPLETED" && (
              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Employee Payments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Payment records generated from this completed
                      payroll run.
                    </p>
                  </div>

                  <div className="rounded-lg bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700">
                    {payments.length}{" "}
                    {payments.length === 1
                      ? "Employee"
                      : "Employees"}
                  </div>
                </div>

                {paymentsLoading ? (
                  <div className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading employee payments...
                  </div>
                ) : paymentError ? (
                  <div className="m-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {paymentError}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <CircleDollarSign
                      size={36}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No employee payment records
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      No active employee salaries were available when
                      this payroll run was completed.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Employee
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Code
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Net Salary
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Created
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {payments.map((payment) => {
                          const isBusy =
                            paymentBusyId === payment.id;

                          return (
                            <tr
                              key={payment.id}
                              className="transition-colors hover:bg-slate-50"
                            >
                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="font-medium text-slate-900">
                                  {payment.employeeName}
                                </div>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                {payment.employeeCode}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-slate-900">
                                {formatMoney(payment.netSalary)}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentBadgeClasses[payment.status]}`}
                                >
                                  {paymentLabels[payment.status]}
                                </span>
                              </td>

                              <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                                {formatDateTime(
                                  payment.createdAt,
                                )}
                              </td>

                              <td className="whitespace-nowrap px-6 py-4">
                                <div className="flex justify-end gap-2">
                                  {payment.status ===
                                    "READY_TO_PAY" &&
                                    canApprovePayroll && (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() =>
                                          void approvePayment(
                                            payment,
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                                      >
                                        <ShieldCheck
                                          size={14}
                                        />

                                        {isBusy
                                          ? "Approving..."
                                          : "Approve"}
                                      </button>
                                    )}

                                  {payment.status ===
                                    "APPROVED" &&
                                    canUpdatePayroll && (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() =>
                                          setConfirmPaymentComplete(
                                            payment,
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                      >
                                        <CheckCircle2
                                          size={14}
                                        />

                                        Complete
                                      </button>
                                    )}

                                  {payment.status ===
                                    "COMPLETED" &&
                                    canDeletePayroll && (
                                      <button
                                        type="button"
                                        disabled={paymentDeleting}
                                        onClick={() =>
                                          setPaymentDeleteTarget(
                                            payment,
                                          )
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    )}

                                  {payment.status ===
                                    "COMPLETED" &&
                                    !canDeletePayroll && (
                                      <span className="text-xs font-medium text-emerald-600">
                                        Completed
                                      </span>
                                    )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      {/* COMPLETE PAYROLL MODAL */}
      {confirmComplete && run && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !busy
            ) {
              setConfirmComplete(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-payroll-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <h2
              id="complete-payroll-title"
              className="text-lg font-semibold text-slate-900"
            >
              Complete payroll run?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will mark the{" "}
              <span className="font-semibold">
                {formatMonth(run.payrollMonth)}
              </span>{" "}
              payroll run as completed and create employee payment
              records from active salaries.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmComplete(false)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => void action("complete")}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy
                  ? "Completing..."
                  : "Complete Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE EMPLOYEE PAYMENT MODAL */}
      {confirmPaymentComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              paymentBusyId === null
            ) {
              setConfirmPaymentComplete(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-payment-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2
                size={22}
                className="text-emerald-600"
              />
            </div>

            <h2
              id="complete-payment-title"
              className="mt-4 text-lg font-semibold text-slate-900"
            >
              Complete employee payment?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              You are about to complete the payment for{" "}
              <span className="font-semibold text-slate-900">
                {confirmPaymentComplete.employeeName}
              </span>
              .
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Net Salary
                </span>

                <span className="font-semibold text-slate-900">
                  {formatMoney(
                    confirmPaymentComplete.netSalary,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={paymentBusyId !== null}
                onClick={() =>
                  setConfirmPaymentComplete(null)
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={paymentBusyId !== null}
                onClick={() =>
                  void completePayment(
                    confirmPaymentComplete,
                  )
                }
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {paymentBusyId !== null
                  ? "Completing..."
                  : "Complete Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PAYMENT MODAL */}
      {paymentDeleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !paymentDeleting
            ) {
              setPaymentDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-payment-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
              <Trash2
                size={22}
                className="text-red-600"
              />
            </div>

            <h2
              id="delete-payment-title"
              className="mt-4 text-lg font-semibold text-slate-900"
            >
              Delete payment record?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              This will permanently delete the completed payment
              record for{" "}
              <span className="font-semibold text-slate-900">
                {paymentDeleteTarget.employeeName}
              </span>
              .
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">
                  Net Salary
                </span>

                <span className="font-semibold text-slate-900">
                  {formatMoney(
                    paymentDeleteTarget.netSalary,
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={paymentDeleting}
                onClick={() =>
                  setPaymentDeleteTarget(null)
                }
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={paymentDeleting}
                onClick={() =>
                  void deletePayment(paymentDeleteTarget)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <Trash2 size={15} />

                {paymentDeleting
                  ? "Deleting..."
                  : "Delete Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default PayrollDetails;