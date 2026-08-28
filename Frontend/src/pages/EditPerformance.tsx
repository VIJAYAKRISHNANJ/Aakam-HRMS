import {
  ArrowLeft,
  Edit,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  getEmployees,
  type Employee,
} from "../services/workforceService";

import {
  getPerformanceErrorMessage,
  getPerformanceReview,
  updatePerformanceReview,
  type PerformanceReview,
  type PerformanceStatus,
} from "../services/performanceService";

function EditPerformance() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [review, setReview] =
    useState<PerformanceReview | null>(
      null,
    );

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [employeeId, setEmployeeId] =
    useState("");

  const [reviewerId, setReviewerId] =
    useState("");

  const [start, setStart] =
    useState("");

  const [end, setEnd] =
    useState("");

  const [rating, setRating] =
    useState("");

  const [status, setStatus] =
    useState<PerformanceStatus>("DRAFT");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) return;

    Promise.all([
      getPerformanceReview(id),
      getEmployees(),
    ])
      .then(
        ([
          data,
          employeeData,
        ]) => {
          setReview(data);

          setEmployees(
            employeeData.employees,
          );

          setEmployeeId(
            String(data.employeeId),
          );

          setReviewerId(
            data.reviewerId
              ? String(data.reviewerId)
              : "",
          );

          setStart(
            data.reviewPeriodStart.slice(
              0,
              10,
            ),
          );

          setEnd(
            data.reviewPeriodEnd.slice(
              0,
              10,
            ),
          );

          setRating(
            data.rating
              ? String(data.rating)
              : "",
          );

          setStatus(
            data.status as PerformanceStatus,
          );
        },
      )
      .catch((requestError) =>
        setError(
          getPerformanceErrorMessage(
            requestError,
            "Unable to load this performance review.",
          ),
        ),
      )
      .finally(() =>
        setLoading(false),
      );
  }, [id]);

  const submit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !id ||
      !employeeId ||
      !start ||
      !end ||
      !rating
    ) {
      setError(
        "Employee, review period, and rating are required.",
      );
      return;
    }

    if (end < start) {
      setError(
        "Review period end cannot be before the start date.",
      );
      return;
    }

    const numericRating =
      Number(rating);

    if (
      !Number.isInteger(
        numericRating,
      ) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setError(
        "Rating must be between 1 and 5.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      await updatePerformanceReview(
        id,
        {
          employeeId:
            Number(employeeId),

          reviewerId: reviewerId
            ? Number(reviewerId)
            : null,

          reviewPeriodStart:
            start,

          reviewPeriodEnd:
            end,

          rating:
            numericRating,

          status,
        },
      );

      navigate(
        `/performance/${id}`,
      );
    } catch (requestError) {
      setError(
        getPerformanceErrorMessage(
          requestError,
          "Failed to update performance review.",
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
          title="Edit Performance Review"
          subtitle={
            review
              ? `${review.employeeName} · ${review.status}`
              : "Update performance review."
          }
          icon={Edit}
        />

        <Link
          to={
            id
              ? `/performance/${id}`
              : "/performance"
          }
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to review
        </Link>

        {loading ? (
          <StateMessage type="loading">
            Loading performance review...
          </StateMessage>
        ) : error && !review ? (
          <StateMessage type="error">
            {error}
          </StateMessage>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Review information
                </h2>
              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Employee

                <select
                  required
                  value={employeeId}
                  onChange={(event) =>
                    setEmployeeId(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.fullName} ·{" "}
                        {
                          employee.employeeCode
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Reviewer

                <select
                  value={reviewerId}
                  onChange={(event) =>
                    setReviewerId(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">
                    No reviewer
                  </option>

                  {employees.map(
                    (employee) => (
                      <option
                        key={employee.id}
                        value={employee.id}
                      >
                        {employee.fullName}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Review period start

                <input
                  required
                  type="date"
                  value={start}
                  onChange={(event) =>
                    setStart(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Review period end

                <input
                  required
                  type="date"
                  value={end}
                  onChange={(event) =>
                    setEnd(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Rating

                <select
                  required
                  value={rating}
                  onChange={(event) =>
                    setRating(
                      event.target.value,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">
                    Select rating
                  </option>

                  {[1, 2, 3, 4, 5].map(
                    (value) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value} / 5
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                Status

                <select
                  required
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target
                        .value as PerformanceStatus,
                    )
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="IN_REVIEW">
                    In Review
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>
                </select>
              </label>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EditPerformance;