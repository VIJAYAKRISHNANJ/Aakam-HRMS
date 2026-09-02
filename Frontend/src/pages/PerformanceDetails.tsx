import {
  ArrowLeft,
  Check,
  Edit,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type { FormEvent } from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import DashboardLayout from "../components/layout/DashboardLayout";

import {
  PageHeader,
  StateMessage,
} from "../components/recruitment/RecruitmentComponents";

import {
  createPerformanceGoal,
  deletePerformanceGoal,
  getPerformanceErrorMessage,
  getPerformanceGoals,
  getPerformanceReview,
  goalStatuses,
  updatePerformanceGoal,
  updatePerformanceReview,
  type GoalStatus,
  type PerformanceGoal,
  type PerformanceReview,
  type PerformanceStatus,
} from "../services/performanceService";

/* ============================================================
   REVIEW STATUS
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
   GOAL STATUS
============================================================ */

const goalStatusClasses: Record<
  GoalStatus,
  string
> = {
  NOT_STARTED:
    "bg-slate-100 text-slate-700",

  IN_PROGRESS:
    "bg-amber-100 text-amber-700",

  COMPLETED:
    "bg-emerald-100 text-emerald-700",
};

const getGoalStatusClass = (
  status: string,
): string => {
  if (
    status ===
      "NOT_STARTED" ||
    status ===
      "IN_PROGRESS" ||
    status ===
      "COMPLETED"
  ) {
    return goalStatusClasses[
      status as GoalStatus
    ];
  }

  return "bg-slate-100 text-slate-700";
};

/* ============================================================
   DATE FORMATTER
============================================================ */

const formatDate = (
  value: string,
): string => {
  const normalized =
    value.length === 10
      ? `${value}T00:00:00Z`
      : value;

  return new Date(
    normalized,
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
};

/* ============================================================
   LABEL FORMATTER
============================================================ */

const label = (
  value: string,
): string =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );

/* ============================================================
   PERFORMANCE DETAILS
============================================================ */

function PerformanceDetails() {
  const { id } =
    useParams();

  const [
    review,
    setReview,
  ] =
    useState<PerformanceReview | null>(
      null,
    );

  const [
    goals,
    setGoals,
  ] =
    useState<PerformanceGoal[]>(
      [],
    );

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

  const [
    busy,
    setBusy,
  ] = useState("");

  /* ==========================================================
     ADD GOAL FORM
  ========================================================== */

  const [
    goalTitle,
    setGoalTitle,
  ] = useState("");

  const [
    goalDescription,
    setGoalDescription,
  ] = useState("");

  const [
    goalTarget,
    setGoalTarget,
  ] = useState("");

  const [
    goalStatus,
    setGoalStatus,
  ] =
    useState<GoalStatus>(
      "NOT_STARTED",
    );

  /* ==========================================================
     EDIT GOAL
  ========================================================== */

  const [
    editingGoal,
    setEditingGoal,
  ] =
    useState<PerformanceGoal | null>(
      null,
    );

  const [
    editGoalTitle,
    setEditGoalTitle,
  ] = useState("");

  const [
    editGoalDescription,
    setEditGoalDescription,
  ] =
    useState("");

  const [
    editGoalTarget,
    setEditGoalTarget,
  ] = useState("");

  const [
    editGoalStatus,
    setEditGoalStatus,
  ] =
    useState<GoalStatus>(
      "NOT_STARTED",
    );

  /* ==========================================================
     DELETE GOAL
  ========================================================== */

  const [
    deletingGoal,
    setDeletingGoal,
  ] =
    useState<PerformanceGoal | null>(
      null,
    );

  const [
    goalActionBusy,
    setGoalActionBusy,
  ] = useState(false);

  /* ==========================================================
     COMPLETE MODAL
  ========================================================== */

  const [
    completeModal,
    setCompleteModal,
  ] = useState(false);

  /* ==========================================================
     LOAD REVIEW + GOALS
  ========================================================== */

  const load =
    useCallback(
      async () => {
        if (!id) {
          return;
        }

        try {
          setLoading(true);
          setError("");

          const [
            reviewData,
            goalData,
          ] =
            await Promise.all([
              getPerformanceReview(
                id,
              ),
              getPerformanceGoals(
                id,
              ),
            ]);

          setReview(
            reviewData,
          );

          setGoals(
            goalData,
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
      },
      [id],
    );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void load();
      }, 0);

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [load]);

  /* ==========================================================
     WORKFLOW ACTION
  ========================================================== */

  const action = async (
    name: string,
    request: () => Promise<unknown>,
  ) => {
    try {
      setBusy(name);
      setError("");
      setSuccess("");

      await request();

      setSuccess(
        "Performance review updated successfully.",
      );

      await load();
    } catch (requestError) {
      setError(
        getPerformanceErrorMessage(
          requestError,
          "Unable to update performance review.",
        ),
      );
    } finally {
      setBusy("");
    }
  };

  /* ==========================================================
     ADD GOAL
  ========================================================== */

  const addGoal = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !id ||
      !goalTitle.trim()
    ) {
      setError(
        "Goal title is required.",
      );
      return;
    }

    try {
      setBusy("goal");
      setError("");
      setSuccess("");

      const createdGoal =
        await createPerformanceGoal(
          id,
          {
            title:
              goalTitle.trim(),

            description:
              goalDescription.trim() ||
              null,

            target:
              goalTarget.trim() ||
              null,

            status:
              goalStatus,
          },
        );

      setGoals(
        (currentGoals) => [
          ...currentGoals,
          createdGoal,
        ],
      );

      setGoalTitle("");
      setGoalDescription("");
      setGoalTarget("");
      setGoalStatus(
        "NOT_STARTED",
      );

      setSuccess(
        "Goal added successfully. You can add another goal.",
      );
    } catch (requestError) {
      setError(
        getPerformanceErrorMessage(
          requestError,
          "Unable to add performance goal.",
        ),
      );
    } finally {
      setBusy("");
    }
  };

  /* ==========================================================
     OPEN EDIT GOAL
  ========================================================== */

  const openEditGoal = (
    goal: PerformanceGoal,
  ) => {
    setEditingGoal(
      goal,
    );

    setEditGoalTitle(
      goal.title,
    );

    setEditGoalDescription(
      goal.description ??
        "",
    );

    setEditGoalTarget(
      goal.target ??
        "",
    );

    setEditGoalStatus(
      goal.status,
    );

    setError("");
    setSuccess("");
  };

  /* ==========================================================
     SAVE EDITED GOAL
  ========================================================== */

  const saveEditedGoal =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      if (
        !id ||
        !editingGoal ||
        !editGoalTitle.trim()
      ) {
        setError(
          "Goal title is required.",
        );
        return;
      }

      try {
        setGoalActionBusy(
          true,
        );

        setError("");
        setSuccess("");

        const updatedGoal =
          await updatePerformanceGoal(
            id,
            editingGoal.id,
            {
              title:
                editGoalTitle.trim(),

              description:
                editGoalDescription.trim() ||
                null,

              target:
                editGoalTarget.trim() ||
                null,

              status:
                editGoalStatus,
            },
          );

        setGoals(
          (currentGoals) =>
            currentGoals.map(
              (goal) =>
                goal.id ===
                updatedGoal.id
                  ? updatedGoal
                  : goal,
            ),
        );

        setEditingGoal(
          null,
        );

        setSuccess(
          "Performance goal updated successfully.",
        );
      } catch (requestError) {
        setError(
          getPerformanceErrorMessage(
            requestError,
            "Unable to update performance goal.",
          ),
        );
      } finally {
        setGoalActionBusy(
          false,
        );
      }
    };

  /* ==========================================================
     DELETE GOAL
  ========================================================== */

  const confirmDeleteGoal =
    async () => {
      if (
        !id ||
        !deletingGoal
      ) {
        return;
      }

      try {
        setGoalActionBusy(
          true,
        );

        setError("");
        setSuccess("");

        await deletePerformanceGoal(
          id,
          deletingGoal.id,
        );

        setGoals(
          (currentGoals) =>
            currentGoals.filter(
              (goal) =>
                goal.id !==
                deletingGoal.id,
            ),
        );

        setDeletingGoal(
          null,
        );

        setSuccess(
          "Performance goal deleted successfully.",
        );
      } catch (requestError) {
        setError(
          getPerformanceErrorMessage(
            requestError,
            "Unable to delete performance goal.",
          ),
        );
      } finally {
        setGoalActionBusy(
          false,
        );
      }
    };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <DashboardLayout>
        <StateMessage type="loading">
          Loading performance review...
        </StateMessage>
      </DashboardLayout>
    );
  }

  /* ==========================================================
     ERROR
  ========================================================== */

  if (
    error &&
    !review
  ) {
    return (
      <DashboardLayout>
        <StateMessage type="error">
          {error}
        </StateMessage>
      </DashboardLayout>
    );
  }

  if (!review || !id) {
    return null;
  }

  /* ==========================================================
     STATUS
  ========================================================== */

  const status =
    review.status as PerformanceStatus;

  const currentStep =
    status ===
    "COMPLETED"
      ? 2
      : status ===
          "IN_REVIEW"
        ? 1
        : 0;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <DashboardLayout>
      <div
        className="
          flex
          min-w-0
          flex-col
          gap-6
        "
      >

        {/* ====================================================
            BACK BUTTON
        ==================================================== */}

        <Link
          to="/performance"
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
          <ArrowLeft
            size={17}
          />

          Back to Performance
        </Link>

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <PageHeader
          title={
            review.employeeName
          }
          subtitle={`${review.department} · Performance review`}
          icon={Star}
          action={
            <Link
              to={`/performance/edit/${id}`}
              className="
                inline-flex
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
                transition
                hover:bg-slate-50
              "
            >
              <Edit size={16} />

              Edit
            </Link>
          }
        />

        {/* ====================================================
            SUCCESS
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
            INFORMATION + WORKFLOW
        ==================================================== */}

        <div
          className="
            grid
            gap-6
            lg:grid-cols-[1fr_1.2fr]
          "
        >

          {/* REVIEW INFORMATION */}

          <section
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              p-6
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <h2 className="font-semibold text-slate-900">
                Review information
              </h2>

              <span
                className={`
                  rounded-full
                  px-2.5
                  py-1
                  text-xs
                  font-semibold
                  ${
                    statusClasses[
                      status
                    ]
                  }
                `}
              >
                {
                  statusLabels[
                    status
                  ]
                }
              </span>

            </div>

            <div
              className="
                mt-5
                divide-y
                divide-slate-100
              "
            >

              <div className="flex justify-between gap-4 py-3 first:pt-0">
                <span className="text-sm text-slate-500">
                  Employee
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {
                    review.employeeName
                  }
                </span>
              </div>

              <div className="flex justify-between gap-4 py-3">
                <span className="text-sm text-slate-500">
                  Employee code
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {
                    review.employeeCode ??
                    "-"
                  }
                </span>
              </div>

              <div className="flex justify-between gap-4 py-3">
                <span className="text-sm text-slate-500">
                  Department
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {
                    review.department
                  }
                </span>
              </div>

              <div className="flex justify-between gap-4 py-3">
                <span className="text-sm text-slate-500">
                  Reviewer
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {
                    review.reviewerName ??
                    "-"
                  }
                </span>
              </div>

              <div className="flex justify-between gap-4 py-3">
                <span className="text-sm text-slate-500">
                  Review period
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {formatDate(
                    review.reviewPeriodStart,
                  )}

                  {" - "}

                  {formatDate(
                    review.reviewPeriodEnd,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-3">
                <span className="text-sm text-slate-500">
                  Created
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {formatDate(
                    review.createdAt,
                  )}
                </span>
              </div>

              <div className="flex justify-between gap-4 py-3">
                <span className="text-sm text-slate-500">
                  Updated
                </span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {formatDate(
                    review.updatedAt,
                  )}
                </span>
              </div>

            </div>

            <div
              className="
                mt-4
                border-t
                border-slate-100
                pt-5
              "
            >

              <p className="text-sm text-slate-500">
                Rating
              </p>

              <div className="mt-2 flex items-center gap-3">

                <span className="tracking-wide text-lg text-amber-500">
                  {Array.from(
                    {
                      length: 5,
                    },
                    (
                      _,
                      index,
                    ) =>
                      index <
                      (review.rating ??
                        0)
                        ? "★"
                        : "☆",
                  ).join("")}
                </span>

                <span className="text-sm font-semibold text-slate-700">
                  {
                    review.rating ??
                    "-"
                  }
                  /5
                </span>

              </div>

            </div>

          </section>

          {/* WORKFLOW */}

          <section
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              p-6
            "
          >

            <h2 className="font-semibold text-slate-900">
              Review workflow
            </h2>

            <div
              className="
                mt-10
                flex
                items-start
              "
            >

              {[
                "Draft",
                "In Review",
                "Completed",
              ].map(
                (
                  step,
                  index,
                ) => (
                  <div
                    key={step}
                    className="
                      flex
                      flex-1
                      items-start
                    "
                  >

                    <div className="flex flex-col items-center">

                      <div
                        className={`
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          text-sm
                          font-semibold
                          ${
                            index <=
                            currentStep
                              ? "bg-teal-600 text-white"
                              : "bg-slate-100 text-slate-500"
                          }
                        `}
                      >

                        {index <
                        currentStep ? (
                          <Check
                            size={18}
                          />
                        ) : (
                          index +
                          1
                        )}

                      </div>

                      <span
                        className={`
                          mt-3
                          text-center
                          text-xs
                          ${
                            index ===
                            currentStep
                              ? "font-semibold text-teal-700"
                              : "text-slate-500"
                          }
                        `}
                      >
                        {
                          step
                        }
                      </span>

                    </div>

                    {index <
                      2 && (
                      <div
                        className={`
                          mt-5
                          h-0.5
                          flex-1
                          ${
                            index <
                            currentStep
                              ? "bg-teal-600"
                              : "bg-slate-200"
                          }
                        `}
                      />
                    )}

                  </div>
                ),
              )}

            </div>

            <div
              className="
                mt-10
                flex
                justify-end
              "
            >

              {status ===
                "DRAFT" && (
                <button
                  type="button"
                  disabled={
                    !!busy
                  }
                  onClick={() =>
                    void action(
                      "workflow",
                      () =>
                        updatePerformanceReview(
                          id,
                          {
                            status:
                              "IN_REVIEW",
                          },
                        ),
                    )
                  }
                  className="
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
                  {busy ===
                  "workflow"
                    ? "Submitting..."
                    : "Submit for Review"}
                </button>
              )}

              {status ===
                "IN_REVIEW" && (
                <button
                  type="button"
                  disabled={
                    !!busy
                  }
                  onClick={() =>
                    setCompleteModal(
                      true,
                    )
                  }
                  className="
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
                  Complete Review
                </button>
              )}

              {status ===
                "COMPLETED" && (
                <p className="text-sm font-medium text-emerald-700">
                  This review is finalized.
                </p>
              )}

            </div>

          </section>

        </div>

        {/* ====================================================
            GOALS
        ==================================================== */}

        <section
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-6
          "
        >

          <div
            className="
              flex
              flex-wrap
              items-start
              justify-between
              gap-4
            "
          >

            <div>

              <h2 className="font-semibold text-slate-900">
                Goals
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {goals.length} goal
                {goals.length ===
                1
                  ? ""
                  : "s"} linked
                to this review.
              </p>

            </div>

            <span
              className="
                rounded-full
                bg-teal-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-teal-700
              "
            >
              {goals.length} Total
            </span>

          </div>

          {/* ADD GOAL */}

          <form
            onSubmit={addGoal}
            className="
              mt-6
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-5
            "
          >

            <div className="mb-5">

              <div className="flex items-center gap-2">

                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    bg-white
                    text-teal-700
                    shadow-sm
                  "
                >
                  <Plus
                    size={16}
                  />
                </div>

                <div>

                  <h3 className="text-sm font-semibold text-slate-900">
                    Add a performance goal
                  </h3>

                  <p className="text-xs text-slate-500">
                    You can add multiple goals to this review.
                  </p>

                </div>

              </div>

            </div>

            <div
              className="
                grid
                gap-4
                md:grid-cols-2
              "
            >

              <label className="text-sm font-medium text-slate-700">

                Goal title

                <input
                  required
                  value={
                    goalTitle
                  }
                  onChange={(
                    event,
                  ) =>
                    setGoalTitle(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    busy ===
                    "goal"
                  }
                  placeholder="e.g. Improve project delivery"
                  className="
                    mt-2
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    text-sm
                    font-normal
                    outline-none
                    transition
                    focus:border-teal-600
                    focus:ring-2
                    focus:ring-teal-600/20
                  "
                />

              </label>

              <label className="text-sm font-medium text-slate-700">

                Target

                <input
                  value={
                    goalTarget
                  }
                  onChange={(
                    event,
                  ) =>
                    setGoalTarget(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    busy ===
                    "goal"
                  }
                  placeholder="e.g. Complete 95% of tasks on time"
                  className="
                    mt-2
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    text-sm
                    font-normal
                    outline-none
                    transition
                    focus:border-teal-600
                    focus:ring-2
                    focus:ring-teal-600/20
                  "
                />

              </label>

              <label className="text-sm font-medium text-slate-700">

                Description

                <input
                  value={
                    goalDescription
                  }
                  onChange={(
                    event,
                  ) =>
                    setGoalDescription(
                      event.target
                        .value,
                    )
                  }
                  disabled={
                    busy ===
                    "goal"
                  }
                  placeholder="Describe the goal"
                  className="
                    mt-2
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    text-sm
                    font-normal
                    outline-none
                    transition
                    focus:border-teal-600
                    focus:ring-2
                    focus:ring-teal-600/20
                  "
                />

              </label>

              <label className="text-sm font-medium text-slate-700">

                Goal status

                <select
                  value={
                    goalStatus
                  }
                  onChange={(
                    event,
                  ) =>
                    setGoalStatus(
                      event.target
                        .value as GoalStatus,
                    )
                  }
                  disabled={
                    busy ===
                    "goal"
                  }
                  className="
                    mt-2
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-slate-300
                    bg-white
                    px-3
                    text-sm
                    font-normal
                    outline-none
                    transition
                    focus:border-teal-600
                    focus:ring-2
                    focus:ring-teal-600/20
                  "
                >

                  {goalStatuses.map(
                    (
                      option,
                    ) => (
                      <option
                        key={
                          option
                        }
                        value={
                          option
                        }
                      >
                        {label(
                          option,
                        )}
                      </option>
                    ),
                  )}

                </select>

              </label>

            </div>

            <div className="mt-5 flex justify-end">

              <button
                type="submit"
                disabled={
                  busy ===
                  "goal"
                }
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
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >

                <Plus
                  size={16}
                />

                {busy ===
                "goal"
                  ? "Adding..."
                  : "Add Goal"}

              </button>

            </div>

          </form>

          {/* GOAL LIST */}

          {goals.length ===
          0 ? (
            <div
              className="
                mt-6
                rounded-xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                px-4
                py-8
                text-center
              "
            >

              <Star
                size={28}
                className="mx-auto mb-2 text-slate-400"
              />

              <p className="text-sm font-medium text-slate-700">
                No goals added yet.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Use the form above to add the first goal.
              </p>

            </div>
          ) : (
            <div
              className="
                mt-6
                space-y-3
              "
            >

              {goals.map(
                (
                  goal,
                  index,
                ) => (
                  <div
                    key={
                      goal.id
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      transition
                      hover:border-slate-300
                    "
                  >

                    <div className="flex items-start gap-4">

                      {/* NUMBER */}

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-lg
                          bg-teal-50
                          text-sm
                          font-semibold
                          text-teal-700
                        "
                      >
                        {index +
                          1}
                      </div>

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div
                          className="
                            flex
                            flex-wrap
                            items-start
                            justify-between
                            gap-3
                          "
                        >

                          <div
                            className="
                              flex
                              min-w-0
                              flex-wrap
                              items-center
                              gap-2
                            "
                          >

                            <p className="font-semibold text-slate-800">
                              {
                                goal.title
                              }
                            </p>

                            <span
                              className={`
                                rounded-full
                                px-2.5
                                py-1
                                text-xs
                                font-semibold
                                ${getGoalStatusClass(
                                  goal.status,
                                )}
                              `}
                            >
                              {label(
                                goal.status,
                              )}
                            </span>

                          </div>

                          {/* GOAL ACTIONS */}

                          <div
                            className="
                              flex
                              shrink-0
                              items-center
                              gap-2
                            "
                            onClick={(
                              event,
                            ) =>
                              event.stopPropagation()
                            }
                          >

                            <button
                              type="button"
                              onClick={() =>
                                openEditGoal(
                                  goal,
                                )
                              }
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

                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDeletingGoal(
                                  goal,
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

                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {
                            goal.description ??
                            "No description"
                          }
                        </p>

                        <p className="mt-2 text-xs text-slate-500">

                          <span className="font-semibold text-slate-600">
                            Target:
                          </span>{" "}

                          {
                            goal.target ??
                            "No target specified"
                          }

                        </p>

                      </div>

                    </div>

                  </div>
                ),
              )}

            </div>
          )}

        </section>

        {/* ====================================================
            COMPLETE REVIEW MODAL
        ==================================================== */}

        {completeModal && (
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
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                  gap-4
                "
              >

                <h2 className="text-lg font-semibold text-slate-900">
                  Complete Performance Review?
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setCompleteModal(
                      false,
                    )
                  }
                  className="
                    rounded-lg
                    p-2
                    text-slate-400
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Completing this review will finalize the performance evaluation.
              </p>

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
                  onClick={() =>
                    setCompleteModal(
                      false,
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
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    !!busy
                  }
                  onClick={() => {
                    setCompleteModal(
                      false,
                    );

                    void action(
                      "workflow",
                      () =>
                        updatePerformanceReview(
                          id,
                          {
                            status:
                              "COMPLETED",
                          },
                        ),
                    );
                  }}
                  className="
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
                  {busy ===
                  "workflow"
                    ? "Completing..."
                    : "Complete Review"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ====================================================
            EDIT GOAL MODAL
        ==================================================== */}

        {editingGoal && (
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
                max-w-2xl
                rounded-2xl
                bg-white
                p-6
                shadow-2xl
              "
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-goal-title"
            >

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
                    id="edit-goal-title"
                    className="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Edit Performance Goal
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update the goal details and status.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingGoal(
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
                  "
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

              <form
                onSubmit={
                  saveEditedGoal
                }
                className="mt-6"
              >

                <div
                  className="
                    grid
                    gap-4
                    md:grid-cols-2
                  "
                >

                  <label className="text-sm font-medium text-slate-700">

                    Goal title

                    <input
                      required
                      value={
                        editGoalTitle
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditGoalTitle(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        goalActionBusy
                      }
                      className="
                        mt-2
                        h-11
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        px-3
                        text-sm
                        font-normal
                        outline-none
                        transition
                        focus:border-teal-600
                        focus:ring-2
                        focus:ring-teal-600/20
                      "
                    />

                  </label>

                  <label className="text-sm font-medium text-slate-700">

                    Target

                    <input
                      value={
                        editGoalTarget
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditGoalTarget(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        goalActionBusy
                      }
                      className="
                        mt-2
                        h-11
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        px-3
                        text-sm
                        font-normal
                        outline-none
                        transition
                        focus:border-teal-600
                        focus:ring-2
                        focus:ring-teal-600/20
                      "
                    />

                  </label>

                  <label className="text-sm font-medium text-slate-700">

                    Description

                    <textarea
                      value={
                        editGoalDescription
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditGoalDescription(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        goalActionBusy
                      }
                      rows={4}
                      className="
                        mt-2
                        w-full
                        resize-none
                        rounded-lg
                        border
                        border-slate-300
                        px-3
                        py-2.5
                        text-sm
                        font-normal
                        outline-none
                        transition
                        focus:border-teal-600
                        focus:ring-2
                        focus:ring-teal-600/20
                      "
                    />

                  </label>

                  <label className="text-sm font-medium text-slate-700">

                    Goal status

                    <select
                      value={
                        editGoalStatus
                      }
                      onChange={(
                        event,
                      ) =>
                        setEditGoalStatus(
                          event.target
                            .value as GoalStatus,
                        )
                      }
                      disabled={
                        goalActionBusy
                      }
                      className="
                        mt-2
                        h-11
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        bg-white
                        px-3
                        text-sm
                        font-normal
                        outline-none
                        transition
                        focus:border-teal-600
                        focus:ring-2
                        focus:ring-teal-600/20
                      "
                    >

                      {goalStatuses.map(
                        (
                          option,
                        ) => (
                          <option
                            key={
                              option
                            }
                            value={
                              option
                            }
                          >
                            {label(
                              option,
                            )}
                          </option>
                        ),
                      )}

                    </select>

                  </label>

                </div>

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
                      goalActionBusy
                    }
                    onClick={() =>
                      setEditingGoal(
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
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      goalActionBusy
                    }
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
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >

                    <Edit
                      size={15}
                    />

                    {goalActionBusy
                      ? "Saving..."
                      : "Save Changes"}

                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* ====================================================
            DELETE GOAL MODAL
        ==================================================== */}

        {deletingGoal && (
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
              aria-labelledby="delete-goal-title"
            >

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
                    id="delete-goal-title"
                    className="
                      text-lg
                      font-semibold
                      text-slate-900
                    "
                  >
                    Delete Performance Goal?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-600">

                    Are you sure you want to delete{" "}

                    <span className="font-semibold text-slate-900">
                      {
                        deletingGoal.title
                      }
                    </span>

                    ?

                    <br />

                    This action cannot be undone.

                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDeletingGoal(
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
                  "
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

              </div>

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
                    goalActionBusy
                  }
                  onClick={() =>
                    setDeletingGoal(
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
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    goalActionBusy
                  }
                  onClick={() =>
                    void confirmDeleteGoal()
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

                  {goalActionBusy
                    ? "Deleting..."
                    : "Delete Goal"}

                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default PerformanceDetails;