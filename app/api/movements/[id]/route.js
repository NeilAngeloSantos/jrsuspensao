import { NextResponse } from "next/server";
import { deleteMovement, updateMovement } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const result = await deleteMovement(Number(id));

  if (!result) {
    return NextResponse.json(
      { error: "Movimentacao nao encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const mode = body.mode;
  const paymentType = body.paymentType;
  const paymentStatus = body.paymentStatus || "paid";
  const amountCents = Number(body.amountCents || 0);
  const clientId = body.clientId ? Number(body.clientId) : null;
  const description = String(body.description || "").trim();

  if (!["in", "out"].includes(mode)) {
    return NextResponse.json({ error: "Modo invalido." }, { status: 400 });
  }

  if (!["dinheiro", "credito", "pix"].includes(paymentType)) {
    return NextResponse.json({ error: "Tipo de pagamento invalido." }, { status: 400 });
  }

  if (!["paid", "pending"].includes(paymentStatus)) {
    return NextResponse.json(
      { error: "Status de pagamento invalido." },
      { status: 400 }
    );
  }

  if (!description || amountCents <= 0) {
    return NextResponse.json(
      { error: "Descricao e valor sao obrigatorios." },
      { status: 400 }
    );
  }

  const result = await updateMovement({
    id: Number(id),
    mode,
    description,
    amountCents,
    paymentType,
    clientId,
    paymentStatus,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Movimentacao nao encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
