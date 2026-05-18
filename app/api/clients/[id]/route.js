import { NextResponse } from "next/server";
import { deleteClient, updateClient } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request, { params }) {
  const { id } = await params;
  return NextResponse.json({ clients: await deleteClient(Number(id)) });
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json({ error: "Nome do cliente e obrigatorio." }, { status: 400 });
  }

  const clients = await updateClient({
    id: Number(id),
    name,
    phone: String(body.phone || "").trim(),
    email: String(body.email || "").trim(),
    vehiclePlate: String(body.vehiclePlate || "").trim().toUpperCase(),
  });

  if (!clients) {
    return NextResponse.json({ error: "Cliente nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ clients });
}
