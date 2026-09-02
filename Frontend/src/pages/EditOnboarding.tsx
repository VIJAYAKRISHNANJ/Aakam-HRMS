import { ArrowLeft, Edit, Save } from "lucide-react";

import { useEffect, useState } from "react";

import type { FormEvent } from "react";

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

  /* =========================================================
     LOAD ONBOARDING RECORD
  ========================================================= */

  useEffect(() => {
    if (!id) {
      setError("Invalid onboarding record ID.");
      setLoading(false);
      return;
    }

    Promise.all([getOnboarding(id), getDepartments()])
      .then(([data, departmentData]) => {
        setRecord(data);
        setDepartments(departmentData);

        setCode(data.onboardingCode);

        setDepartmentId(String(data.departmentId ?? ""));

        setExpectedDate(
          data.expectedJoiningDate ? data.expectedJoiningDate.slice(0, 10) : "",
        );

        setStatus(data.status);
      })
      .catch((requestError) => {
        setError(
          getOnboardingErrorMessage(
            requestError,
            "Unable to load onboarding record.",
          ),
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /* =========================================================
     SUBMIT
  ========================================================= */

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");

    if (!id || !code.trim() || !departmentId || !expectedDate || !status) {
      setError(
        "Onboarding code, department, joining date, and status are required.",
      );
      return;
    }

    try {
      setSaving(true);

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

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        {/* =====================================================
            BACK TO PROFILE
        ===================================================== */}

        <Link
          to={id ? `/onboarding/${id}` : "/onboarding"}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-label="Back to profile"
        >
          <ArrowLeft size={17} />
          Back to Profile
        </Link>

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <PageHeader
          title="Edit Onboarding"
          subtitle={
            record
              ? `${record.onboardingCode} · ${record.candidateName}`
              : "Update onboarding details."
          }
          icon={Edit}
        />

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <StateMessage type="loading">
            Loading onboarding record...
          </StateMessage>
        ) : error && !record ? (
          /* ===================================================
             ERROR
          =================================================== */

          <StateMessage type="error">{error}</StateMessage>
        ) : (
          /* ===================================================
             FORM
          =================================================== */

          <form
            onSubmit={submit}
            className="w-full rounded-xl border border-slate-200 bg-white"
          >
            {/* =================================================
                FORM HEADER
            ================================================= */}

            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-semibold text-slate-900">
                Onboarding Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the onboarding details below.
              </p>
            </div>

            {/* =================================================
                FORM CONTENT
            ================================================= */}

            <div className="px-6 py-6">
              {/* ERROR */}

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                {/* =================================================
                    ONBOARDING CODE
                ================================================= */}

                <label className="text-sm font-medium text-slate-700">
                  Onboarding Code
                  <input
                    required
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    disabled={saving}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </label>

                {/* =================================================
                    STATUS
                ================================================= */}

                <label className="text-sm font-medium text-slate-700">
                  Status
                  <select
                    required
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    disabled={saving}
                    className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    {onboardingStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                {/* =================================================
                    DEPARTMENT
                ================================================= */}

                <label className="text-sm font-medium text-slate-700">
                  Department
                  <select
                    required
                    value={departmentId}
                    onChange={(event) => setDepartmentId(event.target.value)}
                    disabled={saving}
                    className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Select department</option>

                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </label>

                {/* =================================================
                    EXPECTED JOINING DATE
                ================================================= */}

                <label className="text-sm font-medium text-slate-700">
                  Expected Joining Date
                  <input
                    required
                    type="date"
                    value={expectedDate}
                    onChange={(event) => setExpectedDate(event.target.value)}
                    disabled={saving}
                    className="mt-2 block h-11 w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </label>
              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <Link
                  to={id ? `/onboarding/${id}` : "/onboarding"}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EditOnboarding;
