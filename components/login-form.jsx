"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const errorMessages = {
  google_not_configured: "Login com Google ainda não foi configurado.",
  google_state: "Sessão do Google expirada. Tente entrar novamente.",
  google_token: "Não foi possível validar o acesso com Google.",
  google_profile: "Não foi possível carregar o perfil do Google.",
  google_denied: "Este e-mail do Google não está autorizado.",
};

export function LoginForm({ nextPath = "/", error }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(errorMessages[error] || "");
  const [saving, setSaving] = useState(false);

  async function submitLogin(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(payload.error || "Não foi possível entrar.");
      return;
    }

    router.replace(nextPath || "/");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submitLogin}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-600" htmlFor="email">
          E-mail
        </label>
        <input
          autoComplete="email"
          autoFocus
          className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          value={email}
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-600" htmlFor="password">
          Senha
        </label>
        <input
          autoComplete="current-password"
          className="h-12 rounded-lg border border-zinc-200 bg-white px-4 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          id="password"
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
      </div>

      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        Entrar
      </button>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs font-semibold text-zinc-400">
        <span className="h-px bg-zinc-200" />
        ou
        <span className="h-px bg-zinc-200" />
      </div>

      <a
        className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        href="/api/auth/google"
      >
        <span className="grid size-6 place-items-center rounded-full border border-zinc-200 text-xs font-bold text-emerald-700">
          G
        </span>
        Entrar com Google
      </a>
    </form>
  );
}
