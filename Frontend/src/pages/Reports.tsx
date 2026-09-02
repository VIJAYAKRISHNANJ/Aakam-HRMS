import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  Clock3,
  GraduationCap,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { PageHeader, StateMessage } from "../components/recruitment/RecruitmentComponents";
import { getDepartments, type Department } from "../services/departmentService";
import {
  getOnboardingReport,
  getPayrollReport,
  getPerformanceReport,
  getRecruitmentReport,
  getReportsErrorMessage,
  getTrainingReport,
  getWorkforceReport,
  type OnboardingReport,
  type PayrollReport,
  type PerformanceReport,
  type RecruitmentReport,
  type TrainingReport,
  type WorkforceReport,
} from "../services/reportsService";

interface ReportData {
  workforce: WorkforceReport;
  recruitment: RecruitmentReport;
  onboarding: OnboardingReport;
  payroll: PayrollReport;
  performance: PerformanceReport;
  training: TrainingReport;
}

const format = (value: string) => value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const formatDate = (value: string) => new Date(`${value.length === 10 ? `${value}T00:00:00Z` : value}`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function Metric({ label, value, icon: Icon, tone = "teal" }: { label: string; value: number | string; icon: LucideIcon; tone?: "teal" | "blue" | "amber" | "emerald" }) {
  const tones = { teal: "bg-teal-50 text-teal-700", blue: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700" };
  return <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon size={18} /></span></div><p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p></div>;
}

function BarList({ items, labelKey, valueKey, color = "bg-teal-600" }: { items: Record<string, string | number>[]; labelKey: string; valueKey: string; color?: string }) {
  const values = items.map((item) => Number(item[valueKey])).filter(Number.isFinite);
  const max = Math.max(...values, 1);
  if (!items.length) return <p className="rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No data available for this view.</p>;
  return <div className="space-y-4">{items.map((item, index) => { const value = Number(item[valueKey]); return <div key={`${String(item[labelKey])}-${index}`}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{String(item[labelKey])}</span><span className="font-semibold text-slate-800">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((value / max) * 100, value > 0 ? 5 : 0)}%` }} /></div></div>; })}</div>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>{children}</section>;
}

function Reports() {
  const [data, setData] = useState<ReportData | null>(null); const [departments, setDepartments] = useState<Department[]>([]); const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [departmentId, setDepartmentId] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { const load = async () => { if (startDate && endDate && endDate < startDate) { setError("The end date cannot be before the start date."); setLoading(false); return; } try { setLoading(true); setError(""); const filters = { startDate, endDate, departmentId }; const [workforce, recruitment, onboarding, payroll, performance, training, departmentData] = await Promise.all([getWorkforceReport(filters), getRecruitmentReport(filters), getOnboardingReport(filters), getPayrollReport(filters), getPerformanceReport(filters), getTrainingReport(filters), getDepartments()]); setData({ workforce, recruitment, onboarding, payroll, performance, training }); setDepartments(departmentData); } catch (requestError) { setError(getReportsErrorMessage(requestError, "Unable to load reports.")); } finally { setLoading(false); } }; const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [startDate, endDate, departmentId]);
  const onboardingItems = useMemo(() => data ? [["Initiated", data.onboarding.initiated], ["Documents Pending", data.onboarding.documentsPending], ["Verification Pending", data.onboarding.verificationPending], ["Ready To Join", data.onboarding.readyToJoin], ["Joined", data.onboarding.joined], ["In Progress", data.onboarding.inProgress], ["Completed", data.onboarding.completed], ["Cancelled", data.onboarding.cancelled]].map(([name, total]) => ({ name, total })) : [], [data]);
  return <DashboardLayout><div className="flex min-w-0 flex-col gap-6"><PageHeader title="Reports" subtitle="Analyze workforce, recruitment, onboarding, payroll, performance and training data." icon={BarChart3} /><section className="rounded-xl border border-slate-200 bg-white p-4"><div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarRange size={17} className="text-teal-700" />Report filters</div><div className="grid gap-3 md:grid-cols-3"><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-700 outline-none focus:border-teal-600" /></label><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-700 outline-none focus:border-teal-600" /></label><label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Department<select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-teal-600"><option value="">All departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label></div><p className="mt-3 text-xs text-slate-400">Date filters use each report's supported date field. Company and branch employee counts are unavailable in the current database relationship.</p></section>{loading ? <StateMessage type="loading">Loading reports...</StateMessage> : error ? <StateMessage type="error">{error}</StateMessage> : !data ? <StateMessage type="empty">No report data available.</StateMessage> : <div className="space-y-6"><section><div className="mb-4 flex items-center gap-2"><Users size={19} className="text-teal-700" /><h2 className="text-lg font-semibold text-slate-900">Workforce</h2></div><div className="grid gap-4 sm:grid-cols-3"><Metric label="Total employees" value={data.workforce.totals.totalEmployees} icon={Users} /><Metric label="Active employees" value={data.workforce.totals.activeEmployees} icon={CheckCircle2} tone="emerald" /><Metric label="Inactive employees" value={data.workforce.totals.inactiveEmployees} icon={Clock3} tone="amber" /></div><div className="mt-4 grid gap-6 lg:grid-cols-3"><Panel title="Department distribution"><BarList items={data.workforce.byDepartment.map((item) => ({ name: item.name, total: item.employeeCount }))} labelKey="name" valueKey="total" /></Panel><Panel title="Company directory" subtitle="Employee counts are not available for companies."><BarList items={data.workforce.byCompany.map((item) => ({ name: item.name, total: item.employeeCount ?? 0 }))} labelKey="name" valueKey="total" color="bg-sky-600" /></Panel><Panel title="Branch directory" subtitle="Employee counts are not available for branches."><BarList items={data.workforce.byBranch.map((item) => ({ name: item.name, total: item.employeeCount ?? 0 }))} labelKey="name" valueKey="total" color="bg-indigo-600" /></Panel></div></section>
    <section><div className="mb-4 flex items-center gap-2"><Users size={19} className="text-sky-700" /><h2 className="text-lg font-semibold text-slate-900">Recruitment</h2></div><div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6"><Metric label="Total positions" value={data.recruitment.positions.total} icon={BookOpen} /><Metric label="Open positions" value={data.recruitment.positions.open} icon={BookOpen} tone="emerald" /><Metric label="Closed positions" value={data.recruitment.positions.closed} icon={BookOpen} tone="amber" /><Metric label="Candidates" value={data.recruitment.candidates.total} icon={Users} /><Metric label="Hired" value={data.recruitment.candidates.hired} icon={CheckCircle2} tone="emerald" /><Metric label="Rejected" value={data.recruitment.candidates.rejected} icon={CircleAlert} tone="amber" /></div><div className="mt-4"><Panel title="Recruitment stage distribution"><BarList items={data.recruitment.candidates.byStage.map((item) => ({ name: format(item.stage), total: item.total }))} labelKey="name" valueKey="total" color="bg-sky-600" /></Panel></div></section>
    <section><div className="mb-4 flex items-center gap-2"><Clock3 size={19} className="text-amber-700" /><h2 className="text-lg font-semibold text-slate-900">Onboarding</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total onboardings" value={data.onboarding.total} icon={Users} /><Metric label="Completed" value={data.onboarding.completed} icon={CheckCircle2} tone="emerald" /><Metric label="In progress" value={data.onboarding.inProgress} icon={Clock3} tone="amber" /><Metric label="Cancelled" value={data.onboarding.cancelled} icon={CircleAlert} tone="blue" /></div><div className="mt-4"><Panel title="Onboarding status distribution"><BarList items={onboardingItems} labelKey="name" valueKey="total" color="bg-amber-500" /></Panel></div></section>
    <section><div className="mb-4 flex items-center gap-2"><Building2 size={19} className="text-teal-700" /><h2 className="text-lg font-semibold text-slate-900">Payroll</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Total payroll runs" value={data.payroll.total} icon={Building2} /><Metric label="Pending" value={data.payroll.pending} icon={Clock3} tone="amber" /><Metric label="Processing" value={data.payroll.processing} icon={Clock3} tone="blue" /><Metric label="Completed" value={data.payroll.completed} icon={CheckCircle2} tone="emerald" /></div><div className="mt-4 grid gap-6 lg:grid-cols-2"><Panel title="Monthly payroll trend"><BarList items={data.payroll.byMonth.map((item) => ({ name: formatDate(item.month), total: item.total }))} labelKey="name" valueKey="total" color="bg-teal-600" /></Panel><Panel title="Approval statistics"><div className="grid gap-4 sm:grid-cols-2"><Metric label="Pending approvals" value={data.payroll.approvals.pending} icon={Clock3} tone="amber" /><Metric label="Average per run" value={data.payroll.approvals.averagePendingPerRun.toFixed(1)} icon={BarChart3} tone="blue" /></div></Panel></div></section>
    <section><div className="mb-4 flex items-center gap-2"><BarChart3 size={19} className="text-violet-700" /><h2 className="text-lg font-semibold text-slate-900">Performance</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Total reviews" value={data.performance.total} icon={Users} /><Metric label="Draft" value={data.performance.draft} icon={FileIcon} /><Metric label="In review" value={data.performance.inReview} icon={Clock3} tone="amber" /><Metric label="Completed" value={data.performance.completed} icon={CheckCircle2} tone="emerald" /><Metric label="Average rating" value={`${data.performance.averageRating.toFixed(1)} / 5`} icon={StarIcon} tone="blue" /></div><div className="mt-4 grid gap-6 lg:grid-cols-2"><Panel title="Rating distribution"><BarList items={data.performance.ratingDistribution.map((item) => ({ name: `${item.rating} / 5`, total: item.total }))} labelKey="name" valueKey="total" color="bg-violet-600" /></Panel><Panel title="Department performance"><BarList items={data.performance.byDepartment.map((item) => ({ name: item.name, total: item.total }))} labelKey="name" valueKey="total" color="bg-indigo-600" /></Panel></div></section>
    <section><div className="mb-4 flex items-center gap-2"><GraduationCap size={19} className="text-emerald-700" /><h2 className="text-lg font-semibold text-slate-900">Training</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Total programs" value={data.training.programs.total} icon={BookOpen} /><Metric label="Active programs" value={data.training.programs.active} icon={CheckCircle2} tone="emerald" /><Metric label="Inactive programs" value={data.training.programs.inactive} icon={Clock3} tone="amber" /><Metric label="Enrollments" value={data.training.enrollments.total} icon={Users} tone="blue" /><Metric label="Completed enrollments" value={data.training.enrollments.completed} icon={GraduationCap} tone="emerald" /></div><div className="mt-4 grid gap-6 lg:grid-cols-3"><Panel title="Training categories"><BarList items={data.training.programs.byCategory.map((item) => ({ name: item.category, total: item.total }))} labelKey="name" valueKey="total" color="bg-emerald-600" /></Panel><Panel title="Completion statistics"><div className="text-center"><p className="text-5xl font-semibold text-emerald-700">{data.training.enrollments.completionRate}%</p><p className="mt-2 text-sm text-slate-500">Enrollment completion rate</p></div></Panel><Panel title="Assessment pass / fail"><BarList items={[{ name: "Pass", total: data.training.assessmentResults.pass }, { name: "Fail", total: data.training.assessmentResults.fail }]} labelKey="name" valueKey="total" color="bg-emerald-600" /></Panel></div></section></div>}</div></DashboardLayout>;
}

const FileIcon = BookOpen;
const StarIcon = GraduationCap;
export default Reports;