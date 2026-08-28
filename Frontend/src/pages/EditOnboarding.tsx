import { ArrowLeft, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";
import { getDepartments, type Department } from "../services/departmentService";
import {
  getOnboarding,
  getOnboardingErrorMessage,
  onboardingStatuses,
  updateOnboarding,
  type OnboardingRecord,
} from "../services/onboardingService";

function EditOnboarding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<OnboardingRecord | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    Promise.all([getOnboarding(id), getDepartments()])
      .then(([data, departmentData]) => {
        setRecord(data);
        setDepartments(departmentData);
        setCode(data.onboardingCode);
        setDepartmentId(String(data.departmentId ?? ""));
        setExpectedDate(data.expectedJoiningDate.slice(0, 10));
        setStatus(data.status);
      })
      .catch((requestError) =>
        setError(
          getOnboardingErrorMessage(
            requestError,
            "Unable to load onboarding record.",
          ),
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !code.trim() || !departmentId || !expectedDate || !status) {
      setError(
        "Onboarding code, department, joining date, and status are required.",
      );
      return;
    }
    try {
      setSaving(true);
      setError("");
      await updateOnboarding(id, {
        onboardingCode: code.trim(),
        departmentId: Number(departmentId),
        expectedJoiningDate: expectedDate,
        status,
      });
      navigate(`/onboarding/${id}`);
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          "Unable to update onboarding record.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Edit Onboarding"
          subtitle={
            record
              ? `${record.onboardingCode} · ${record.candidateName}`
              : "Update onboarding details."
          }
          icon={Edit}
        />
        <Link
          to={id ? `/onboarding/${id}` : "/onboarding"}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to profile
        </Link>
        {loading ? (
          <StateMessage type="loading">
            Loading onboarding record...
          </StateMessage>
        ) : error && !record ? (
          <StateMessage type="error">{error}</StateMessage>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 className="font-semibold text-slate-900">
              Onboarding information
            </h2>
            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Onboarding code
                <input
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  required
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  {onboardingStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Department
                <select
                  required
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Expected joining date
                <input
                  required
                  type="date"
                  value={expectedDate}
                  onChange={(event) => setExpectedDate(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
            </div>
            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
export default EditOnboarding;
