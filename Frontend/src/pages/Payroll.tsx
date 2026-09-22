import {
  CheckCircle2,
  CircleDollarSign,
  Edit,
  Play,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import { useAuth } from "../context/AuthContext";

import {
  getEmployees,
  type Employee,
} from "../services/workforceService";

import {
  approvePayroll,
  completePayroll,
  createEmployeeSalary,
  deleteEmployeeSalary,
  deletePayrollRun,
  getEmployeeSalaries,
  getPayrollRuns,
  processPayroll,
  updateEmployeeSalary,
  type CreateSalaryPayload,
  type EmployeeSalary,
  type PayrollRun,
  type PayrollStatus,
} from "../services/payrollService";


/* ============================================================
   PAYROLL RUN HELPERS
============================================================ */

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

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));


/* ============================================================
   SALARY FORM
============================================================ */

interface SalaryFormState {
  employeeId: string;
  annualCtc: string;
  monthlyGross: string;
  basicSalary: string;
  hra: string;
  otherAllowances: string;
  totalDeductions: string;
  effectiveFrom: string;
  effectiveTo: string;
  status: "ACTIVE" | "INACTIVE";
  revisionReason: string;
  remarks: string;
}

const emptySalaryForm: SalaryFormState = {
  employeeId: "",
  annualCtc: "",
  monthlyGross: "",
  basicSalary: "",
  hra: "",
  otherAllowances: "",
  totalDeductions: "",
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
  status: "ACTIVE",
  revisionReason: "",
  remarks: "",
};


/* ============================================================
   COMPONENT
============================================================ */

