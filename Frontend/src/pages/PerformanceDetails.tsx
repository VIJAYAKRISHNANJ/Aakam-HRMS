import {
  ArrowLeft,
  Check,
  Edit,
  Plus,
  Star,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

const formatDate = (value: string) =>
  new Date(
    `${
      value.length === 10
        ? `${value}T00:00:00Z`
        : value
    }`,
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );

const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );

function PerformanceDetails() {
  const { id } =
    useParams();

  const [review, setReview] =
    useState<PerformanceReview | null>(
      null,
    );

  const [goals, setGoals] =
    useState<PerformanceGoal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [busy, setBusy] =
    useState("");

  const [goalTitle, setGoalTitle] =
    useState("");

  const [
    goalDescription,
    setGoalDescription,
  ] = useState("");

  const [goalTarget, setGoalTarget] =
    useState("");

  const [
    goalStatus,
    setGoalStatus,
  ] =
    useState<GoalStatus>(
      "NOT_STARTED",
    );

  const [
    completeModal,
    setCompleteModal,
  ] = useState(false);

  const load = useCallback(
    async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError("");

        const [
          reviewData,
          goalData,
        ] = await Promise.all([
          getPerformanceReview(id),
          getPerformanceGoals(id),
        ]);

        setReview(reviewData);
        setGoals(goalData);
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
      window.clearTimeout(timer);
  }, [load]);

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

  const addGoal = async (
    event: React.FormEvent<HTMLFormElement>,
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

    await action(
      "goal",
      async () => {
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

        setGoalTitle("");
        setGoalDescription("");
        setGoalTarget("");
        setGoalStatus(
          "NOT_STARTED",
        );
      },
    );
  };

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

  if (!review || !id) {
    return null;
  }

  const status =
    review.status as PerformanceStatus;

  const currentStep =
    status === "COMPLETED"
      ? 2
      : status === "IN_REVIEW"
        ? 1
        : 0;

  return (
    <DashboardLayout>
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/performance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft size={16} />
            Back to performance
          </Link>

          {/* Edit is available for ALL statuses */}
          <Link
            to={`/performance/edit/${id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit size={16} />
            Edit
          </Link>
        </div>

        <PageHeader
          title={review.employeeName}
          subtitle={`${review.department} · Performance review`}
          icon={Star}
        />

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">
                Review information
              </h2>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  statusClasses[
                    status
                  ] ??
                  "bg-slate-100 text-slate-700"
                }`}
              >
                {statusLabels[
                  status
                ] ??
                  label(
                    review.status,
                  )}
              </span>
            </div>

            <dl className="mt-5 space-y-4 border-t border-slate-100 pt-5 text-sm">
              {[
                [
                  "Employee",
                  review.employeeName,
                ],

                [
                  "Employee code",
                  review.employeeCode ??
                    "-",
                ],

                [
                  "Department",
                  review.department,
                ],

                [
                  "Reviewer",
                  review.reviewerName ??
                    "-",
                ],

                [
                  "Review period",
                  `${formatDate(
                    review.reviewPeriodStart,
                  )} - ${formatDate(
                    review.reviewPeriodEnd,
                  )}`,
                ],

                [
                  "Created",
                  formatDate(
                    review.createdAt,
                  ),
                ],

                [
                  "Updated",
                  formatDate(
                    review.updatedAt,
                  ),
                ],
              ].map(
                ([term, value]) => (
                  <div
                    key={term}
                    className="flex justify-between gap-4"
                  >
                    <dt className="text-slate-500">
                      {term}
                    </dt>

                    <dd className="text-right font-medium text-slate-800">
                      {value}
                    </dd>
                  </div>
                ),
              )}
            </dl>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">
                Rating
              </p>

              <p className="mt-1 text-xl tracking-wide text-amber-500">
                {Array.from(
                  { length: 5 },
                  (_, index) =>
                    index <
                    (review.rating ??
                      0)
                      ? "★"
                      : "☆",
                ).join("")}{" "}

                <span className="ml-2 text-sm font-semibold text-slate-700">
                  {review.rating ??
                    "-"}{" "}
                  / 5
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">
              Review workflow
            </h2>

            <div className="mt-6 flex items-start">
              {[
                "DRAFT",
                "IN_REVIEW",
                "COMPLETED",
              ].map(
                (
                  step,
                  index,
                ) => (
                  <div
                    key={step}
                    className="flex flex-1 items-start"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold ${
                          index <=
                          currentStep
                            ? "border-teal-600 bg-teal-600 text-white"
                            : "border-slate-200 text-slate-400"
                        }`}
                      >
                        {index <
                        currentStep ? (
                          <Check
                            size={
                              16
                            }
                          />
                        ) : (
                          index +
                          1
                        )}
                      </div>

                      <span
                        className={`mt-2 text-center text-xs ${
                          index ===
                          currentStep
                            ? "font-semibold text-teal-700"
                            : "text-slate-500"
                        }`}
                      >
                        {
                          statusLabels[
                            step as PerformanceStatus
                          ]
                        }
                      </span>
                    </div>

                    {index <
                      2 && (
                      <div
                        className={`mt-5 h-0.5 flex-1 ${
                          index <
                          currentStep
                            ? "bg-teal-500"
                            : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ),
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
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
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
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
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Complete Review
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                Goals
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {goals.length} goal
                {goals.length === 1
                  ? ""
                  : "s"} linked to
                this review.
              </p>
            </div>
          </div>

          <form
            onSubmit={addGoal}
            className="mt-5 grid gap-3 md:grid-cols-2"
          >
            <input
              required
              value={goalTitle}
              onChange={(event) =>
                setGoalTitle(
                  event.target.value,
                )
              }
              placeholder="Goal title"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
            />

            <input
              value={goalTarget}
              onChange={(event) =>
                setGoalTarget(
                  event.target.value,
                )
              }
              placeholder="Target"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
            />

            <input
              value={goalDescription}
              onChange={(event) =>
                setGoalDescription(
                  event.target.value,
                )
              }
              placeholder="Description"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-teal-600"
            />

            <button
              disabled={
                busy === "goal"
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus size={16} />

              {busy === "goal"
                ? "Adding..."
                : "Add Goal"}
            </button>
          </form>

          {goals.length ===
          0 ? (
            <p className="mt-6 rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
              No goals added yet.
            </p>
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {goals.map(
                (goal) => (
                  <div
                    key={goal.id}
                    className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">
                        {goal.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {goal.description ??
                          "No description"}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Target:{" "}
                        {goal.target ??
                          "-"}{" "}
                        · Created{" "}
                        {formatDate(
                          goal.createdAt,
                        )}
                      </p>
                    </div>

                    <select
                      value={
                        goal.status
                      }
                      disabled={
                        busy ===
                        `goal-${goal.id}`
                      }
                      onChange={(
                        event,
                      ) =>
                        void action(
                          `goal-${goal.id}`,
                          () =>
                            updatePerformanceGoal(
                              id,
                              goal.id,
                              {
                                status:
                                  event
                                    .target
                                    .value as GoalStatus,
                              },
                            ),
                        )
                      }
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${
                        goal.status ===
                        "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : goal.status ===
                              "IN_PROGRESS"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {goalStatuses.map(
                        (
                          goalStatus,
                        ) => (
                          <option
                            key={
                              goalStatus
                            }
                            value={
                              goalStatus
                            }
                          >
                            {label(
                              goalStatus,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {completeModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
            role="presentation"
          >
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Complete Performance
                  Review?
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setCompleteModal(
                      false,
                    )
                  }
                  aria-label="Close"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                Completing this review
                will finalize the
                performance evaluation.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCompleteModal(
                      false,
                    )
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
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
                  className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
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
      </div>
    </DashboardLayout>
  );
}

export default PerformanceDetails;