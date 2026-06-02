import { NextResponse } from "next/server";
import { createMovement } from "@/lib/db";
import { isoDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validModes = new Set(["in", "out"]);
const validPaymentTypes = new Set(["dinheiro", "credito", "pix"]);

export async function POST(request) {
  const body = await request.json();
  const date = body.date || isoDate();
  const mode = body.mode;
  const paymentType = body.paymentType;
  const amountCents = Number(body.amountCents || 0);
  const clientId = body.clientId ? Number(body.clientId) : null;
  const paymentStatus = body.paymentStatus || "paid";
  const description = String(body.description || "").trim();

  if (!validModes.has(mode)) {
    return NextResponse.json({ error: "Modo inválido." }, { status: 400 });
  }

  if (!validPaymentTypes.has(paymentType)) {
    return NextResponse.json({ error: "Tipo de pagamento inválido." }, { status: 400 });
  }

  if (!description || amountCents <= 0) {
    return NextResponse.json(
      { error: "Descrição e valor são obrigatórios." },
      { status: 400 }
    );
  }

  if (!["paid", "pending"].includes(paymentStatus)) {
    return NextResponse.json(
      { error: "Status de pagamento inválido." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    await createMovement({
      date,
      mode,
      description,
      amountCents,
      paymentType,
      clientId,
      paymentStatus,
    })
  );
}
