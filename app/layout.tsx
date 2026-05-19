import "./globals.css";

export const metadata = {
  title: "Madin'Admin Platform",
  description: "Dashboard multi-agent pour dossiers administratifs ultramarins"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}