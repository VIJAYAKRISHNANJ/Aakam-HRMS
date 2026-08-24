import type { LucideIcon } from 'lucide-react'
import { MoveDownRight, MoveUpRight } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: LucideIcon
  iconClassName: string
}

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconClassName,
}: StatCardProps) {
  const positive = changeType === 'increase'
  const TrendIcon = positive ? MoveUpRight : MoveDownRight

  return (
    <article className="dashboard-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 text-sm">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
            positive
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-600'
          }`}
        >
          <TrendIcon className="h-3.5 w-3.5" />
          {change}
        </span>
        <span className="text-slate-400">vs last month</span>
      </div>
    </article>
  )
}

export default StatCard
