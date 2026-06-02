import Link from "next/link";
import { DashboardYearSelector } from "@/components/dashboard-year-selector";
import { HiddenValue, ValueVisibilityButton } from "@/components/value-visibility";
import {
  getAvailableDashboardYears,
  getDashboard,
  getPendingSummary,
} from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const availableYears = await getAvailableDashboardYears();
  const currentYear = new Date().getFullYear();
  const yearOptions = availableYears.length ? availableYears : [currentYear];
  const fallbackYear = yearOptions[0];
  const year = normalizeYear(params?.year, yearOptions, fallbackYear);
  const dashboard = await getDashboard(year);
  const pending = await getPendingSummary();
  const maxIncoming = Math.max(
    1,
    ...dashboard.months.map((month) => month.incomingCents)
  );
  const completedMonths = dashboard.months.filter(
    (month) => month.incomingCents || month.outgoingCents
  ).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Visão geral</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
            Dashboard financeiro
          </h1>
        </div>
        <div className="flex flex-col gap-3 self-start md:self-end md:items-end md:text-right">
          <ValueVisibilityButton />
          <DashboardYearSelector years={yearOptions} selectedYear={year} />
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric
          tone="emerald"
          label="Entradas no ano"
          value={<HiddenValue>{formatCurrency(dashboard.totals.incomingCents)}</HiddenValue>}
        />
        <Metric
          tone="rose"
          label="Saídas no ano"
          value={<HiddenValue>{formatCurrency(dashboard.totals.outgoingCents)}</HiddenValue>}
        />
        <Metric
          tone="cyan"
          label="Resultado"
          value={<HiddenValue>{formatCurrency(dashboard.totals.balanceCents)}</HiddenValue>}
        />
        <Metric
          label="Meses com movimento"
          value={`${completedMonths}/12`}
          detail={`${dashboard.totals.movements} movimentações`}
        />
        <Metric
          tone="amber"
          label="Pendentes"
          value={String(pending.count)}
          detail={
            <>
              <HiddenValue>{formatCurrency(pending.amountCents)}</HiddenValue> aguardando
            </>
          }
        />
      </section>

      <section className="rounded-lg border border-zinc-200/80 bg-white/85 p-6 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500">Performance</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">
              Progresso dos meses
            </h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
            {year}
          </span>
        </div>
        <div className="mt-6 grid gap-3">
          {dashboard.months.map((month, index) => (
            <Link
              className="grid grid-cols-[44px_1fr_112px] items-center gap-3 rounded-md px-2 py-2 transition hover:bg-zinc-50"
              href={`/dashboard-mensal?year=${year}&month=${month.month}`}
              key={month.month}
            >
              <strong className="text-sm text-zinc-500">{monthNames[index]}</strong>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.max(3, (month.incomingCents / maxIncoming) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-right text-sm font-semibold text-zinc-800">
                <HiddenValue>{formatCurrency(month.balanceCents)}</HiddenValue>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, detail, tone = "zinc" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    zinc: "bg-zinc-50 text-zinc-700 ring-zinc-100",
  };

  return (
    <article className="rounded-lg border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
        {label}
      </div>
      <div className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
        {value}
      </div>
      <p className="mt-2 text-sm text-zinc-500">{detail || "Atualizado pelo caixa diário"}</p>
    </article>
  );
}

function normalizeYear(value, availableYears, fallbackYear) {
  const parsed = Number(value);
  if (availableYears.includes(parsed)) {
    return parsed;
  }

  return fallbackYear;
}
