import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieName, sessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const body = await request.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const expectedEmail = String(process.env.AUTH_EMAIL || "").trim().toLowerCase();
  const expectedPassword = String(process.env.AUTH_PASSWORD || "");

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { error: "Login por e-mail e senha não configurado no servidor." },
      { status: 503 }
    );
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    sessionCookieName,
    await createSessionToken({ email, provider: "credentials" }),
    sessionCookieOptions()
  );
  return response;
}