function Payroll() {
  const navigate = useNavigate();

  const {
    hasPermission,
  } = useAuth();


  /* ==========================================================
     PAYROLL PERMISSIONS
  ========================================================== */

  const canViewPayroll =
    hasPermission("payroll.view") ||
    hasPermission("payroll.view.own");

  const canCreatePayroll =
    hasPermission("payroll.create");

  const canUpdatePayroll =
    hasPermission("payroll.update");

  const canDeletePayroll =
    hasPermission("payroll.delete");

  const canApprovePayroll =
    hasPermission("payroll.approve");




  /* ==========================================================
     PAYROLL RUN STATE
  ========================================================== */

  const [runs, setRuns] = useState<PayrollRun[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [busyId, setBusyId] =
    useState<number | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<PayrollRun | null>(null);

  const [deleting, setDeleting] =
    useState(false);


  /* ==========================================================
     SALARY STATE
  ========================================================== */

  const [salaries, setSalaries] =
    useState<EmployeeSalary[]>([]);

  const [salaryLoading, setSalaryLoading] =
    useState(true);

  const [salaryError, setSalaryError] =
    useState("");

  const [salaryEmployees, setSalaryEmployees] =
    useState<Employee[]>([]);

  const [employeesLoading, setEmployeesLoading] =
    useState(false);

  const [salaryModalOpen, setSalaryModalOpen] =
    useState(false);

  const [salaryDeleteTarget, setSalaryDeleteTarget] =
    useState<EmployeeSalary | null>(null);

  const [salaryDeleting, setSalaryDeleting] =
    useState(false);

  const [salarySaving, setSalarySaving] =
    useState(false);

  const [editingSalary, setEditingSalary] =
    useState<EmployeeSalary | null>(null);

  const [salaryForm, setSalaryForm] =
    useState<SalaryFormState>(emptySalaryForm);


  /* ==========================================================
     LOAD PAYROLL RUNS
  ========================================================== */

  const loadRuns = async () => {
    if (!canViewPayroll) {
      setRuns([]);
      setLoading(false);
      return;
    }

    try {
      setError("");

      setRuns(
        await getPayrollRuns(),
      );
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


  /* ==========================================================
     LOAD SALARIES
  ========================================================== */

  const loadSalaries = async () => {
    if (!canViewPayroll) {
      setSalaries([]);
      setSalaryLoading(false);
      return;
    }

    try {
      setSalaryError("");

      setSalaries(
        await getEmployeeSalaries(),
      );
    } catch (requestError) {
      setSalaryError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employee salaries.",
      );
    } finally {
      setSalaryLoading(false);
    }
  };


  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRuns();
      void loadSalaries();
    }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [canViewPayroll]);


  /* ==========================================================
     EMPLOYEE LOOKUP
  ========================================================== */

  const employeeMap = useMemo(
    () =>
      new Map(
        salaryEmployees.map(
          (employee) => [
            employee.id,
            employee,
          ],
        ),
      ),
    [salaryEmployees],
  );

  const loadEmployeesForSalary = async () => {
    if (salaryEmployees.length > 0) {
      return;
    }

    setEmployeesLoading(true);

    try {
      const response =
        await getEmployees();

      setSalaryEmployees(
        response.employees,
      );
    } catch (requestError) {
      setSalaryError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load employees.",
      );
    } finally {
      setEmployeesLoading(false);
    }
  };


  /* ==========================================================
     SALARY MODAL
  ========================================================== */

  const openCreateSalary = async () => {
    if (!canCreatePayroll) {
      return;
    }

    setError("");
    setSalaryError("");
    setActionMessage("");

    setEditingSalary(null);

    setSalaryForm({
      ...emptySalaryForm,
      effectiveFrom:
        new Date()
          .toISOString()
          .slice(0, 10),
    });

    setSalaryModalOpen(true);

    await loadEmployeesForSalary();
  };


  const openEditSalary = async (
    salary: EmployeeSalary,
  ) => {
    if (!canUpdatePayroll) {
      return;
    }

    setError("");
    setSalaryError("");
    setActionMessage("");

    setEditingSalary(salary);

    setSalaryForm({
      employeeId:
        String(salary.employeeId),

      annualCtc:
        String(salary.annualCtc),

      monthlyGross:
        String(salary.monthlyGross),

      basicSalary:
        String(salary.basicSalary),

      hra:
        String(salary.hra),

      otherAllowances:
        String(salary.otherAllowances),

      totalDeductions:
        String(salary.totalDeductions),

      effectiveFrom:
        salary.effectiveFrom || "",

      effectiveTo:
        salary.effectiveTo || "",

      status:
        salary.status,

      revisionReason:
        salary.revisionReason || "",

      remarks:
        salary.remarks || "",
    });

    setSalaryModalOpen(true);
  };


  const closeSalaryModal = () => {
    if (salarySaving) {
      return;
    }

    setSalaryModalOpen(false);
    setEditingSalary(null);
    setSalaryForm(emptySalaryForm);
    setSalaryError("");
  };


  /* ==========================================================
     SALARY FORM HANDLERS
  ========================================================== */

  const updateSalaryField = (
    field: keyof SalaryFormState,
    value: string,
  ) => {
    setSalaryForm(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  };


  const calculatedNetSalary = useMemo(() => {
    const monthlyGross =
      Number(
        salaryForm.monthlyGross,
      ) || 0;

    const totalDeductions =
      Number(
        salaryForm.totalDeductions,
      ) || 0;

    return Math.max(
      0,
      monthlyGross -
        totalDeductions,
    );
  }, [
    salaryForm.monthlyGross,
    salaryForm.totalDeductions,
  ]);


  const submitSalary = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setSalaryError("");
    setError("");
    setActionMessage("");

    const employeeId =
      Number(
        salaryForm.employeeId,
      );

    const annualCtc =
      Number(
        salaryForm.annualCtc,
      );

    const monthlyGross =
      Number(
        salaryForm.monthlyGross,
      );

    const basicSalary =
      Number(
        salaryForm.basicSalary,
      );

    const hra =
      Number(
        salaryForm.hra,
      );

    const otherAllowances =
      Number(
        salaryForm.otherAllowances,
      );

    const totalDeductions =
      Number(
        salaryForm.totalDeductions,
      );

    const netSalary =
      calculatedNetSalary;


    if (
      !Number.isInteger(employeeId) ||
      employeeId <= 0
    ) {
      setSalaryError(
        "Please select an employee.",
      );
      return;
    }

    if (
      !salaryForm.effectiveFrom
    ) {
      setSalaryError(
        "Effective from date is required.",
      );
      return;
    }

    const numericValues = [
      annualCtc,
      monthlyGross,
      basicSalary,
      hra,
      otherAllowances,
      totalDeductions,
    ];

    if (
      numericValues.some(
        (value) =>
          !Number.isFinite(value) ||
          value < 0,
      )
    ) {
      setSalaryError(
        "Salary amounts must be valid non-negative numbers.",
      );
      return;
    }

    if (
      netSalary >
      monthlyGross
    ) {
      setSalaryError(
        "Net salary cannot exceed monthly gross.",
      );
      return;
    }

    if (
      salaryForm.effectiveTo &&
      salaryForm.effectiveTo <
        salaryForm.effectiveFrom
    ) {
      setSalaryError(
        "Effective to date cannot be before effective from date.",
      );
      return;
    }


    const payload: CreateSalaryPayload =
      {
        employeeId,

        annualCtc,

        monthlyGross,

        basicSalary,

        hra,

        otherAllowances,

        totalDeductions,

        netSalary,

        effectiveFrom:
          salaryForm.effectiveFrom,

        effectiveTo:
          salaryForm.effectiveTo ||
          null,

        status:
          salaryForm.status,

        revisionReason:
          salaryForm.revisionReason.trim() ||
          undefined,

        remarks:
          salaryForm.remarks.trim() ||
          undefined,
      };


    setSalarySaving(true);

    try {
      if (editingSalary) {
        await updateEmployeeSalary(
          editingSalary.id,
          payload,
        );

        setActionMessage(
          "Employee salary updated successfully.",
        );
      } else {
        await createEmployeeSalary(
          payload,
        );

        setActionMessage(
          "Employee salary created successfully.",
        );
      }

      closeSalaryModal();

      await loadSalaries();
    } catch (requestError) {
      setSalaryError(
        requestError instanceof Error
          ? requestError.message
          : editingSalary
            ? "Unable to update employee salary."
            : "Unable to create employee salary.",
      );
    } finally {
      setSalarySaving(false);
    }
  };


  /* ==========================================================
     DELETE SALARY
  ========================================================== */

  const handleDeleteSalary = async () => {
    if (
      !salaryDeleteTarget ||
      !canDeletePayroll
    ) {
      return;
    }

    setSalaryDeleting(true);
    setSalaryError("");
    setError("");
    setActionMessage("");

    try {
      await deleteEmployeeSalary(
        salaryDeleteTarget.id,
      );

      setActionMessage(
        "Employee salary deleted successfully.",
      );

      setSalaryDeleteTarget(null);

      await loadSalaries();
    } catch (requestError) {
      setSalaryError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete employee salary.",
      );
    } finally {
      setSalaryDeleting(false);
    }
  };


  /* ==========================================================
     PAYROLL RUN ACTIONS
  ========================================================== */

  const runAction = async (
    run: PayrollRun,
    action:
      | "process"
      | "approve"
      | "complete",
  ) => {
    if (
      action === "approve" &&
      !canApprovePayroll
    ) {
      return;
    }

    if (
      action !== "approve" &&
      !canUpdatePayroll
    ) {
      return;
    }

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


  /* ==========================================================
     DELETE PAYROLL RUN
  ========================================================== */

  const handleDelete = async () => {
    if (
      !deleteTarget ||
      !canDeletePayroll
    ) {
      return;
    }

    setDeleting(true);
    setError("");
    setActionMessage("");

    try {
      await deletePayrollRun(
        deleteTarget.id,
      );

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


  /* ==========================================================
     SUMMARY
  ========================================================== */

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
        (run) =>
          run.status === "PENDING",
      ).length,
      ShieldCheck,
      "text-amber-700",
      "bg-amber-50",
    ],
    [
      "Processing",
      runs.filter(
        (run) =>
          run.status ===
          "PROCESSING",
      ).length,
      Play,
      "text-sky-700",
      "bg-sky-50",
    ],
    [
      "Completed",
      runs.filter(
        (run) =>
          run.status === "COMPLETED",
      ).length,
      CheckCircle2,
      "text-emerald-700",
      "bg-emerald-50",
    ],
  ] as const;


  /* ==========================================================
     ACCESS RESTRICTION
  ========================================================== */

  if (!canViewPayroll) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <ShieldCheck
                size={24}
                className="text-red-600"
              />
            </div>

            <h1 className="mt-4 text-xl font-semibold text-slate-900">
              Payroll access restricted
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              You do not have permission to view payroll information.
            </p>
          </section>
        </div>
      </DashboardLayout>
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* ======================================================
            HEADER
        ====================================================== */}

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
                Manage payroll runs, employee salaries, approvals and payroll processing.
              </p>
            </div>
          </div>

          {canCreatePayroll && (
            <Link
              to="/payroll/new"
              className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Create Payroll Run
            </Link>
          )}
        </section>


        {/* ======================================================
            SUMMARY CARDS
        ====================================================== */}

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


        {/* ======================================================
            SUCCESS MESSAGE
        ====================================================== */}

        {actionMessage && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {actionMessage}
          </div>
        )}


        {/* ======================================================
            PAYROLL ERROR
        ====================================================== */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}


        {/* ======================================================
            PAYROLL RUNS
        ====================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Payroll Runs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage monthly payroll processing and approvals.
              </p>
            </div>

            {canCreatePayroll && (
              <Link
                to="/payroll/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
              >
                <Plus size={15} />
                New Payroll Run
              </Link>
            )}
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading payroll runs...
            </div>
          ) : runs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CircleDollarSign
                size={32}
                className="mx-auto mb-3 text-slate-400"
              />

              <h3 className="text-base font-semibold text-slate-900">
                No payroll runs found.
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Create a payroll run to begin processing.
              </p>
            </div>
          ) : (
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
                  {runs.map(
                    (run) => (
                      <tr
                        key={run.id}
                        onClick={() =>
                          navigate(
                            `/payroll/${run.id}`,
                          )
                        }
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                      >
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {formatMonth(
                            run.payrollMonth,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[run.status]}`}
                          >
                            {statusLabel[
                              run.status
                            ]}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {run.pendingApprovals}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(
                            run.createdAt,
                          )}
                        </td>

                        <td
                          className="px-5 py-4"
                          onClick={(event) =>
                            event.stopPropagation()
                          }
                        >
                          <div className="flex items-center justify-end gap-2">

                            {canUpdatePayroll &&
                              run.status !==
                                "COMPLETED" && (
                                <Link
                                  to={`/payroll/edit/${run.id}`}
                                  onClick={(
                                    event,
                                  ) =>
                                    event.stopPropagation()
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-teal-700"
                                >
                                  <Edit
                                    size={14}
                                  />
                                  Edit
                                </Link>
                              )}

                            {canDeletePayroll && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget(
                                    run,
                                  )
                                }
                                disabled={
                                  deleting ||
                                  busyId ===
                                    run.id
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2
                                  size={14}
                                />
                                Delete
                              </button>
                            )}

                            {run.status ===
                              "PENDING" &&
                              canUpdatePayroll && (
                                <button
                                  type="button"
                                  disabled={
                                    busyId ===
                                    run.id
                                  }
                                  onClick={() =>
                                    void runAction(
                                      run,
                                      "process",
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Play
                                    size={14}
                                  />
                                  Process
                                </button>
                              )}

                            {run.status ===
                              "PROCESSING" &&
                              run.pendingApprovals >
                                0 &&
                              canApprovePayroll && (
                                <button
                                  type="button"
                                  disabled={
                                    busyId ===
                                    run.id
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

                            {run.status ===
                              "PROCESSING" &&
                              run.pendingApprovals ===
                                0 &&
                              canUpdatePayroll && (
                                <button
                                  type="button"
                                  disabled={
                                    busyId ===
                                    run.id
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
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>


        {/* ======================================================
            EMPLOYEE SALARY MANAGEMENT
        ====================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Employee Salaries
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage current compensation and salary revisions for employees.
              </p>
            </div>

            {canCreatePayroll && (
              <button
                type="button"
                onClick={() =>
                  void openCreateSalary()
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <Plus size={16} />
                Add Employee Salary
              </button>
            )}
          </div>


          {salaryError && (
            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {salaryError}
            </div>
          )}


          {salaryLoading ? (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading employee salaries...
            </div>
          ) : salaries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CircleDollarSign
                size={32}
                className="mx-auto mb-3 text-slate-400"
              />

              <h3 className="text-base font-semibold text-slate-900">
                No employee salaries found.
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add an employee salary to start maintaining compensation records.
              </p>

              {canCreatePayroll && (
                <button
                  type="button"
                  onClick={() =>
                    void openCreateSalary()
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  <Plus size={16} />
                  Add Employee Salary
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">
                      Employee
                    </th>

                    <th className="px-5 py-3">
                      Annual CTC
                    </th>

                    <th className="px-5 py-3">
                      Monthly Gross
                    </th>

                    <th className="px-5 py-3">
                      Basic
                    </th>

                    <th className="px-5 py-3">
                      HRA
                    </th>

                    <th className="px-5 py-3">
                      Allowances
                    </th>

                    <th className="px-5 py-3">
                      Deductions
                    </th>

                    <th className="px-5 py-3">
                      Net Salary
                    </th>

                    <th className="px-5 py-3">
                      Effective From
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {salaries.map(
                    (salary) => {
                      const employee =
                        employeeMap.get(
                          salary.employeeId,
                        );

                      const employeeName =
                        employee?.fullName ||
                        salary.employeeCode ||
                        `Employee #${salary.employeeId}`;

                      return (
                        <tr
                          key={salary.id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {employeeName}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {employee?.employeeCode ||
                                  salary.employeeCode ||
                                  `ID ${salary.employeeId}`}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 font-semibold text-slate-800">
                            {formatMoney(
                              salary.annualCtc,
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatMoney(
                              salary.monthlyGross,
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatMoney(
                              salary.basicSalary,
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatMoney(
                              salary.hra,
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatMoney(
                              salary.otherAllowances,
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-700">
                            {formatMoney(
                              salary.totalDeductions,
                            )}
                          </td>

                          <td className="px-5 py-4 font-semibold text-emerald-700">
                            {formatMoney(
                              salary.netSalary,
                            )}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {formatDate(
                              salary.effectiveFrom,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={
                                salary.status ===
                                "ACTIVE"
                                  ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                  : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                              }
                            >
                              {salary.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {canUpdatePayroll && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void openEditSalary(
                                      salary,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-teal-700"
                                >
                                  <Edit
                                    size={14}
                                  />
                                  Edit
                                </button>
                              )}

                              {canDeletePayroll && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSalaryDeleteTarget(
                                      salary,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                                >
                                  <Trash2
                                    size={14}
                                  />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>


        {/* ======================================================
            DELETE PAYROLL RUN MODAL
        ====================================================== */}

        {deleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                if (!deleting) {
                  setDeleteTarget(
                    null,
                  );
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
                      setDeleteTarget(
                        null,
                      );
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
                  Payroll Run #
                  {deleteTarget.id}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Are you sure you want to delete this payroll run? All information associated with this run will be removed.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setDeleteTarget(
                      null,
                    )
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    void handleDelete()
                  }
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


        {/* ======================================================
            DELETE SALARY MODAL
        ====================================================== */}

        {salaryDeleteTarget && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                if (
                  !salaryDeleting
                ) {
                  setSalaryDeleteTarget(
                    null,
                  );
                }
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-salary-title"
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
                      id="delete-salary-title"
                      className="text-lg font-semibold text-slate-900"
                    >
                      Delete Employee Salary
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      This salary record will be removed.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !salaryDeleting
                    ) {
                      setSalaryDeleteTarget(
                        null,
                      );
                    }
                  }}
                  disabled={
                    salaryDeleting
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close delete salary dialog"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">
                  {employeeMap.get(
                    salaryDeleteTarget.employeeId,
                  )?.fullName ||
                    salaryDeleteTarget.employeeCode ||
                    `Employee #${salaryDeleteTarget.employeeId}`}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Net salary:{" "}
                  {formatMoney(
                    salaryDeleteTarget.netSalary,
                  )}
                </p>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Are you sure you want to delete this salary record?
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    salaryDeleting
                  }
                  onClick={() =>
                    setSalaryDeleteTarget(
                      null,
                    )
                  }
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    salaryDeleting
                  }
                  onClick={() =>
                    void handleDeleteSalary()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />

                  {salaryDeleting
                    ? "Deleting..."
                    : "Delete Salary"}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ======================================================
            ADD / EDIT SALARY MODAL
        ====================================================== */}

        {salaryModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 px-4 py-8">
            <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">

              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {editingSalary
                      ? "Edit Employee Salary"
                      : "Add Employee Salary"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Maintain compensation details and salary effective dates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeSalaryModal
                  }
                  disabled={
                    salarySaving
                  }
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                  aria-label="Close salary form"
                >
                  <X size={20} />
                </button>
              </div>


              <form
                onSubmit={
                  submitSalary
                }
              >
                <div className="space-y-6 px-6 py-6">

                  {salaryError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {salaryError}
                    </div>
                  )}


                  {/* Employee */}

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Employee
                    </h3>

                    <div className="mt-3">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Employee
                      </label>

                      <select
                        value={
                          salaryForm.employeeId
                        }
                        onChange={(event) =>
                          updateSalaryField(
                            "employeeId",
                            event.target
                              .value,
                          )
                        }
                        disabled={
                          Boolean(
                            editingSalary,
                          ) ||
                          employeesLoading ||
                          salarySaving
                        }
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          {employeesLoading
                            ? "Loading employees..."
                            : "Select employee"}
                        </option>

                        {salaryEmployees.map(
                          (employee) => (
                            <option
                              key={
                                employee.id
                              }
                              value={
                                employee.id
                              }
                            >
                              {employee.fullName ||
                                `${employee.firstName} ${employee.lastName || ""}`.trim()}{" "}
                              —{" "}
                              {
                                employee.employeeCode
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  </section>


                  {/* Compensation */}

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Compensation
                    </h3>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Annual CTC
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            salaryForm.annualCtc
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "annualCtc",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Monthly Gross
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            salaryForm.monthlyGross
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "monthlyGross",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Basic Salary
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            salaryForm.basicSalary
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "basicSalary",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          HRA
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            salaryForm.hra
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "hra",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Other Allowances
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            salaryForm.otherAllowances
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "otherAllowances",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Total Deductions
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            salaryForm.totalDeductions
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "totalDeductions",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Net / Take-home Salary
                        </label>

                        <input
                          type="number"
                          value={
                            calculatedNetSalary
                          }
                          readOnly
                          className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 outline-none"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                          Monthly gross minus total deductions.
                        </p>
                      </div>

                    </div>
                  </section>


                  {/* Effective dates */}

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Salary Period
                    </h3>

                    <div className="mt-3 grid gap-4 sm:grid-cols-3">

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Effective From
                        </label>

                        <input
                          type="date"
                          value={
                            salaryForm.effectiveFrom
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "effectiveFrom",
                              event.target
                                .value,
                            )
                          }
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Effective To
                        </label>

                        <input
                          type="date"
                          value={
                            salaryForm.effectiveTo
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "effectiveTo",
                              event.target
                                .value,
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Status
                        </label>

                        <select
                          value={
                            salaryForm.status
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "status",
                              event.target
                                .value as
                                | "ACTIVE"
                                | "INACTIVE",
                            )
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        >
                          <option value="ACTIVE">
                            Active
                          </option>

                          <option value="INACTIVE">
                            Inactive
                          </option>
                        </select>
                      </div>

                    </div>
                  </section>


                  {/* Revision details */}

                  <section>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Revision Details
                    </h3>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Revision Reason
                        </label>

                        <input
                          type="text"
                          maxLength={255}
                          value={
                            salaryForm.revisionReason
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "revisionReason",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Annual increment, promotion, adjustment..."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>


                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Remarks
                        </label>

                        <input
                          type="text"
                          value={
                            salaryForm.remarks
                          }
                          onChange={(event) =>
                            updateSalaryField(
                              "remarks",
                              event.target
                                .value,
                            )
                          }
                          placeholder="Additional salary notes..."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        />
                      </div>

                    </div>
                  </section>

                </div>


                {/* Form actions */}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeSalaryModal
                    }
                    disabled={
                      salarySaving
                    }
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      salarySaving
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {salarySaving
                      ? "Saving..."
                      : editingSalary
                        ? "Update Salary"
                        : "Save Salary"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default Payroll;