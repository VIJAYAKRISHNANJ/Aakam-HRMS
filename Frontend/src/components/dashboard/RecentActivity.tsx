import {
  CalendarClock,
  UserRoundPlus,
  Users,
  WalletCards,
  ClipboardList,
} from 'lucide-react'

import type { ActivityPoint } from '../../services/dashboardService'

interface RecentActivityProps {
  data: ActivityPoint[]
  loading: boolean
}

function RecentActivity({
  data,
  loading,
}: RecentActivityProps) {
  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <article className="dashboard-card min-w-0 p-5 sm:p-6">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-lg font-semibold text-slate-950">
              Recent HR Activity
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Latest activity across your HR operations
            </p>
          </div>

        </div>

        <div className="mt-5 grid min-w-0 gap-x-8 lg:grid-cols-2">

          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-0 items-center gap-4 border-b border-slate-100 py-5"
            >

              <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-slate-100" />

              <div className="min-w-0 flex-1">

                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />

                <div className="mt-2 h-3 w-56 max-w-full animate-pulse rounded bg-slate-100" />

              </div>

              <div className="hidden shrink-0 sm:block">

                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />

                <div className="mt-2 h-3 w-12 animate-pulse rounded bg-slate-100" />

              </div>

            </div>
          ))}

        </div>

      </article>
    )
  }

  /* =========================================================
     ONLY 6 ACTIVITIES
  ========================================================= */

  const recentActivities =
    data.slice(0, 6)

  return (
    <article className="dashboard-card min-w-0 p-5 sm:p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex min-w-0 items-center justify-between gap-4">

        <div className="min-w-0">

          <p className="text-lg font-semibold text-slate-950">
            Recent HR Activity
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Latest activity across your HR operations
          </p>

        </div>

        <button
          type="button"
          className="shrink-0 text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          View All
        </button>

      </div>

      {/* =====================================================
          6 ACTIVITIES
          2 COLUMNS
      ===================================================== */}

      {recentActivities.length > 0 ? (
        <div className="mt-5 grid min-w-0 grid-cols-1 gap-x-8 lg:grid-cols-2">

          {recentActivities.map(
            (activity, index) => {
              const date =
                new Date(
                  activity.activityTime,
                )

              return (
                <div
                  key={`${activity.activityType}-${activity.activityTime}-${index}`}
                  className="flex min-w-0 items-center gap-4 border-b border-slate-100 py-5"
                >

                  {/* =================================================
                      ICON
                  ================================================= */}

                  <div
                    className={`
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-2xl

                      ${
                        activity.activityType ===
                        'LEAVE'
                          ? 'bg-orange-50 text-orange-500'
                          : activity.activityType ===
                              'CANDIDATE'
                            ? 'bg-blue-50 text-blue-600'
                            : activity.activityType ===
                                'PAYROLL'
                              ? 'bg-violet-50 text-violet-600'
                              : 'bg-emerald-50 text-emerald-600'
                      }
                    `}
                  >

                    {activity.activityType ===
                      'LEAVE' && (
                      <CalendarClock
                        size={19}
                        strokeWidth={1.9}
                      />
                    )}

                    {activity.activityType ===
                      'CANDIDATE' && (
                      <UserRoundPlus
                        size={19}
                        strokeWidth={1.9}
                      />
                    )}

                    {activity.activityType ===
                      'PAYROLL' && (
                      <WalletCards
                        size={19}
                        strokeWidth={1.9}
                      />
                    )}

                    {activity.activityType !==
                      'LEAVE' &&
                      activity.activityType !==
                        'CANDIDATE' &&
                      activity.activityType !==
                        'PAYROLL' && (
                        <Users
                          size={19}
                          strokeWidth={1.9}
                        />
                      )}

                  </div>

                  {/* =================================================
                      TITLE + DESCRIPTION
                  ================================================= */}

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-semibold leading-5 text-slate-950">
                      {activity.title}
                    </p>

                    <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                      {activity.description}
                    </p>

                  </div>

                  {/* =================================================
                      DATE + TIME
                  ================================================= */}

                  <div className="hidden shrink-0 text-right sm:block">

                    <p className="text-xs font-medium text-slate-500">
                      {date.toLocaleDateString(
                        'en-IN',
                        {
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {date.toLocaleTimeString(
                        'en-IN',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </p>

                  </div>

                </div>
              )
            },
          )}

        </div>
      ) : (
        /* =====================================================
           EMPTY STATE
        ===================================================== */

        <div className="mt-5 flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">

          <div className="text-center">

            <ClipboardList
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              No recent HR activity
            </p>

            <p className="mt-1 text-xs text-slate-400">
              New HR activities will appear here.
            </p>

          </div>

        </div>
      )}

    </article>
  )
}

export default RecentActivity