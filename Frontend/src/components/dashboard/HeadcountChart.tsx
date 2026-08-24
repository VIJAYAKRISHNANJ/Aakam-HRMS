interface HeadcountPoint {
  month: string
  total: number
}

interface HeadcountChartProps {
  data: HeadcountPoint[]
}

function HeadcountChart({
  data,
}: HeadcountChartProps) {
  const safeData = data
    .map((item) => ({
      month: item.month,
      total: Number(item.total),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.total),
    )

  const maxDataValue =
    safeData.length > 0
      ? Math.max(
          ...safeData.map(
            (item) => item.total,
          ),
        )
      : 0

  const maxValue =
    maxDataValue > 0
      ? maxDataValue
      : 10

  const ticks = [
    maxValue,
    Math.round(maxValue * 0.75),
    Math.round(maxValue * 0.5),
    Math.round(maxValue * 0.25),
    0,
  ]

  return (
    <article className="dashboard-card min-w-0 max-w-full overflow-hidden p-5 sm:p-6">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="min-w-0">

          <p className="text-lg font-semibold text-slate-950">
            Employee Headcount Growth
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Total employee trend across the selected period
          </p>

        </div>

        <div className="shrink-0 rounded-2xl bg-blue-50 px-4 py-3 text-right">

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-500">
            YTD Growth
          </p>

          <p className="mt-1 text-xl font-semibold text-blue-700">
            +18.4%
          </p>

        </div>

      </div>

      {/* =====================================================
          CHART
      ===================================================== */}

      <div className="mt-8 grid h-[260px] min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-4">

        {/* ===================================================
            Y AXIS
        =================================================== */}

        <div className="flex h-full flex-col justify-between pb-8 text-xs font-medium text-slate-400">

          {ticks.map(
            (tick, index) => (
              <span
                key={`tick-${index}`}
              >
                {tick}
              </span>
            ),
          )}

        </div>

        {/* ===================================================
            ONLY THIS AREA CAN SCROLL HORIZONTALLY
        =================================================== */}

        <div className="relative min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-2">

          <div
            className="relative h-full"
            style={{
              minWidth:
                safeData.length > 8
                  ? '900px'
                  : '100%',
            }}
          >

            {/* GRID */}

            <div className="pointer-events-none absolute inset-0 grid grid-rows-4">

              {[0, 1, 2, 3].map(
                (line) => (
                  <div
                    key={line}
                    className="border-b border-dashed border-slate-200"
                  />
                ),
              )}

            </div>

            {/* =================================================
                BARS
            ================================================= */}

            {safeData.length === 0 ? (

              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading headcount data...
              </div>

            ) : (

              <div className="relative flex h-full items-end gap-5 pt-4">

                {safeData.map(
                  (item) => {

                    const height =
                      `${Math.max(
                        (item.total /
                          maxValue) *
                          100,
                        12,
                      )}%`

                    return (
                      <div
                        key={item.month}
                        className="flex h-full min-w-[65px] flex-1 flex-col justify-end gap-3"
                      >

                        {/* BAR */}

                        <div className="group relative flex h-full items-end justify-center">

                          <div
                            className="relative w-full rounded-t-[22px] bg-gradient-to-b from-cyan-400 via-blue-500 to-slate-900 transition-all duration-300 group-hover:scale-[1.02]"
                            style={{
                              height,
                            }}
                          >

                            {/* TOOLTIP */}

                            <div className="pointer-events-none absolute left-1/2 top-3 z-50 -translate-x-1/2 rounded-xl bg-slate-950/95 px-3 py-2 text-center opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100">

                              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                                Employees
                              </p>

                              <p className="mt-0.5 text-base font-bold text-white">
                                {item.total}
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* MONTH */}

                        <span className="text-center text-xs font-medium text-slate-500">
                          {item.month}
                        </span>

                      </div>
                    )
                  },
                )}

              </div>

            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          SCROLL HINT
      ===================================================== */}

      {safeData.length > 8 && (
        <p className="mt-2 text-center text-xs text-slate-400">
          ← Swipe or scroll horizontally to view more months →
        </p>
      )}

    </article>
  )
}

export default HeadcountChart