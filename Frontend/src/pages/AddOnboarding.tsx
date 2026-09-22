import { ArrowLeft, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { PageHeader } from "../components/recruitment/RecruitmentComponents";
import { useAuth } from "../context/AuthContext";
import {
  getCandidates,
  type Candidate,
} from "../services/recruitmentService";
import {
  createOnboarding,
  getOnboardingErrorMessage,
} from "../services/onboardingService";
import {
  getDepartments,
  type Department,
} from "../services/departmentService";

function AddOnboarding() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreateOnboarding =
    hasPermission("onboarding.create");

  const [candidates, setCandidates] =
    useState<Candidate[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [candidateId, setCandidateId] =
    useState("");

  const [departmentId, setDepartmentId] =
    useState("");

  const [expectedJoiningDate, setExpectedJoiningDate] =
    useState("");

  const [onboardingCode, setOnboardingCode] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!canCreateOnboarding) {
      setCandidates([]);
      setDepartments([]);
      setLoading(false);
      setError("");
      return;
    }

    Promise.all([
      getCandidates(),
      getDepartments(),
    ])
      .then(
        ([
          candidateData,
          departmentData,
        ]) => {
          setCandidates(candidateData);
          setDepartments(
            departmentData,
          );
        },
      )
      .catch((requestError) =>
        setError(
          getOnboardingErrorMessage(
            requestError,
            "Unable to load candidates and departments.",
          ),
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, [canCreateOnboarding]);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!canCreateOnboarding) {
      setError(
        "You do not have permission to create onboarding records.",
      );
      return;
    }

    const trimmedOnboardingCode =
      onboardingCode.trim();

    if (
      !candidateId ||
      !departmentId ||
      !expectedJoiningDate ||
      !trimmedOnboardingCode
    ) {
      setError(
        "Candidate, department, expected joining date, and onboarding code are required.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createOnboarding({
        onboardingCode:
          trimmedOnboardingCode,
        candidateId:
          Number(candidateId),
        departmentId:
          Number(departmentId),
        expectedJoiningDate,
      });

      navigate("/onboarding");
    } catch (requestError) {
      setError(
        getOnboardingErrorMessage(
          requestError,
          "Unable to create onboarding record.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateOnboarding) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[520px] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <UserRound size={21} />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Access Restricted
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You do not have permission to create onboarding records.
            </p>

            <Link
              to="/onboarding"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Back to Onboarding
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Add Onboarding"
          subtitle="Start onboarding for a selected recruitment candidate."
          icon={UserRound}
        />

        <Link
          to="/onboarding"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to onboarding
        </Link>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            Loading form...
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <h2 className="font-semibold text-slate-900">
              Onboarding information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Required fields are marked by the form controls.
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Candidate

                <select
                  required
                  value={candidateId}
                  onChange={(event) =>
                    setCandidateId(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">
                    Select candidate
                  </option>

                  {candidates.map(
                    (candidate) => (
                      <option
                        key={candidate.id}
                        value={candidate.id}
                      >
                        {candidate.name} •{" "}
                        {candidate.jobPosition}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Department

                <select
                  required
                  value={departmentId}
                  onChange={(event) =>
                    setDepartmentId(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">
                    Select department
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Expected joining date

                <input
                  required
                  type="date"
                  value={
                    expectedJoiningDate
                  }
                  onChange={(event) =>
                    setExpectedJoiningDate(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Onboarding Code{" "}
                <span className="text-red-500">
                  *
                </span>

                <input
                  required
                  value={onboardingCode}
                  onChange={(event) =>
                    setOnboardingCode(
                      event.target.value,
                    )
                  }
                  placeholder="Enter onboarding code"
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal uppercase outline-none focus:border-teal-600"
                />
              </label>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving
                  ? "Creating..."
                  : "Create Onboarding"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AddOnboarding;
