import {
  ArrowLeft,
  Edit,
  Save,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import type { FormEvent } from "react";

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
} from "../services/workforceService";

import {
  getPerformanceErrorMessage,
  getPerformanceReview,
  updatePerformanceReview,
  type PerformanceReview,
  type PerformanceStatus,
} from "../services/performanceService";

function EditPerformance() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [
    review,
    setReview,
  ] =
    useState<PerformanceReview | null>(
      null,
    );

  const [
    employees,
    setEmployees,
  ] = useState<
    Awaited<
      ReturnType<typeof getEmployees>
    >["employees"]
  >([]);

  const [
    employeeId,
    setEmployeeId,
  ] = useState("");

  const [
    reviewerId,
    setReviewerId,
  ] = useState("");

  const [
    start,
    setStart,
  ] = useState("");

  const [
    end,
    setEnd,
  ] = useState("");

  const [
    rating,
    setRating,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<PerformanceStatus>(
      "DRAFT",
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Review
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError(
          "Invalid performance review ID.",
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          reviewData,
          employeeData,
        ] = await Promise.all([
          getPerformanceReview(
            id,
          ),
          getEmployees(),
        ]);

        setReview(
          reviewData,
        );

        setEmployees(
          employeeData.employees,
        );

        setEmployeeId(
          String(
            reviewData.employeeId,
          ),
        );

        setReviewerId(
          reviewData.reviewerId
            ? String(
                reviewData.reviewerId,
              )
            : "",
        );

        setStart(
          reviewData.reviewPeriodStart.slice(
            0,
            10,
          ),
        );

        setEnd(
          reviewData.reviewPeriodEnd.slice(
            0,
            10,
          ),
        );

        setRating(
          reviewData.rating
            ? String(
                reviewData.rating,
              )
            : "",
        );

        setStatus(
          reviewData.status as PerformanceStatus,
        );
      } catch (requestError) {
        setError(
          getPerformanceErrorMessage(
            requestError,
            "Unable to load this performance review.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const submit = async (
    event: FormEvent<HTMLFormElement>,
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
            Number(
              employeeId,
            ),

          reviewerId:
            reviewerId
              ? Number(
                  reviewerId,
                )
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

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <DashboardLayout>
        <StateMessage type="loading">
          Loading performance review...
        </StateMessage>
      </DashboardLayout>
    );
  }

  if (error && !review) {
    return (
      <DashboardLayout>
        <StateMessage type="error">
          {error}
        </StateMessage>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex w-full min-w-0 flex-col gap-6">

        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <Link
          to={
            id
              ? `/performance/${id}`
              : "/performance"
          }
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-lg
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            shadow-sm
            transition
            hover:bg-slate-50
            hover:text-slate-900
          "
        >
          <ArrowLeft size={17} />
          Back to Performance Review
        </Link>

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <PageHeader
          title="Edit Performance Review"
          subtitle={
            review
              ? `${review.employeeName} · ${review.status}`
              : "Update performance review."
          }
          icon={Edit}
        />

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={submit}
          className="
            w-full
            rounded-xl
            border
            border-slate-200
            bg-white
            p-6
          "
        >

          <div>

            <h2 className="font-semibold text-slate-900">
              Review information
            </h2>

            {review?.status ===
              "COMPLETED" && (
              <p className="mt-1 text-sm text-amber-600">
                This review is completed, but it can still be edited.
              </p>
            )}

          </div>

          {error && (
            <div
              className="
                mt-5
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

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            {/* EMPLOYEE */}

            <label className="text-sm font-medium text-slate-700">
              Employee

              <select
                required
                value={employeeId}
                onChange={(
                  event,
                ) =>
                  setEmployeeId(
                    event.target
                      .value,
                  )
                }
                disabled={saving}
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  font-normal
                  outline-none
                  transition
                  focus:border-teal-600
                  focus:ring-2
                  focus:ring-teal-600/20
                "
              >
                <option value="">
                  Select employee
                </option>

                {employees.map(
                  (
                    employee,
                  ) => (
                    <option
                      key={
                        employee.id
                      }
                      value={
                        employee.id
                      }
                    >
                      {
                        employee.fullName
                      }{" "}
                      ·{" "}
                      {
                        employee.employeeCode
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* REVIEWER */}

            <label className="text-sm font-medium text-slate-700">
              Reviewer

              <select
                value={reviewerId}
                onChange={(
                  event,
                ) =>
                  setReviewerId(
                    event.target
                      .value,
                  )
                }
                disabled={saving}
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  font-normal
                  outline-none
                  transition
                  focus:border-teal-600
                  focus:ring-2
                  focus:ring-teal-600/20
                "
              >
                <option value="">
                  No reviewer
                </option>

                {employees.map(
                  (
                    employee,
                  ) => (
                    <option
                      key={
                        employee.id
                      }
                      value={
                        employee.id
                      }
                    >
                      {
                        employee.fullName
                      }
                    </option>
                  ),
                )}
              </select>
            </label>

            {/* START */}

            <label className="text-sm font-medium text-slate-700">
              Review period start

              <input
                required
                type="date"
                value={start}
                onChange={(
                  event,
                ) =>
                  setStart(
                    event.target
                      .value,
                  )
                }
                disabled={saving}
                className="
                  mt-2
                  block
                  h-11
                  w-full
                  cursor-pointer
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
              />
            </label>

            {/* END */}

            <label className="text-sm font-medium text-slate-700">
              Review period end

              <input
                required
                type="date"
                value={end}
                onChange={(
                  event,
                ) =>
                  setEnd(
                    event.target
                      .value,
                  )
                }
                disabled={saving}
                className="
                  mt-2
                  block
                  h-11
                  w-full
                  cursor-pointer
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
              />
            </label>

            {/* RATING */}

            <label className="text-sm font-medium text-slate-700">
              Rating

              <select
                required
                value={rating}
                onChange={(
                  event,
                ) =>
                  setRating(
                    event.target
                      .value,
                  )
                }
                disabled={saving}
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  font-normal
                  outline-none
                  transition
                  focus:border-teal-600
                  focus:ring-2
                  focus:ring-teal-600/20
                "
              >
                <option value="">
                  Select rating
                </option>

                <option value="1">
                  1 / 5
                </option>

                <option value="2">
                  2 / 5
                </option>

                <option value="3">
                  3 / 5
                </option>

                <option value="4">
                  4 / 5
                </option>

                <option value="5">
                  5 / 5
                </option>
              </select>
            </label>

            {/* STATUS */}

            <label className="text-sm font-medium text-slate-700">
              Status

              <select
                value={status}
                onChange={(
                  event,
                ) =>
                  setStatus(
                    event.target
                      .value as PerformanceStatus,
                  )
                }
                disabled={saving}
                className="
                  mt-2
                  h-11
                  w-full
                  rounded-lg
                  border
                  border-slate-300
                  bg-white
                  px-3
                  font-normal
                  outline-none
                  transition
                  focus:border-teal-600
                  focus:ring-2
                  focus:ring-teal-600/20
                "
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

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            className="
              mt-7
              flex
              flex-col-reverse
              gap-3
              sm:flex-row
              sm:justify-end
            "
          >

            <Link
              to={
                id
                  ? `/performance/${id}`
                  : "/performance"
              }
              className="
                inline-flex
                items-center
                justify-center
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
              "
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex
                items-center
                justify-center
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
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <Save size={16} />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      </div>
    </DashboardLayout>
  );
}

export default EditPerformance;