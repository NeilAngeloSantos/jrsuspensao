import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata = {
  title: "Admin Financeiro",
  description: "Gestão de fluxo de caixa e clientes",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
