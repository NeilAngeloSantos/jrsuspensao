import { CashDayClient } from "@/components/cash-day-client";
import { CashDateSelector } from "@/components/cash-date-selector";
import { ValueVisibilityButton } from "@/components/value-visibility";
import { getCashDay, listClients } from "@/lib/db";
import { isoDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const monthLabels = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export default async function CashDayPage({ searchParams }) {
  const params = await searchParams;
  const today = isoDate();
  const selectedDate = normalizeDate(params?.date, today);
  const data = await getCashDay(selectedDate);
  const clients = await listClients();
  const date = new Date(`${selectedDate}T12:00:00`);
  const displayDate = `${String(date.getDate()).padStart(2, "0")} ${
    monthLabels[date.getMonth()]
  } ${date.getFullYear()}`;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Caixa do dia</p>
          <CashDateSelector
            date={selectedDate}
            displayDate={displayDate}
            maxDate={today}
          />
        </div>
        <ValueVisibilityButton />
      </header>

      <CashDayClient
        clients={clients}
        date={selectedDate}
        initialData={data}
        key={selectedDate}
      />
    </div>
  );
}

function normalizeDate(value, fallback) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return fallback;
  }

  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  const today = new Date(`${fallback}T12:00:00`);
  if (parsed > today) {
    return fallback;
  }

  return value;
}
