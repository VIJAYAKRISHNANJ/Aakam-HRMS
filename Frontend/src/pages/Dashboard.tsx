import { useEffect, useState } from 'react'

import {
  BriefcaseBusiness,
  CalendarClock,
  TrendingUp,
  Users,
} from 'lucide-react'

import AttendanceCard from '../components/dashboard/AttendanceCard'
import DepartmentChart from '../components/dashboard/DepartmentChart'
import HeadcountChart from '../components/dashboard/HeadcountChart'
import RecentActivity from '../components/dashboard/RecentActivity'
import StatCard from '../components/dashboard/StatCard'
import DashboardLayout from '../components/layout/DashboardLayout'

import {
  getActivityData,
  getAttendanceData,
  getDashboardInsights,
  getDashboardSummary,
  getDepartmentData,
  getHeadcountData,
  type ActivityPoint,
  type AttendanceData,
  type DashboardInsights,
  type DashboardSummary,
  type DepartmentPoint,
  type HeadcountPoint,
} from '../services/dashboardService'

const departmentColors = [
  '#2563eb',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
]

function Dashboard() {
  const [summary, setSummary] =
    useState<DashboardSummary | null>(null)

  const [headcountData, setHeadcountData] =
    useState<HeadcountPoint[]>([])

  const [departmentData, setDepartmentData] =
    useState<DepartmentPoint[]>([])

  const [attendanceData, setAttendanceData] =
    useState<AttendanceData | null>(null)

  const [activityData, setActivityData] =
    useState<ActivityPoint[]>([])

  const [dashboardInsights, setDashboardInsights] =
    useState<DashboardInsights | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  /* =========================================================
     LOAD DASHBOARD DATA
  ========================================================= */

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          summaryData,
          headcount,
          departments,
          attendance,
          activities,
          insights,
        ] = await Promise.all([
          getDashboardSummary(),
          getHeadcountData(),
          getDepartmentData(),
          getAttendanceData(),
          getActivityData(),
          getDashboardInsights(),
        ])

        setSummary(summaryData)
        setHeadcountData(headcount)
        setDepartmentData(departments)
        setAttendanceData(attendance)
        setActivityData(activities)
        setDashboardInsights(insights)
      } catch (error) {
        console.error(
          'Failed to load dashboard:',
          error,
        )

        setError(
          'Unable to load dashboard data. Please make sure the backend is running.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  /* =========================================================
     STAT CARDS
  ========================================================= */

  const stats = [
    {
      title: 'Total Employees',

      value: loading
        ? '...'
        : String(
            summary?.totalEmployees ?? 0,
          ),

      change: '+12.6%',

      changeType:
        'increase' as const,

      icon: Users,

      iconClassName:
        'bg-blue-50 text-blue-600',
    },

    {
      title: 'New Joiners',

      value: loading
        ? '...'
        : String(
            summary?.newJoiners ?? 0,
          ),

      change: '+4.2%',

      changeType:
        'increase' as const,

      icon: TrendingUp,

      iconClassName:
        'bg-emerald-50 text-emerald-600',
    },

    {
      title: 'Open Positions',

      value: loading
        ? '...'
        : String(
            summary?.openPositions ?? 0,
          ),

      change: '-2.1%',

      changeType:
        'decrease' as const,

      icon: BriefcaseBusiness,

      iconClassName:
        'bg-violet-50 text-violet-600',
    },

    {
      title: 'Pending Leave',

      value: loading
        ? '...'
        : String(
            summary?.pendingLeave ?? 0,
          ),

      change: '+1.8%',

      changeType:
        'increase' as const,

      icon: CalendarClock,

      iconClassName:
        'bg-amber-50 text-amber-600',
    },
  ]

  /* =========================================================
     DEPARTMENT CHART
  ========================================================= */

  const departmentChartData =
    departmentData.map(
      (item, index) => ({
        name: item.name,

        value: item.value,

        color:
          departmentColors[
            index %
              departmentColors.length
          ],
      }),
    )

  /* =========================================================
     UPCOMING ACTIONS
     
     NOW COMING DIRECTLY FROM BACKEND
  ========================================================= */

  const upcomingActions =
    dashboardInsights?.actions?.slice(0, 5) ?? []

  return (
    <DashboardLayout>

      {/* =====================================================
          DASHBOARD PAGE
      ===================================================== */}

      <section className="min-w-0 max-w-full space-y-6">

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            HR OVERVIEW
        =================================================== */}

        <div className="ml-2 flex min-w-0 flex-col gap-1">

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            HR Overview
          </h1>

          <p className="text-sm text-slate-500">
            A clear view of your people, attendance,
            recruitment, and daily HR activity.
          </p>

        </div>

        {/* ===================================================
            STAT CARDS
        =================================================== */}

        <div className="grid min-w-0 max-w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              {...stat}
            />
          ))}

        </div>

        {/* ===================================================
            HEADCOUNT + DEPARTMENT
        =================================================== */}

        <div className="grid min-w-0 max-w-full items-stretch gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

          <div className="min-w-0">
            <HeadcountChart
              data={headcountData}
            />
          </div>

          <div className="min-w-0">
            <DepartmentChart
              data={departmentChartData}
            />
          </div>

        </div>

        {/* ===================================================
            ATTENDANCE / QUICK INSIGHTS / UPCOMING ACTIONS
        =================================================== */}

        <div className="grid min-w-0 max-w-full items-stretch gap-6 xl:grid-cols-3">

          {/* =================================================
              ATTENDANCE
          ================================================= */}

          <div className="min-w-0">

            <AttendanceCard
              attendanceRate={
                attendanceData?.attendanceRate ??
                0
              }

              total={
                attendanceData?.total ??
                0
              }

              present={
                attendanceData?.present ??
                0
              }

              absent={
                attendanceData?.absent ??
                0
              }

              onTime={
                attendanceData?.onTime ??
                0
              }

              late={
                attendanceData?.late ??
                0
              }
            />

          </div>

          {/* =================================================
              QUICK INSIGHTS
          ================================================= */}

          <article className="dashboard-card flex min-w-0 h-full flex-col p-5 sm:p-6">

            <div className="min-w-0">

              <p className="text-lg font-semibold text-slate-950">
                Quick Insights
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Operational updates from across
                the HR function
              </p>

            </div>

            <div className="mt-6 flex min-w-0 flex-1 flex-col gap-3">

              {dashboardInsights?.insights?.map(
                (item, index) => {

                  const iconStyles = [
                    'bg-blue-50 text-blue-600',
                    'bg-emerald-50 text-emerald-600',
                    'bg-violet-50 text-violet-600',
                  ]

                  return (
                    <div
                      key={item.title}
                      className="
                        flex
                        min-w-0
                        min-h-[104px]
                        flex-1
                        items-center
                        gap-4
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-4
                        transition
                        duration-200
                        hover:border-slate-300
                        hover:shadow-sm
                      "
                    >

                      <div
                        className={`
                          flex
                          h-12
                          w-12
                          shrink-0
                          items-center
                          justify-center
                          rounded-2xl
                          ${
                            iconStyles[
                              index %
                                iconStyles.length
                            ]
                          }
                        `}
                      >

                        {index === 0 && (
                          <Users size={22} />
                        )}

                        {index === 1 && (
                          <Users size={22} />
                        )}

                        {index === 2 && (
                          <BriefcaseBusiness
                            size={22}
                          />
                        )}

                      </div>

                      <div className="min-w-0">

                        <p className="text-sm font-bold leading-5 text-slate-950">
                          {item.title}
                        </p>

                        <p className="mt-2 text-sm font-medium leading-5 text-slate-700">
                          {item.value}
                        </p>

                        <p className="mt-1 text-sm leading-5 text-slate-500">
                          {item.detail}
                        </p>

                      </div>

                    </div>
                  )
                },
              )}

            </div>

          </article>

          {/* =================================================
              UPCOMING ACTIONS
              
              ALL 5 FROM BACKEND
          ================================================= */}

          <article className="dashboard-card flex min-w-0 h-full flex-col p-5 sm:p-6">

            {/* HEADER */}

            <div className="flex min-w-0 items-start justify-between gap-4">

              <div className="min-w-0">

                <p className="text-lg font-semibold text-slate-950">
                  Upcoming Actions
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Priority items based on current
                  HR data
                </p>

              </div>

              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {upcomingActions.length} tasks
              </span>

            </div>

            {/* ACTION LIST */}

            <div className="mt-6 flex min-w-0 flex-1 flex-col gap-3">

              {upcomingActions.map(
                (action, index) => (
                  <div
                    key={`${action.title}-${index}`}
                    className="
                      flex
                      min-w-0
                      min-h-[74px]
                      items-center
                      gap-3
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      px-3
                      py-3
                      transition
                      duration-200
                      hover:border-slate-300
                      hover:shadow-sm
                    "
                  >

                    {/* NUMBER */}

                    <span
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-950
                        text-sm
                        font-semibold
                        text-white
                      "
                    >
                      {String(
                        index + 1,
                      ).padStart(2, '0')}
                    </span>

                    {/* TEXT */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-semibold leading-5 text-slate-800">
                        {action.title}
                      </p>

                      <p className="mt-1 truncate text-xs leading-5 text-slate-500">
                        {action.description}
                      </p>

                    </div>

                    {/* COUNT */}

                    <span
                      className="
                        flex
                        h-7
                        min-w-7
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-50
                        px-2
                        text-xs
                        font-semibold
                        text-blue-600
                      "
                    >
                      {action.count}
                    </span>

                  </div>
                ),
              )}

            </div>

          </article>

        </div>

        {/* ===================================================
            RECENT HR ACTIVITY
        =================================================== */}

        <div className="min-w-0 max-w-full">

          <RecentActivity
            data={activityData}
            loading={loading}
          />

        </div>

      </section>

    </DashboardLayout>
  )
}

export default Dashboard