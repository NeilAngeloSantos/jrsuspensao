import { NextResponse } from "next/server";
import { createClient, listClients } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ clients: await listClients() });
}

export async function POST(request) {
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Nome do cliente e obrigatorio." }, { status: 400 });
  }

  return NextResponse.json({
    clients: await createClient({
      name,
      phone: String(body.phone || "").trim(),
      email: String(body.email || "").trim(),
      vehiclePlate: String(body.vehiclePlate || "").trim().toUpperCase(),
    }),
  });
}
