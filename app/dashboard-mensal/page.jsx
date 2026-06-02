import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import {
  getAvailableDashboardYears,
  getDashboard,
  getDashboardMonthDays,
} from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { HiddenValue, ValueVisibilityButton } from "@/components/value-visibility";

export const dynamic = "force-dynamic";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default async function MonthlyDashboardPage({ searchParams }) {
  const params = await searchParams;
  const availableYears = await getAvailableDashboardYears();
  const currentYear = new Date().getFullYear();
  const yearOptions = availableYears.length ? availableYears : [currentYear];
  const year = normalizeYear(params?.year, yearOptions, yearOptions[0]);
  const month = normalizeMonth(params?.month);
  const dashboard = await getDashboard(year);
  const monthSummary = dashboard.months[Number(month) - 1];
  const days = await getDashboardMonthDays(year, month);
  const maxDailyIncoming = Math.max(1, ...days.map((day) => day.incomingCents));
  const maxDailyBalance = Math.max(
    1,
    ...days.map((day) => Math.abs(day.balanceCents))
  );
  const activeDays = days.filter(
    (day) => day.incomingCents || day.outgoingCents || day.pendingMovements
  ).length;
  const pending = days.reduce(
    (acc, day) => ({
      count: acc.count + day.pendingMovements,
      cents: acc.cents + day.pendingCents,
    }),
    { count: 0, cents: 0 }
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
            href={`/dashboard?year=${year}`}
          >
            <ArrowLeft size={16} />
            Voltar ao dashboard
          </Link>
          <p className="mt-5 text-sm font-semibold text-emerald-700">
            Performance mensal
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
            {monthNames[Number(month) - 1]} de {year}
          </h1>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <ValueVisibilityButton />
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
            href={`/dashboard?year=${year}`}
          >
            Ver ano completo
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric
          tone="emerald"
          label="Entradas no mês"
          value={<HiddenValue>{formatCurrency(monthSummary.incomingCents)}</HiddenValue>}
        />
        <Metric
          tone="rose"
          label="Saídas no mês"
          value={<HiddenValue>{formatCurrency(monthSummary.outgoingCents)}</HiddenValue>}
        />
        <Metric
          tone={monthSummary.balanceCents < 0 ? "rose" : "cyan"}
          label="Resultado"
          value={<HiddenValue>{formatCurrency(monthSummary.balanceCents)}</HiddenValue>}
        />
        <Metric
          label="Dias com movimento"
          value={String(activeDays)}
          detail={`${monthSummary.movements} movimentações pagas`}
        />
        <Metric
          tone="amber"
          label="Pendentes"
          value={String(pending.count)}
          detail={
            <>
              <HiddenValue>{formatCurrency(pending.cents)}</HiddenValue> aguardando
            </>
          }
        />
      </section>

      <section className="rounded-lg border border-zinc-200/80 bg-white/85 p-6 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-500">Dias do mês</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">
              Performance diaria
            </h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600">
            {days.length} dias registrados
          </span>
        </div>

        {days.length ? (
          <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200">
            <div className="grid grid-cols-[88px_1.2fr_1.2fr_1fr_108px] gap-4 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase text-zinc-500 max-lg:hidden">
              <span>Dia</span>
              <span>Entradas</span>
              <span>Resultado</span>
              <span>Movimentos</span>
              <span className="text-right">Caixa</span>
            </div>
            <div className="divide-y divide-zinc-200">
              {days.map((day) => (
                <article
                  className="grid gap-4 px-4 py-4 lg:grid-cols-[88px_1.2fr_1.2fr_1fr_108px] lg:items-center"
                  key={day.date}
                >
                  <div>
                    <p className="text-base font-semibold text-zinc-950">
                      Dia {formatDay(day.date)}
                    </p>
                    <p className="text-xs text-zinc-500">{formatShortDate(day.date)}</p>
                  </div>
                  <BarAmount
                    max={maxDailyIncoming}
                    tone="emerald"
                    value={day.incomingCents}
                  />
                  <BarAmount
                    max={maxDailyBalance}
                    tone={day.balanceCents < 0 ? "rose" : "cyan"}
                    value={day.balanceCents}
                  />
                  <div>
                    <p className="text-sm font-semibold text-zinc-950">
                      {day.movements} pagos
                    </p>
                    <p className="text-xs text-zinc-500">
                      {day.pendingMovements
                        ? `${day.pendingMovements} pendentes`
                        : "Sem pendências"}
                    </p>
                  </div>
                  <Link
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    href={`/caixa-do-dia?date=${day.date}`}
                  >
                    <CalendarDays size={16} />
                    Caixa
                  </Link>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-dashed border-zinc-200 p-6 text-sm text-zinc-500">
            Nenhum dia com caixa registrado para este mês.
          </p>
        )}
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
      <p className="mt-2 text-sm text-zinc-500">
        {detail || "Atualizado pelo caixa diário"}
      </p>
    </article>
  );
}

function BarAmount({ value, max, tone }) {
  const colors = {
    emerald: "bg-emerald-500 text-emerald-700",
    cyan: "bg-cyan-500 text-cyan-700",
    rose: "bg-rose-500 text-rose-700",
  };
  const width = `${Math.max(3, (Math.abs(value) / max) * 100)}%`;

  return (
    <div>
      <p className={`text-sm font-semibold ${colors[tone].split(" ")[1]}`}>
        <HiddenValue>{formatCurrency(value)}</HiddenValue>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-full rounded-full ${colors[tone].split(" ")[0]}`} style={{ width }} />
      </div>
    </div>
  );
}

function normalizeYear(value, availableYears, fallbackYear) {
  const parsed = Number(value);
  if (availableYears.includes(parsed)) {
    return parsed;
  }

  return fallbackYear;
}

function normalizeMonth(value) {
  if (!/^\d{1,2}$/.test(String(value || ""))) {
    return "01";
  }

  const parsed = Number(value);
  if (parsed < 1 || parsed > 12) {
    return "01";
  }

  return String(parsed).padStart(2, "0");
}

function formatDay(value) {
  const [, , day] = value.split("-");
  return day;
}

function formatShortDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
