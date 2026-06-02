"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  LogOut,
  Users,
  Wallet,
} from "lucide-react";

const links = [
  { href: "/caixa-do-dia", label: "Caixa do dia", icon: Wallet },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/pendentes", label: "Pendentes", icon: Clock3 },
  { href: "/clientes", label: "Clientes", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="sticky top-3 z-20 mx-3 mt-3 rounded-lg border border-white/10 bg-emerald-950/95 p-3 text-white shadow-2xl shadow-emerald-950/15 backdrop-blur lg:fixed lg:inset-y-5 lg:left-5 lg:right-auto lg:top-5 lg:mx-0 lg:mt-0 lg:w-64 lg:p-4">
      <div className="flex items-center gap-3 px-2 py-2">
        <span className="grid size-10 place-items-center rounded-lg bg-emerald-300 text-emerald-950">
          <CircleDollarSign size={22} />
        </span>
        <div>
          <span className="block text-sm font-semibold">Admin Financeiro</span>
          <span className="block text-xs text-zinc-400">Cash Flow OS</span>
        </div>
      </div>

      <nav
        className="mt-4 grid grid-cols-4 gap-2 lg:grid-cols-1"
        aria-label="Menu principal"
      >
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);

          return (
            <Link
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition lg:justify-start ${
                active
                  ? "bg-white text-emerald-950 shadow-lg shadow-emerald-950/20"
                  : "text-zinc-400 hover:bg-white/8 hover:text-white"
              }`}
              href={link.href}
              key={link.href}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          );
        })}
      </nav>



      <button
        className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-zinc-400 transition hover:bg-white/8 hover:text-white lg:justify-start"
        onClick={logout}
        type="button"
      >
        <LogOut size={18} />
        <span className="hidden sm:inline">Sair</span>
      </button>
    </aside>
  );
}
