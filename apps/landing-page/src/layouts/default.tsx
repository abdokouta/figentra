/**
 * default — Figentra-owned source module.
 *
 * This file follows the repository documentation, security, and layering
 * standards. Public symbols must remain explicitly documented.
 */
import { Navbar } from "@/components/navbar";

/**
 * Public Figentra API symbol.
 */
export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen flex-col">
      <Navbar />
      <main className="container mx-auto max-w-7xl flex-grow px-6 pt-16">{children}</main>
      <footer className="flex w-full items-center justify-center py-3">
        <a
          className="flex items-center gap-1 text-current no-underline"
          href="https://heroui.com?utm_source=vite-template"
          rel="noopener noreferrer"
          target="_blank"
        >
          <span className="text-muted">Powered by</span>
          <p className="text-accent">HeroUI</p>
        </a>
      </footer>
    </div>
  );
}
