import { ArrowLeft, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { PageHeader } from "../components/recruitment/RecruitmentComponents";
import { getEmployees, type Employee } from "../services/workforceService";
import {
  createPerformanceReview,
  getPerformanceErrorMessage,
  type PerformanceStatus,
} from "../services/performanceService";

function AddPerformance() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState<PerformanceStatus>("DRAFT");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getEmployees()
      .then((data) => setEmployees(data.employees))
      .catch((requestError) =>
        setError(
          getPerformanceErrorMessage(requestError, "Unable to load employees."),
        ),
      )
      .finally(() => setLoading(false));
  }, []);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeId || !start || !end || !rating)
      return setError("Employee, review period, and rating are required.");
    if (end < start)
      return setError("Review period end cannot be before the start date.");
    const numericRating = Number(rating);
    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    )
      return setError("Rating must be between 1 and 5.");
    try {
      setSaving(true);
      setError("");
      const review = await createPerformanceReview({
        employeeId: Number(employeeId),
        reviewerId: reviewerId ? Number(reviewerId) : null,
        reviewPeriodStart: start,
        reviewPeriodEnd: end,
        rating: numericRating,
        status,
      });
      navigate(`/performance/${review.id}`);
    } catch (requestError) {
      setError(
        getPerformanceErrorMessage(
          requestError,
          "Failed to create performance review.",
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
          title="Add Performance Review"
          subtitle="Create a review for an employee using the real workforce records."
          icon={Star}
        />
        <Link
          to="/performance"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft size={16} />
          Back to performance
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
            <h2 className="font-semibold text-slate-900">Review information</h2>
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
                Reviewer
                <select
                  value={reviewerId}
                  onChange={(event) => setReviewerId(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">No reviewer</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Review period start
                <input
                  required
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Review period end
                <input
                  required
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-teal-600"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Rating
                <select
                  required
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="">Select rating</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} / 5
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  required
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as PerformanceStatus)
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
            </div>
            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
export default AddPerformance;
