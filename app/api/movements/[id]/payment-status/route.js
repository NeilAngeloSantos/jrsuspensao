import { NextResponse } from "next/server";
import { updateMovementPaymentStatus } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const paymentStatus = body.paymentStatus;

  if (!["paid", "pending"].includes(paymentStatus)) {
    return NextResponse.json(
      { error: "Status de pagamento invalido." },
      { status: 400 }
    );
  }

  const result = await updateMovementPaymentStatus(Number(id), paymentStatus);

  if (!result) {
    return NextResponse.json(
      { error: "Movimentacao nao encontrada." },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
