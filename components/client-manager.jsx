"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

const emptyClient = { name: "", phone: "", email: "", vehiclePlate: "" };
const emptyFilters = { query: "", attribute: "all" };

const filterAttributes = [
  { value: "all", label: "Todos os atributos" },
  { value: "name", label: "Nome" },
  { value: "phone", label: "Telefone" },
  { value: "email", label: "E-mail" },
  { value: "vehicle_plate", label: "Placa" },
];

export function ClientManager({ initialClients }) {
  const [clients, setClients] = useState(initialClients);
  const [client, setClient] = useState(emptyClient);
  const [editingClient, setEditingClient] = useState(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const filteredClients = useMemo(() => {
    const query = filters.query.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((item) => {
      const values =
        filters.attribute === "all"
          ? [item.name, item.phone, item.email, item.vehicle_plate]
          : [item[filters.attribute]];

      return values
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [clients, filters]);

  async function saveClient(event) {
    event.preventDefault();
    setMessage("");

    if (!client.name.trim()) {
      setMessage("Informe o nome do cliente.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(client),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel salvar o cliente.");
      return;
    }

    setClients(payload.clients);
    setClient(emptyClient);
    setMessage("Cliente cadastrado com sucesso.");
  }

  function editClient(item) {
    setMessage("");
    setEditingClient({
      id: item.id,
      name: item.name || "",
      phone: item.phone || "",
      email: item.email || "",
      vehiclePlate: item.vehicle_plate || "",
    });
  }

  function closeEditModal() {
    setEditingClient(null);
    setMessage("");
  }

  async function saveEditClient(event) {
    event.preventDefault();
    setMessage("");

    if (!editingClient.name.trim()) {
      setMessage("Informe o nome do cliente.");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/clients/${editingClient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingClient),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel atualizar o cliente.");
      return;
    }

    setClients(payload.clients);
    setEditingClient(null);
    setMessage("Cliente atualizado com sucesso.");
  }

  async function removeClient(id) {
    setSaving(true);
    const response = await fetch(`/api/clients/${id}`, { method: "DELETE" });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Nao foi possivel remover o cliente.");
      return;
    }

    setClients(payload.clients);
    if (editingClient?.id === id) {
      closeEditModal();
    }
  }

  return (
    <>
    {editingClient ? (
      <div
        aria-labelledby="edit-client-title"
        aria-modal="true"
        className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-md"
        role="dialog"
      >
        <form
          className="w-full max-w-3xl rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl shadow-zinc-950/20"
          onSubmit={saveEditClient}
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-emerald-700">Cadastro existente</p>
              <h2
                className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950"
                id="edit-client-title"
              >
                Editar cliente
              </h2>
            </div>
            <button
              aria-label="Fechar"
              className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 transition hover:bg-zinc-100"
              onClick={closeEditModal}
              type="button"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-600" htmlFor="editName">
                Nome
              </label>
              <input
                autoFocus
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="editName"
                onChange={(event) =>
                  setEditingClient((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                value={editingClient.name}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-600" htmlFor="editPhone">
                Telefone
              </label>
              <input
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="editPhone"
                onChange={(event) =>
                  setEditingClient((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                value={editingClient.phone}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-600" htmlFor="editEmail">
                E-mail
              </label>
              <input
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="editEmail"
                onChange={(event) =>
                  setEditingClient((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                type="email"
                value={editingClient.email}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-zinc-600" htmlFor="editVehiclePlate">
                Placa
              </label>
              <input
                className="h-11 rounded-lg border border-zinc-200 bg-white px-3 uppercase text-zinc-950 outline-none transition placeholder:normal-case placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                id="editVehiclePlate"
                onChange={(event) =>
                  setEditingClient((current) => ({
                    ...current,
                    vehiclePlate: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="Sem placa"
                value={editingClient.vehiclePlate}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              onClick={closeEditModal}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
          </div>
        </form>
      </div>
    ) : null}

    <section className="grid gap-5">
      <form
        className="rounded-lg border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-900/[0.04] backdrop-blur"
        onSubmit={saveClient}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Cadastro</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
              Novo cliente
            </h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
            Base comercial
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[repeat(2,minmax(160px,1fr))_140px_116px] lg:grid-cols-[repeat(4,minmax(140px,1fr))_auto] md:items-end">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-600" htmlFor="name">
              Nome
            </label>
            <input
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              id="name"
              onChange={(event) =>
                setClient((current) => ({ ...current, name: event.target.value }))
              }
              value={client.name}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-600" htmlFor="phone">
              Telefone
            </label>
            <input
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              id="phone"
              onChange={(event) =>
                setClient((current) => ({ ...current, phone: event.target.value }))
              }
              value={client.phone}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-600" htmlFor="email">
              E-mail
            </label>
            <input
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              id="email"
              onChange={(event) =>
                setClient((current) => ({ ...current, email: event.target.value }))
              }
              type="email"
              value={client.email}
            />
          </div>
          <div className="grid gap-2">
            <label
              className="text-sm font-medium text-zinc-600"
              htmlFor="vehiclePlate"
            >
              Placa
            </label>
            <input
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 uppercase text-zinc-950 outline-none transition placeholder:normal-case placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              id="vehiclePlate"
              onChange={(event) =>
                setClient((current) => ({
                  ...current,
                  vehiclePlate: event.target.value.toUpperCase(),
                }))
              }
              placeholder="Sem placa"
              value={client.vehiclePlate}
            />
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              type="submit"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
        {message ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        ) : null}
      </form>

      <section className="rounded-lg border border-zinc-200/80 bg-white/85 p-5 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Pesquisa</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">
              Buscar clientes
            </h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
            {filteredClients.length} de {clients.length}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_auto] md:items-end">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-600" htmlFor="clientSearch">
              Pesquisar
            </label>
            <div className="flex h-11 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100">
              <Search className="shrink-0 text-zinc-400" size={18} />
              <input
                className="min-w-0 flex-1 bg-transparent text-zinc-950 outline-none placeholder:text-zinc-400"
                id="clientSearch"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }
                placeholder="Nome, telefone, e-mail ou placa"
                value={filters.query}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-600" htmlFor="clientAttribute">
              Filtrar por
            </label>
            <select
              className="h-11 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              id="clientAttribute"
              onChange={(event) =>
                setFilters((current) => ({ ...current, attribute: event.target.value }))
              }
              value={filters.attribute}
            >
              {filterAttributes.map((attribute) => (
                <option key={attribute.value} value={attribute.value}>
                  {attribute.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            onClick={() => setFilters(emptyFilters)}
            type="button"
          >
            Limpar
          </button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border border-zinc-200/80 bg-white/85 shadow-xl shadow-zinc-900/[0.04] backdrop-blur">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-50/80">
            <tr className="text-left text-xs font-semibold text-zinc-500">
              <th className="px-5 py-4">Nome</th>
              <th className="px-5 py-4">Telefone</th>
              <th className="px-5 py-4">E-mail</th>
              <th className="px-5 py-4">Placa</th>
              <th className="px-5 py-4">Cadastro</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredClients.map((item) => (
              <tr className="text-sm text-zinc-700" key={item.id}>
                <td className="px-5 py-4 font-medium text-zinc-950">{item.name}</td>
                <td className="px-5 py-4">{item.phone || "-"}</td>
                <td className="px-5 py-4">{item.email || "-"}</td>
                <td className="px-5 py-4 font-medium text-zinc-700">
                  {item.vehicle_plate || "Sem placa"}
                </td>
                <td className="px-5 py-4 text-zinc-500">
                  {new Date(`${item.created_at}Z`).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
                      disabled={saving}
                      onClick={() => editClient(item)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className="inline-flex min-h-9 items-center justify-center rounded-lg bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={saving}
                      onClick={() => removeClient(item.id)}
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
        {!clients.length ? (
          <div className="border-t border-zinc-100 px-6 py-10 text-center text-sm text-zinc-500">
            Nenhum cliente cadastrado ainda.
          </div>
        ) : !filteredClients.length ? (
          <div className="border-t border-zinc-100 px-6 py-10 text-center text-sm text-zinc-500">
            Nenhum cliente encontrado com esses filtros.
          </div>
        ) : null}
      </div>
    </section>
    </>
  );
}
