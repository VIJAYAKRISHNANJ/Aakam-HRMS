interface DepartmentItem {
  name: string
  value: number
  color: string
}

interface DepartmentChartProps {
  data: DepartmentItem[]
}

function DepartmentChart({ data }: DepartmentChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const segments = data.reduce<string[]>(
    (result, item, index) => {
      const previousTotal = data
        .slice(0, index)
        .reduce((sum, current) => sum + current.value, 0)
      const start = (previousTotal / total) * 100
      const end = ((previousTotal + item.value) / total) * 100
      result.push(`${item.color} ${start}% ${end}%`)
      return result
    },
    [],
  )

  return (
    <article className="dashboard-card p-5 sm:p-6">
      <div>
        <p className="text-lg font-semibold text-slate-950">Department Distribution</p>
        <p className="mt-1 text-sm text-slate-500">
          Employee split across active business units
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="relative h-56 w-56 rounded-full"
          style={{
            background: `conic-gradient(${segments.join(', ')})`,
          }}
        >
          <div className="absolute inset-[22px] flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-sm font-medium text-slate-500">Total</span>
            <span className="mt-1 text-3xl font-semibold text-slate-950">{total}</span>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              employees
            </span>
          </div>
        </div>

        <div className="w-full space-y-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {Math.round((item.value / total) * 100)}% of workforce
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export default DepartmentChart
