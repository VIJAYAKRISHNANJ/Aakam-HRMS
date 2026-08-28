import {
  Edit,
  Eye,
  FileCheck2,
  Plus,
  Star,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  SearchInput,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  getPerformanceErrorMessage,
  getPerformanceReviews,
  type PerformanceReview,
  type PerformanceStatus,
} from "../services/performanceService";

const statusLabels: Record<
  PerformanceStatus,
  string
> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
};

const statusClasses: Record<
  PerformanceStatus,
  string
> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_REVIEW: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );

const formatStatus = (status: string) =>
  statusLabels[
    status as PerformanceStatus
  ] ?? status.replaceAll("_", " ");

function Rating({
  value,
}: {
  value: number | null;
}) {
  return (
    <div className="whitespace-nowrap">
      <span className="tracking-wide text-amber-500">
        {Array.from(
          { length: 5 },
          (_, index) =>
            index < (value ?? 0)
              ? "★"
              : "☆",
        ).join("")}
      </span>

      <span className="ml-2 text-xs text-slate-500">
        {value ?? "-"}/5
      </span>
    </div>
  );
}

function Performance() {
  const [reviews, setReviews] =
    useState<PerformanceReview[]>([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getPerformanceReviews();

        setReviews(data);
      } catch (requestError) {
        setError(
          getPerformanceErrorMessage(
            requestError,
            "Unable to load performance reviews.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtered = useMemo(
    () =>
      reviews.filter(
        (review) =>
          (!status ||
            review.status === status) &&
          `${review.employeeName} ${
            review.employeeCode ?? ""
          } ${
            review.reviewerName ?? ""
          } ${review.department}`
            .toLowerCase()
            .includes(
              search.toLowerCase(),
            ),
      ),
    [reviews, search, status],
  );

  const summary = [
    [
      "Total Reviews",
      reviews.length,
      Users,
      "bg-teal-50 text-teal-700",
    ],

    [
      "Draft",
      reviews.filter(
        (review) =>
          review.status === "DRAFT",
      ).length,
      FileCheck2,
      "bg-slate-100 text-slate-700",
    ],

    [
      "In Review",
      reviews.filter(
        (review) =>
          review.status === "IN_REVIEW",
      ).length,
      Star,
      "bg-amber-50 text-amber-700",
    ],

    [
      "Completed",
      reviews.filter(
        (review) =>
          review.status === "COMPLETED",
      ).length,
      FileCheck2,
      "bg-emerald-50 text-emerald-700",
    ],
  ] as const;

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Performance"
          subtitle="Manage employee performance reviews, ratings and goals."
          icon={Star}
          action={
            <Link
              to="/performance/new"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
            >
              <Plus size={16} />
              Add Performance Review
            </Link>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map(
            ([
              title,
              value,
              Icon,
              classes,
            ]) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    {title}
                  </p>

                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${classes}`}
                  >
                    <Icon size={18} />
                  </span>
                </div>

                <p className="mt-4 text-2xl font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ),
          )}
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px]">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search employee or reviewer..."
            />

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-600"
            >
              <option value="">
                All statuses
              </option>

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
          </div>
        </section>

        {loading ? (
          <StateMessage type="loading">
            Loading performance reviews...
          </StateMessage>
        ) : error ? (
          <StateMessage type="error">
            {error}
          </StateMessage>
        ) : filtered.length === 0 ? (
          <StateMessage type="empty">
            No performance reviews found.
          </StateMessage>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    {[
                      "Employee",
                      "Department",
                      "Review Period",
                      "Reviewer",
                      "Rating",
                      "Status",
                      "Goals",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map(
                    (review) => (
                      <tr
                        key={review.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {review.employeeName}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {review.employeeCode ??
                              ""}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {review.department}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(
                            review.reviewPeriodStart,
                          )}{" "}
                          -{" "}
                          {formatDate(
                            review.reviewPeriodEnd,
                          )}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {review.reviewerName ??
                            "-"}
                        </td>

                        <td className="px-5 py-4">
                          <Rating
                            value={
                              review.rating
                            }
                          />
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusClasses[
                                review.status as PerformanceStatus
                              ] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {formatStatus(
                              review.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {review.goals.length}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-1">
                            <Link
                              title="View"
                              to={`/performance/${review.id}`}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                            >
                              <Eye size={16} />
                            </Link>

                            {/* Edit is available for every status,
                                including COMPLETED */}
                            <Link
                              title="Edit"
                              to={`/performance/edit/${review.id}`}
                              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-teal-700"
                            >
                              <Edit size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default Performance;