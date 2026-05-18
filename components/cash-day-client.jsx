"use client";

import { useMemo, useState } from "react";
import { Pencil, Search, UserCheck, UserPlus, X } from "lucide-react";
import {
  formatCurrency,
  formatInputCurrency,
  modeLabels,
  parseCurrencyToCents,
  paymentLabels,
} from "@/lib/format";

const emptyMovement = {
  mode: "in",
  description: "",
  clientId: "",
  amount: "",
  paymentType: "dinheiro",
  paymentStatus: "paid",
};

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export function CashDayClient({ clients, initialData, date }) {
  const [data, setData] = useState(initialData);
  const [opening, setOpening] = useState(formatCurrency(initialData.day.opening_cents));
  const [movement, setMovement] = useState(emptyMovement);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [editingMovement, setEditingMovement] = useState(null);

  const summary = data.summary;

  const orderedMovements = useMemo(() => data.movements, [data.movements]);
  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) =>
      [client.name, client.phone, client.email, client.vehicle_plate]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [clientSearch, clients]);
  const hasSelectedClient = Boolean(movement.clientId);

  async function saveOpening(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/cash-day", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, openingCents: parseCurrencyToCents(opening) }),
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel salvar o saldo inicial.");
      return;
    }

    setData(payload);
    setOpening(formatCurrency(payload.day.opening_cents));
    setOpeningModalOpen(false);
  }

  async function submitMovement(event) {
    event.preventDefault();
    setMessage("");

    const amountCents = parseCurrencyToCents(movement.amount);
    if (!movement.description.trim() || amountCents <= 0) {
      setMessage("Preencha descricao e valor para registrar a movimentacao.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        mode: movement.mode,
        description: movement.description.trim(),
        amountCents,
        paymentType: movement.paymentType,
        clientId: movement.clientId || null,
        paymentStatus: movement.paymentStatus,
      }),
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel registrar a movimentacao.");
      return;
    }

    setData(payload);
    setMovement(emptyMovement);
  }

  async function removeMovement(id) {
    setSaving(true);
    const response = await fetch(`/api/movements/${id}`, { method: "DELETE" });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel remover a movimentacao.");
      return;
    }

    setData(payload);
  }

  function openEditMovement(item) {
    setEditingMovement({
      id: item.id,
      mode: item.mode,
      description: item.description,
      clientId: item.client_id ? String(item.client_id) : "",
      amount: formatCurrency(item.amount_cents),
      paymentType: item.payment_type,
      paymentStatus: item.payment_status || "paid",
    });
  }

  async function submitEditMovement(event) {
    event.preventDefault();
    setMessage("");

    const amountCents = parseCurrencyToCents(editingMovement.amount);
    if (!editingMovement.description.trim() || amountCents <= 0) {
      setMessage("Preencha descricao e valor para atualizar a movimentacao.");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/movements/${editingMovement.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: editingMovement.mode,
        description: editingMovement.description.trim(),
        amountCents,
        paymentType: editingMovement.paymentType,
        clientId: editingMovement.clientId || null,
        paymentStatus: editingMovement.paymentStatus,
      }),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel atualizar a movimentacao.");
      return;
    }

    setData(payload);
    setEditingMovement(null);
  }

  return (
    <>
      {clientModalOpen ? (
        <div
          aria-labelledby="client-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-md"
          role="dialog"
        >
          <div className="w-full max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Vinculo opcional</p>
                <h2
                  className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                  id="client-modal-title"
                >
                  Selecionar cliente
                </h2>
              </div>
              <button
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100"
                onClick={() => setClientModalOpen(false)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
              <Search className="text-zinc-400" size={18} />
              <input
                autoFocus
                className="h-12 min-w-0 flex-1 bg-transparent text-zinc-950 outline-none placeholder:text-zinc-400"
                onChange={(event) => setClientSearch(event.target.value)}
                placeholder="Pesquisar por nome, telefone, e-mail ou placa"
                value={clientSearch}
              />
            </div>

            <div className="mt-5 max-h-80 overflow-y-auto rounded-lg border border-zinc-200">
              <button
                className={`flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left text-sm transition hover:bg-zinc-50 ${
                  !movement.clientId ? "bg-emerald-50 text-emerald-800" : "text-zinc-700"
                }`}
                onClick={() => {
                  setMovement((current) => ({ ...current, clientId: "" }));
                  setClientModalOpen(false);
                  setClientSearch("");
                }}
                type="button"
              >
                <span>Nenhum cliente</span>
                {!movement.clientId ? <UserCheck size={18} /> : null}
              </button>

              {filteredClients.map((client) => (
                <button
                  className={`flex w-full items-center justify-between border-b border-zinc-100 px-4 py-3 text-left transition last:border-0 hover:bg-zinc-50 ${
                    String(client.id) === String(movement.clientId)
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-zinc-700"
                  }`}
                  key={client.id}
                  onClick={() => {
                    setMovement((current) => ({
                      ...current,
                      clientId: String(client.id),
                    }));
                    setClientModalOpen(false);
                    setClientSearch("");
                  }}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold">{client.name}</span>
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      {[client.phone, client.email, client.vehicle_plate]
                        .filter(Boolean)
                        .join(" - ") || "Sem contato"}
                    </span>
                  </span>
                  {String(client.id) === String(movement.clientId) ? (
                    <UserCheck size={18} />
                  ) : null}
                </button>
              ))}

              {!filteredClients.length ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  Nenhum cliente encontrado.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {editingMovement ? (
        <div
          aria-labelledby="edit-movement-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-md"
          role="dialog"
        >
          <form
            className="w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20"
            onSubmit={submitEditMovement}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Ajuste de lancamento</p>
                <h2
                  className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                  id="edit-movement-title"
                >
                  Editar movimentacao
                </h2>
              </div>
              <button
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100"
                onClick={() => setEditingMovement(null)}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-12">
              <div className="grid gap-2 md:col-span-3">
                <label className="text-sm font-medium text-zinc-600" htmlFor="edit-mode">
                  Modo
                </label>
                <select
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  id="edit-mode"
                  onChange={(event) =>
                    setEditingMovement((current) => ({
                      ...current,
                      mode: event.target.value,
                    }))
                  }
                  value={editingMovement.mode}
                >
                  <option value="in">Entrada</option>
                  <option value="out">Saida</option>
                </select>
              </div>
              <div className="grid gap-2 md:col-span-9">
                <label
                  className="text-sm font-medium text-zinc-600"
                  htmlFor="edit-description"
                >
                  Descricao
                </label>
                <input
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  id="edit-description"
                  onChange={(event) =>
                    setEditingMovement((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  value={editingMovement.description}
                />
              </div>
              <div className="grid gap-2 md:col-span-4">
                <label className="text-sm font-medium text-zinc-600" htmlFor="edit-client">
                  Cliente
                </label>
                <select
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  id="edit-client"
                  onChange={(event) =>
                    setEditingMovement((current) => ({
                      ...current,
                      clientId: event.target.value,
                    }))
                  }
                  value={editingMovement.clientId}
                >
                  <option value="">Sem cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {[client.name, client.vehicle_plate].filter(Boolean).join(" - ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium text-zinc-600" htmlFor="edit-amount">
                  Valor
                </label>
                <input
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  id="edit-amount"
                  inputMode="numeric"
                  onChange={(event) =>
                    setEditingMovement((current) => ({
                      ...current,
                      amount: formatInputCurrency(event.target.value),
                    }))
                  }
                  value={editingMovement.amount}
                />
              </div>
              <div className="grid gap-2 md:col-span-3">
                <label className="text-sm font-medium text-zinc-600" htmlFor="edit-type">
                  Tipo
                </label>
                <select
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  id="edit-type"
                  onChange={(event) =>
                    setEditingMovement((current) => ({
                      ...current,
                      paymentType: event.target.value,
                    }))
                  }
                  value={editingMovement.paymentType}
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="credito">Credito</option>
                  <option value="pix">Pix</option>
                </select>
              </div>
              <div className="grid gap-2 md:col-span-3">
                <label className="text-sm font-medium text-zinc-600" htmlFor="edit-status">
                  Pagamento
                </label>
                <select
                  className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  id="edit-status"
                  onChange={(event) =>
                    setEditingMovement((current) => ({
                      ...current,
                      paymentStatus: event.target.value,
                    }))
                  }
                  value={editingMovement.paymentStatus}
                >
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => setEditingMovement(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                Salvar alteracoes
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="mb-5 flex justify-end">
        <button
          className="flex min-h-12 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white/85 px-4 text-sm shadow-xl shadow-zinc-900/[0.04] backdrop-blur transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 sm:w-auto sm:min-w-56"
          onClick={() => setOpeningModalOpen(true)}
          type="button"
        >
          <span className="font-medium text-zinc-500">Saldo inicial</span>
          <strong className="font-semibold text-zinc-950">
            {formatCurrency(summary.openingCents)}
          </strong>
        </button>
      </div>

      {openingModalOpen ? (
        <div
          aria-labelledby="opening-title"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-md"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20"
            onSubmit={saveOpening}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-semibold text-emerald-700">Abertura do caixa</p>
                <h2
                  className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                  id="opening-title"
                >
                  Saldo inicial
                </h2>
              </div>
              <button
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100"
                onClick={() => setOpeningModalOpen(false)}
                type="button"
              >
                x
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Informe o valor em dinheiro disponivel ao iniciar a operacao.
            </p>
            <div className="mt-5 grid gap-2">
              <label className="text-sm font-medium text-zinc-600" htmlFor="opening">
                Valor de abertura
              </label>
              <input
                autoFocus
                className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="opening"
                inputMode="numeric"
                onBlur={(event) => setOpening(formatInputCurrency(event.target.value))}
                onChange={(event) => setOpening(event.target.value)}
                value={opening}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => setOpeningModalOpen(false)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                Salvar saldo
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid gap-5 min-[1500px]:grid-cols-[minmax(0,1fr)_340px]">
      <section className="grid min-w-0 gap-5">
        <form
          className="rounded-lg border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-900/[0.04] backdrop-blur"
          onSubmit={submitMovement}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Lancamento</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
                Movimentacao
              </h2>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
              Entrada e saida
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-12 min-[1180px]:grid-cols-[92px_minmax(280px,1fr)_106px_112px_108px_120px] md:items-end">
            <div className="grid gap-2 md:col-span-2 min-[1180px]:col-span-1">
              <label className="text-sm font-medium text-zinc-600" htmlFor="mode">
                Modo
              </label>
              <select
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="mode"
                onChange={(event) =>
                  setMovement((current) => ({ ...current, mode: event.target.value }))
                }
                value={movement.mode}
              >
                <option value="in">Entrada</option>
                <option value="out">Saida</option>
              </select>
            </div>
            <div className="grid gap-2 md:col-span-6 min-[1180px]:col-span-1">
              <label className="text-sm font-medium text-zinc-600" htmlFor="description">
                Descricao
              </label>
              <input
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="description"
                onChange={(event) =>
                  setMovement((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Venda, despesa ou ajuste"
                value={movement.description}
              />
            </div>
            <div className="grid gap-2 md:col-span-4 min-[1180px]:col-span-1">
              <span className="text-sm font-medium text-zinc-600">
                Cliente
              </span>
              <button
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-emerald-100 ${
                  hasSelectedClient
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
                onClick={() => setClientModalOpen(true)}
                title={hasSelectedClient ? "Cliente vinculado" : "Vincular cliente"}
                type="button"
              >
                {hasSelectedClient ? <UserCheck size={18} /> : <UserPlus size={18} />}
                <span>{hasSelectedClient ? "Vinculado" : "Vincular"}</span>
              </button>
            </div>
            <div className="grid gap-2 md:col-span-3 min-[1180px]:col-span-1">
              <label className="text-sm font-medium text-zinc-600" htmlFor="amount">
                Valor
              </label>
              <input
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="amount"
                inputMode="numeric"
                onChange={(event) =>
                  setMovement((current) => ({
                    ...current,
                    amount: formatInputCurrency(event.target.value),
                  }))
                }
                placeholder="R$ 0,00"
                value={movement.amount}
              />
            </div>
            <div className="grid gap-2 md:col-span-3 min-[1180px]:col-span-1">
              <label className="text-sm font-medium text-zinc-600" htmlFor="paymentType">
                Tipo
              </label>
              <select
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="paymentType"
                onChange={(event) =>
                  setMovement((current) => ({
                    ...current,
                    paymentType: event.target.value,
                  }))
                }
                value={movement.paymentType}
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="credito">Credito</option>
                <option value="pix">Pix</option>
              </select>
            </div>
            <div className="grid gap-2 md:col-span-3 min-[1180px]:col-span-1">
              <label className="text-sm font-medium text-zinc-600" htmlFor="paymentStatus">
                Pagamento
              </label>
              <select
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="paymentStatus"
                onChange={(event) =>
                  setMovement((current) => ({
                    ...current,
                    paymentStatus: event.target.value,
                  }))
                }
                value={movement.paymentStatus}
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end md:-mt-11 md:ml-auto md:w-1/4 min-[1180px]:mt-4 min-[1180px]:w-auto">
            <button
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={saving}
              type="submit"
            >
              Registrar
            </button>
          </div>
          {message ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {message}
            </div>
          ) : null}
        </form>

        <div className="overflow-x-auto rounded-lg border border-zinc-200/80 bg-white/85 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
          <table className="w-full min-w-[1040px] border-collapse">
            <thead className="bg-zinc-50/80">
              <tr className="text-left text-xs font-semibold text-zinc-500">
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Hora</th>
                <th className="px-5 py-4">Descricao</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Pagamento</th>
                <th className="px-5 py-4">Modo</th>
                <th className="px-5 py-4">Valor</th>
                <th className="px-5 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {orderedMovements.map((item) => (
                <tr className="text-sm text-zinc-700" key={item.id}>
                  <td className="px-5 py-4">
                    <span className={badgeClass(item.payment_type)}>
                      {paymentLabels[item.payment_type]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-500">
                    {formatTime(item.occurred_at)}
                  </td>
                  <td className="max-w-[360px] px-5 py-4 font-medium text-zinc-950">
                    <span className="block truncate">{item.description}</span>
                  </td>
                  <td className="px-5 py-4 text-zinc-500">
                    {[item.client_name, item.client_vehicle_plate].filter(Boolean).join(" - ") ||
                      "-"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={paymentStatusBadgeClass(item.payment_status)}>
                      {item.payment_status === "pending" ? "Pendente" : "Pago"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={modeBadgeClass(item.mode)}>
                      {modeLabels[item.mode]}
                    </span>
                  </td>
                  <td
                    className={`px-5 py-4 font-semibold ${
                      item.payment_status === "pending"
                        ? "text-zinc-400"
                        : item.mode === "in"
                          ? "text-emerald-700"
                          : "text-rose-700"
                    }`}
                  >
                    {item.mode === "out" ? "- " : ""}
                    {formatCurrency(item.amount_cents)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving}
                        onClick={() => openEditMovement(item)}
                        type="button"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={saving}
                        onClick={() => removeMovement(item.id)}
                        type="button"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orderedMovements.length ? (
            <div className="border-t border-zinc-100 px-6 py-10 text-center text-sm text-zinc-500">
              Nenhuma movimentacao registrada neste dia.
            </div>
          ) : null}
        </div>
      </section>

      <aside className="grid min-w-0 gap-4 min-[1500px]:content-start">
        <section className="rounded-lg border border-zinc-200/80 bg-white/85 p-4 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
          <p className="text-xs font-semibold text-zinc-500">Operacoes</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">
            Resumo
          </h2>
          <div className="mt-3 grid gap-1">
            <SummaryLine
              compact
              label="Cartao de credito"
              value={`${summary.byPaymentType.credito.count} ops`}
            />
            <SummaryLine
              compact
              label="Dinheiro"
              value={`${summary.byPaymentType.dinheiro.count} ops`}
            />
            <SummaryLine compact label="Pix" value={`${summary.byPaymentType.pix.count} ops`} />
          </div>
        </section>

        <section className="rounded-lg border border-sky-200 bg-sky-50/90 p-5 text-sky-950 shadow-xl shadow-sky-900/[0.06] backdrop-blur">
          <p className="text-sm font-semibold text-sky-700">Financeiro</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">Totais do dia</h2>
          <p className="mt-2 text-xs leading-5 text-sky-700/80">
            Somente lancamentos pagos entram nesses totais.
          </p>
          <div className="mt-5 grid gap-2">
            <SummaryLine blue label="Entradas" value={formatCurrency(summary.incomingCents)} />
            <SummaryLine blue label="Saidas" value={formatCurrency(summary.outgoingCents)} />
            <SummaryLine blue label="Resultado" value={formatCurrency(summary.balanceCents)} />
            <SummaryLine blue label="Total em caixa" value={formatCurrency(summary.cashCents)} />
          </div>
        </section>
      </aside>
    </div>
    </>
  );
}

function SummaryLine({ blue = false, compact = false, dark = false, label, value }) {
  return (
    <div
      className={`flex items-center justify-between border-b last:border-0 ${
        compact ? "min-h-9" : "min-h-12"
      } ${
        dark ? "border-white/10" : blue ? "border-sky-200/80" : "border-zinc-200/70"
      }`}
    >
      <span
        className={`${compact ? "text-xs" : "text-sm"} ${
          dark ? "text-zinc-400" : blue ? "text-sky-700" : "text-zinc-500"
        }`}
      >
        {label}
      </span>
      <strong className={`${compact ? "text-xs" : "text-sm"} font-semibold text-current`}>
        {value}
      </strong>
    </div>
  );
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

function formatTime(value) {
  const date = parseTimestamp(value);
  return date ? timeFormatter.format(date) : "-";
}

function badgeClass(type) {
  const base = "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold";
  if (type === "dinheiro") return `${base} bg-emerald-50 text-emerald-700`;
  if (type === "credito") return `${base} bg-orange-50 text-orange-700`;
  return `${base} bg-cyan-50 text-cyan-700`;
}

function modeBadgeClass(mode) {
  const base = "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold";
  if (mode === "in") return `${base} bg-emerald-50 text-emerald-700`;
  return `${base} bg-rose-50 text-rose-700`;
}

function paymentStatusBadgeClass(status) {
  const base = "inline-flex min-h-7 items-center rounded-full px-3 text-xs font-semibold";
  if (status === "pending") return `${base} bg-amber-50 text-amber-700`;
  return `${base} bg-emerald-50 text-emerald-700`;
}
