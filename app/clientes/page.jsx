import { ClientManager } from "@/components/client-manager";
import { listClients } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-8">
      <header>
        <div>
          <p className="text-sm font-semibold text-emerald-700">Relacionamento</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
            Clientes
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-600">
            Cadastre contatos para a área administrativa crescer junto com o caixa.
          </p>
        </div>
      </header>

      <ClientManager initialClients={clients} />
    </div>
  );
}
