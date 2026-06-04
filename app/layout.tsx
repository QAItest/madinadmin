import "./globals.css";
import { AnalyticsScripts } from "../components/AnalyticsScripts";

export const metadata = {
  title: "Madin'Admin Platform",
  description: "Dashboard de préparation de dossiers administratifs ultramarins"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
