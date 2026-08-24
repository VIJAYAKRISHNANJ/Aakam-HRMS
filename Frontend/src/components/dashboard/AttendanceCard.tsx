interface AttendanceCardProps {
  attendanceRate: number
  total: number
  present: number
  absent: number
  onTime: number
  late: number
}

function AttendanceCard({
  attendanceRate,
  total,
  present,
  absent,
  onTime,
  late,
}: AttendanceCardProps) {
  const presentPercentage =
    total > 0 ? (present / total) * 100 : 0

  const absentPercentage =
    total > 0 ? (absent / total) * 100 : 0

  const onTimePercentage =
    present > 0 ? (onTime / present) * 100 : 0

  const latePercentage =
    present > 0 ? (late / present) * 100 : 0

  return (
    <article className="dashboard-card p-5 sm:p-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950">
            Attendance Today
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Live attendance status
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
          Live
        </span>
      </div>

      {/* Main Attendance */}
      <div className="mt-5">
        <p className="text-4xl font-semibold tracking-tight text-slate-950">
          {attendanceRate}%
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {present} of {total} employees present
        </p>
      </div>

      {/* Main Progress Bar */}
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{
            width: `${presentPercentage}%`,
          }}
        />
      </div>

      {/* Present / Absent */}
      <div className="mt-5 grid grid-cols-2 gap-3">

        {/* Present */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <p className="text-xs font-medium text-slate-500">
              Present
            </p>
          </div>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {present}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {Math.round(presentPercentage)}% of total
          </p>
        </div>

        {/* Absent */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

            <p className="text-xs font-medium text-slate-500">
              Absent
            </p>
          </div>

          <p className="mt-2 text-xl font-semibold text-slate-950">
            {absent}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {Math.round(absentPercentage)}% of total
          </p>
        </div>

      </div>

      {/* Today's Breakdown */}
      <div className="mt-5 border-t border-slate-100 pt-5">

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Today's Breakdown
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Attendance timing for employees present
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {present} Present
          </span>
        </div>

        {/* On Time */}
        <div className="mt-4">

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

              <span className="font-medium text-slate-600">
                On Time
              </span>
            </div>

            <span className="font-semibold text-slate-900">
              {onTime}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${onTimePercentage}%`,
              }}
            />
          </div>

          <p className="mt-1 text-right text-[10px] text-slate-400">
            {Math.round(onTimePercentage)}% of present employees
          </p>

        </div>

        {/* Late */}
        <div className="mt-4">

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

              <span className="font-medium text-slate-600">
                Late
              </span>
            </div>

            <span className="font-semibold text-slate-900">
              {late}
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{
                width: `${latePercentage}%`,
              }}
            />
          </div>

          <p className="mt-1 text-right text-[10px] text-slate-400">
            {Math.round(latePercentage)}% of present employees
          </p>

        </div>

      </div>

    </article>
  )
}

export default AttendanceCard