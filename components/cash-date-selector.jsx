"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function CashDateSelector({ date, displayDate, maxDate }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(date);

  function submitDate(event) {
    event.preventDefault();
    router.push(`/caixa-do-dia?date=${selectedDate}`);
    setOpen(false);
  }

  return (
    <>
      <h1 className="mt-5 text-5xl font-semibold tracking-tight text-emerald-950 transition hover:text-emerald-700 md:text-7xl">
        <button
          className="[all:unset] cursor-pointer"
          onClick={() => {
            setSelectedDate(date);
            setOpen(true);
          }}
          title="Selecionar outro dia"
          type="button"
        >
          {displayDate}
        </button>
      </h1>

      {open ? (
        <div
          aria-labelledby="cash-date-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-md"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20"
            onSubmit={submitDate}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Navegar caixa</p>
                <h2
                  className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                  id="cash-date-title"
                >
                  Selecionar data
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

            <label
              className="mt-6 grid gap-2 text-sm font-medium text-zinc-600"
              htmlFor="cash-date"
            >
              Dia do caixa
              <span className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
                <CalendarDays className="text-zinc-400" size={18} />
                <input
                  className="h-12 min-w-0 flex-1 bg-transparent text-zinc-950 outline-none"
                  id="cash-date"
                  max={maxDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  type="date"
                  value={selectedDate}
                />
              </span>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800"
                type="submit"
              >
                Abrir caixa
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
