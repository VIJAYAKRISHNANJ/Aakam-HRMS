import {
  Edit,
  FileCheck2,
  Plus,
  Star,
  Trash2,
  Users,
  X,
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
  deletePerformanceReview,
  getPerformanceErrorMessage,
  getPerformanceReviews,
  type PerformanceReview,
  type PerformanceStatus,
} from "../services/performanceService";

/* ============================================================
   STATUS
============================================================ */

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
  DRAFT:
    "bg-slate-100 text-slate-700",

  IN_REVIEW:
    "bg-amber-100 text-amber-700",

  COMPLETED:
    "bg-emerald-100 text-emerald-700",
};

/* ============================================================
   DATE FORMATTER
============================================================ */

const formatDate = (
  value: string,
): string =>
  new Date(
    `${value}T00:00:00Z`,
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );

/* ============================================================
   STATUS FORMATTER
============================================================ */

const formatStatus = (
  status: string,
): string =>
  statusLabels[
    status as PerformanceStatus
  ] ??
  status.replaceAll(
    "_",
    " ",
  );

/* ============================================================
   RATING
============================================================ */

function Rating({
  value,
}: {
  value: number | null;
}) {
  return (
    <div className="whitespace-nowrap">
      <span className="tracking-wide text-amber-500">
        {Array.from(
          {
            length: 5,
          },
          (
            _,
            index,
          ) =>
            index <
            (value ?? 0)
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

/* ============================================================
   PERFORMANCE
============================================================ */

function Performance() {
  const [
    reviews,
    setReviews,
  ] = useState<
    PerformanceReview[]
  >([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* ==========================================================
     DELETE STATE
  ========================================================== */

  const [
    deletingReview,
    setDeletingReview,
  ] =
    useState<PerformanceReview | null>(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /* ==========================================================
     LOAD REVIEWS
  ========================================================== */

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(true);
          setError("");

          const data =
            await getPerformanceReviews();

          setReviews(data);
        } catch (
          requestError
        ) {
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

  /* ==========================================================
     FILTERED REVIEWS
  ========================================================== */

  const filtered =
    useMemo(
      () =>
        reviews.filter(
          (review) =>
            (!status ||
              review.status ===
                status) &&
            `${review.employeeName} ${
              review.employeeCode ??
              ""
            } ${
              review.reviewerName ??
              ""
            } ${
              review.department
            }`
              .toLowerCase()
              .includes(
                search
                  .toLowerCase(),
              ),
        ),
      [
        reviews,
        search,
        status,
      ],
    );

  /* ==========================================================
     SUMMARY
  ========================================================== */

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
          review.status ===
          "DRAFT",
      ).length,
      FileCheck2,
      "bg-slate-100 text-slate-700",
    ],

    [
      "In Review",
      reviews.filter(
        (review) =>
          review.status ===
          "IN_REVIEW",
      ).length,
      Star,
      "bg-amber-50 text-amber-700",
    ],

    [
      "Completed",
      reviews.filter(
        (review) =>
          review.status ===
          "COMPLETED",
      ).length,
      FileCheck2,
      "bg-emerald-50 text-emerald-700",
    ],
  ] as const;

  /* ==========================================================
     OPEN DELETE MODAL
  ========================================================== */

  const openDeleteModal = (
    review: PerformanceReview,
  ) => {
    setDeletingReview(
      review,
    );

    setError("");
    setSuccess("");
  };

  /* ==========================================================
     DELETE REVIEW
  ========================================================== */

  const handleDelete =
    async () => {
      if (
        !deletingReview
      ) {
        return;
      }

      try {
        setDeleting(true);
        setError("");
        setSuccess("");

        await deletePerformanceReview(
          deletingReview.id,
        );

        setReviews(
          (
            currentReviews,
          ) =>
            currentReviews.filter(
              (review) =>
                review.id !==
                deletingReview.id,
            ),
        );

        setSuccess(
          "Performance review deleted successfully.",
        );

        setDeletingReview(
          null,
        );
      } catch (
        requestError
      ) {
        setError(
          getPerformanceErrorMessage(
            requestError,
            "Unable to delete performance review.",
          ),
        );
      } finally {
        setDeleting(false);
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <PageHeader
          title="Performance"
          subtitle="Manage employee performance reviews, ratings and goals."
          icon={Star}
          action={
            <Link
              to="/performance/new"
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-teal-700
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-teal-800
              "
            >
              <Plus
                size={16}
              />

              Add Performance Review
            </Link>
          }
        />

        {/* ====================================================
            SUCCESS MESSAGE
        ==================================================== */}

        {success && (
          <div
            className="
              rounded-lg
              border
              border-emerald-200
              bg-emerald-50
              px-4
              py-3
              text-sm
              text-emerald-700
            "
          >
            {success}
          </div>
        )}

        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <div
          className="
            grid
            gap-4
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >

          {summary.map(
            ([
              title,
              value,
              Icon,
              classes,
            ]) => (
              <div
                key={title}
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  p-5
                "
              >

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <p className="text-sm text-slate-500">
                    {title}
                  </p>

                  <span
                    className={`
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-lg
                      ${classes}
                    `}
                  >
                    <Icon
                      size={18}
                    />
                  </span>

                </div>

                <p
                  className="
                    mt-4
                    text-2xl
                    font-semibold
                    text-slate-900
                  "
                >
                  {value}
                </p>

              </div>
            ),
          )}

        </div>

        {/* ====================================================
            SEARCH + FILTER
        ==================================================== */}

        <section
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-4
          "
        >

          <div
            className="
              grid
              gap-3
              md:grid-cols-[minmax(0,1fr)_200px]
            "
          >

            <SearchInput
              value={
                search
              }
              onChange={
                setSearch
              }
              placeholder="Search employee or reviewer..."
            />

            <select
              value={
                status
              }
              onChange={(
                event,
              ) =>
                setStatus(
                  event.target
                    .value,
                )
              }
              className="
                h-10
                rounded-lg
                border
                border-slate-300
                bg-white
                px-3
                text-sm
                outline-none
                transition
                focus:border-teal-600
                focus:ring-2
                focus:ring-teal-600/20
              "
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

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div
            className="
              rounded-lg
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              text-red-700
            "
          >
            {error}
          </div>
        )}

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <StateMessage type="loading">
            Loading performance reviews...
          </StateMessage>
        ) : filtered.length ===
          0 ? (
          <StateMessage type="empty">
            No performance reviews found.
          </StateMessage>
        ) : (
          <div
            className="
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-white
            "
          >

            <div className="overflow-x-auto">

              <table
                className="
                  w-full
                  min-w-[1000px]
                  text-left
                  text-sm
                "
              >

                {/* ==================================================
                    TABLE HEADER
                ================================================== */}

                <thead
                  className="
                    border-b
                    border-slate-200
                    bg-slate-50
                    text-xs
                    uppercase
                    tracking-wide
                    text-slate-500
                  "
                >

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
                    ].map(
                      (
                        heading,
                      ) => (
                        <th
                          key={
                            heading
                          }
                          className="
                            px-5
                            py-3
                          "
                        >
                          {
                            heading
                          }
                        </th>
                      ),
                    )}

                  </tr>

                </thead>

                {/* ==================================================
                    TABLE BODY
                ================================================== */}

                <tbody
                  className="
                    divide-y
                    divide-slate-100
                  "
                >

                  {filtered.map(
                    (
                      review,
                    ) => (
                      <tr
                        key={
                          review.id
                        }
                        className="
                          hover:bg-slate-50
                        "
                      >

                        {/* EMPLOYEE */}

                        <td className="px-5 py-4">

                          <p className="font-semibold text-slate-800">
                            {
                              review.employeeName
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {
                              review.employeeCode ??
                              ""
                            }
                          </p>

                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-5 py-4 text-slate-600">
                          {
                            review.department
                          }
                        </td>

                        {/* REVIEW PERIOD */}

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(
                            review.reviewPeriodStart,
                          )}

                          {" - "}

                          {formatDate(
                            review.reviewPeriodEnd,
                          )}
                        </td>

                        {/* REVIEWER */}

                        <td className="px-5 py-4 text-slate-600">
                          {
                            review.reviewerName ??
                            "-"
                          }
                        </td>

                        {/* RATING */}

                        <td className="px-5 py-4">
                          <Rating
                            value={
                              review.rating
                            }
                          />
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-2.5
                              py-1
                              text-xs
                              font-semibold
                              ${
                                statusClasses[
                                  review.status as PerformanceStatus
                                ] ??
                                "bg-slate-100 text-slate-700"
                              }
                            `}
                          >
                            {
                              formatStatus(
                                review.status,
                              )
                            }
                          </span>

                        </td>

                        {/* GOALS */}

                        <td className="px-5 py-4 text-slate-600">
                          {
                            review.goals.length
                          }
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div
                            className="
                              flex
                              justify-end
                              gap-2
                            "
                          >

                            {/* EDIT */}

                            <Link
                              title="Edit"
                              to={`/performance/edit/${review.id}`}
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-slate-300
                                bg-white
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                text-slate-700
                                transition
                                hover:bg-slate-50
                                hover:text-teal-700
                              "
                            >

                              <Edit
                                size={14}
                              />

                              Edit

                            </Link>

                            {/* DELETE */}

                            <button
                              type="button"
                              title="Delete"
                              onClick={() =>
                                openDeleteModal(
                                  review,
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                rounded-lg
                                border
                                border-red-200
                                bg-white
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                text-red-600
                                transition
                                hover:bg-red-50
                              "
                            >

                              <Trash2
                                size={14}
                              />

                              Delete

                            </button>

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

        {/* ====================================================
            DELETE CONFIRMATION MODAL
        ==================================================== */}

        {deletingReview && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-slate-950/40
              px-4
            "
          >

            <div
              className="
                w-full
                max-w-md
                rounded-2xl
                bg-white
                p-6
                shadow-2xl
              "
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-performance-title"
            >

              {/* MODAL HEADER */}

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >

                <div>

                  <h2
                    id="delete-performance-title"
                    className="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Delete Performance Review?
                  </h2>

                  <p
                    className="
                      mt-3
                      text-sm
                      leading-6
                      text-slate-600
                    "
                  >
                    Are you sure you want to delete the performance review for{" "}

                    <span className="font-semibold text-slate-900">
                      {
                        deletingReview.employeeName
                      }
                    </span>
                    ?

                    <br />

                    This will also remove all goals linked to this review.
                    This action cannot be undone.
                  </p>

                </div>

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setDeletingReview(
                      null,
                    )
                  }
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  aria-label="Close"
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

              {/* MODAL ACTIONS */}

              <div
                className="
                  mt-6
                  flex
                  justify-end
                  gap-3
                "
              >

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    setDeletingReview(
                      null,
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    deleting
                  }
                  onClick={() =>
                    void handleDelete()
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-red-600
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-red-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  <Trash2
                    size={15}
                  />

                  {deleting
                    ? "Deleting..."
                    : "Delete Review"}

                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default Performance;