"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardYearSelector({ years, selectedYear }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function selectYear(year) {
    router.push(`/?year=${encodeURIComponent(year)}`);
    setOpen(false);
  }

  return (
    <>
      <div className="text-4xl font-semibold tracking-tight text-emerald-950 transition hover:text-emerald-700 md:text-5xl">
        <button
          className="[all:unset] cursor-pointer"
          onClick={() => setOpen(true)}
          title="Selecionar outro ano"
          type="button"
        >
          {selectedYear}
        </button>
      </div>

      {open ? (
        <div
          aria-labelledby="dashboard-year-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-md"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Navegar dashboard</p>
                <h2
                  className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                  id="dashboard-year-title"
                >
                  Selecionar ano
                </h2>
              </div>
              <button
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200">
              {years.map((year) => (
                <button
                  className={`flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left text-sm font-semibold transition last:border-0 hover:bg-zinc-50 ${
                    year === selectedYear
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-zinc-700"
                  }`}
                  key={year}
                  onClick={() => selectYear(year)}
                  type="button"
                >
                  {year}
                  {year === selectedYear ? (
                    <span className="text-xs font-semibold uppercase text-emerald-700">
                      Atual
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
