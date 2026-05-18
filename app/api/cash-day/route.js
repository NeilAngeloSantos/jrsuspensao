import { NextResponse } from "next/server";
import { getCashDay, setOpeningAmount } from "@/lib/db";
import { isoDate } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || isoDate();
  return NextResponse.json(await getCashDay(date));
}

export async function PATCH(request) {
  const body = await request.json();
  const date = body.date || isoDate();
  const openingCents = Number(body.openingCents || 0);

  if (openingCents < 0) {
    return NextResponse.json(
      { error: "O saldo inicial nao pode ser negativo." },
      { status: 400 }
    );
  }

  return NextResponse.json(await setOpeningAmount(date, openingCents));
}
