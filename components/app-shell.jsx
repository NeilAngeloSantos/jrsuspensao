"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ValueVisibilityProvider } from "@/components/value-visibility";

export function AppShell({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <ValueVisibilityProvider>
      <div className="min-h-screen bg-[#f6f7f4] text-zinc-950">
        {isLogin ? null : <Sidebar />}
        <main className={`min-h-screen ${isLogin ? "" : "lg:pl-72"}`}>
          <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
            {children}
          </div>
        </main>
      </div>
    </ValueVisibilityProvider>
  );
}
