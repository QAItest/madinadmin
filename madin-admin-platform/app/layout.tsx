import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Madin'Admin — Plateforme multi-agents FEDER/FSE+",
  description:
    "Plateforme d'assistance administrative pour les dossiers de subventions européennes en Martinique et Guadeloupe.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {/* Top navigation bar */}
        <nav className="bg-eu-blue border-b-4 border-eu-gold shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                {/* EU flag stars indicator */}
                <span className="text-eu-gold text-2xl font-bold tracking-tight">★</span>
                <div>
                  <span className="text-white font-bold text-lg tracking-tight">
                    Madin&apos;Admin
                  </span>
                  <span className="hidden sm:inline text-blue-200 text-sm ml-2">
                    Plateforme FEDER/FSE+ Martinique & Guadeloupe
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/"
                  className="text-white hover:text-yellow-300 text-sm font-medium transition-colors"
                >
                  Tableau de bord
                </a>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-white text-sm transition-colors"
                >
                  API
                </a>
                <span className="text-blue-300 text-xs bg-blue-900 px-2 py-1 rounded">
                  v1.0
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="text-eu-blue font-semibold">★</span>
              <span>Cofinancé par l&apos;Union européenne — FEDER 2021-2027</span>
            </div>
            <div className="text-xs text-slate-400">
              Madin&apos;Admin — Multi-Agent Platform © 2025
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
