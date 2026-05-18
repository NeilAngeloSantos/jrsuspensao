"use client";

import { useMemo, useState } from "react";
import { formatCurrency, modeLabels, paymentLabels } from "@/lib/format";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function PendingPaymentsClient({ initialPending }) {
  const [pending, setPending] = useState(initialPending);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");

  const totalCents = useMemo(
    () => pending.reduce((sum, item) => sum + Number(item.amount_cents || 0), 0),
    [pending]
  );

  async function markAsPaid(id) {
    setSavingId(id);
    setMessage("");

    const response = await fetch(`/api/movements/${id}/payment-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    });
    const payload = await response.json();
    setSavingId(null);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel marcar como pago.");
      return;
    }

    setPending((current) => current.filter((item) => item.id !== id));
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Itens pendentes" value={String(pending.length)} />
        <Metric label="Valor aguardando" value={formatCurrency(totalCents)} />
        <Metric
          label="Mais antigo"
          value={pending.length ? waitingTimeLabel(pending[0].occurred_at) : "-"}
        />
      </div>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-zinc-200/80 bg-white/85 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
        <table className="w-full min-w-[980px] border-collapse">
          <thead className="bg-zinc-50/80">
            <tr className="text-left text-xs font-semibold text-zinc-500">
              <th className="px-5 py-4">Data</th>
              <th className="px-5 py-4">Cliente</th>
              <th className="px-5 py-4">Descricao</th>
              <th className="px-5 py-4">Tipo</th>
              <th className="px-5 py-4">Modo</th>
              <th className="px-5 py-4">Esperando</th>
              <th className="px-5 py-4">Valor</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pending.map((item) => (
              <tr className="text-sm text-zinc-700" key={item.id}>
                <td className="px-5 py-4 text-zinc-500">
                  {formatDate(item.occurred_at)}
                </td>
                <td className="px-5 py-4 font-medium text-zinc-950">
                  {[item.client_name, item.client_vehicle_plate].filter(Boolean).join(" - ") ||
                    "-"}
                </td>
                <td className="max-w-[360px] px-5 py-4">
                  <span className="block truncate">{item.description}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={typeBadge(item.payment_type)}>
                    {paymentLabels[item.payment_type]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={modeBadge(item.mode)}>{modeLabels[item.mode]}</span>
                </td>
                <td className="px-5 py-4 text-amber-700">
                  {waitingTimeLabel(item.occurred_at)}
                </td>
                <td
                  className={`px-5 py-4 font-semibold ${
                    item.mode === "in" ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {item.mode === "out" ? "- " : ""}
                  {formatCurrency(item.amount_cents)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    className="inline-flex min-h-9 items-center justify-center rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingId === item.id}
                    onClick={() => markAsPaid(item.id)}
                    type="button"
                  >
                    Marcar pago
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!pending.length ? (
          <div className="border-t border-zinc-100 px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-700">Nada pendente por aqui.</p>
            <p className="mt-1 text-sm text-zinc-500">
              Quando um lancamento for marcado como pendente, ele aparece nesta tela.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <article className="rounded-lg border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
    </article>
  );
}

function formatDate(value) {
  const date = parseTimestamp(value);
  return date ? dateFormatter.format(date).replace(".", "") : "-";
}

function waitingTimeLabel(value) {
  const startedAt = parseTimestamp(value)?.getTime();
  if (!startedAt) {
    return "-";
  }

  const diffMs = Math.max(0, Date.now() - startedAt);
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return "menos de 1h";
}

function parseTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const timestamp = String(value).trim();
  const needsUtcSuffix = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?$/.test(
    timestamp
  );
  const parsed = new Date(needsUtcSuffix ? `${timestamp}Z` : timestamp);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function typeBadge(type) {
  const base = "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold";
  if (type === "dinheiro") return `${base} bg-emerald-50 text-emerald-700`;
  if (type === "credito") return `${base} bg-orange-50 text-orange-700`;
  return `${base} bg-cyan-50 text-cyan-700`;
}

function modeBadge(mode) {
  const base = "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold";
  if (mode === "in") return `${base} bg-emerald-50 text-emerald-700`;
  return `${base} bg-rose-50 text-rose-700`;
}
