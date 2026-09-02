import { ArrowLeft, LogOut, Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { PageHeader } from "../components/recruitment/RecruitmentComponents";
import { getEmployees, type Employee } from "../services/workforceService";
import { createExit, getExitErrorMessage } from "../services/exitsService";

function AddExit() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [resignationDate, setResignationDate] = useState("");
  const [exitReason, setExitReason] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("0");
  const [lastWorkingDate, setLastWorkingDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getEmployees()
      .then((data) => setEmployees(data.employees))
      .catch((requestError) =>
        setError(
          getExitErrorMessage(requestError, "Unable to load employees."),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const notice = Number(noticePeriod);
    if (
      !employeeId ||
      !resignationDate ||
      !lastWorkingDate ||
      !exitReason.trim()
    )
      return setError(
        "Employee, resignation date, last working date, and exit reason are required.",
      );
    if (!Number.isInteger(notice) || notice < 0)
      return setError("Notice period must be a non-negative whole number.");
    if (lastWorkingDate < resignationDate)
      return setError("Last working date cannot be before resignation date.");
    try {
      setSaving(true);
      setError("");
      const record = await createExit({
        employeeId: Number(employeeId),
        resignationDate,
        exitReason: exitReason.trim(),
        noticePeriod: notice,
        lastWorkingDate,
        remarks: remarks.trim() || null,
      });
      navigate(`/exits/${record.id}`);
    } catch (requestError) {
      setError(
        getExitErrorMessage(requestError, "Failed to create exit record."),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <PageHeader
          title="Add Exit"
          subtitle="Record an employee resignation and begin the exit workflow."
          icon={LogOut}
        />
        <Link
          to="/exits"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to Exits"
        >
          <ArrowLeft size={17} />
          Back to Exits
        </Link>
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading employees...
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 className="font-semibold text-slate-900">Exit information</h2>
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Employee
                <select
                  required
                  value={employeeId}
                  onChange={(event) => setEmployeeId(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName} · {employee.employeeCode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Exit reason
                <input
                  required
                  value={exitReason}
                  onChange={(event) => setExitReason(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Resignation date
                <input
                  required
                  type="date"
                  value={resignationDate}
                  onChange={(event) => setResignationDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Notice period (days)
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={noticePeriod}
                  onChange={(event) => setNoticePeriod(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Last working date
                <input
                  required
                  type="date"
                  value={lastWorkingDate}
                  onChange={(event) => setLastWorkingDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Remarks
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-teal-600"
                />
              </label>
            </div>
            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Create Exit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
export default AddExit;
