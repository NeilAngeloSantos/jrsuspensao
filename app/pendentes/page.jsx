import { PendingPaymentsClient } from "@/components/pending-payments-client";
import { listPendingMovements } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PendingPaymentsPage() {
  const pending = await listPendingMovements();
  const totalCents = pending.reduce(
    (sum, movement) => sum + Number(movement.amount_cents || 0),
    0
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Contas em aberto</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-emerald-950 md:text-5xl">
            Pendentes de pagamento
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            Acompanhe itens aguardando pagamento e quite quando o dinheiro entrar ou sair.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          <p className="text-sm font-semibold">Total pendente</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            {formatCurrency(totalCents)}
          </p>
        </div>
      </header>

      <PendingPaymentsClient initialPending={pending} />
    </div>
  );
}
