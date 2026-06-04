import { AuthGate } from "../../components/AuthGate";
import { MadinDashboard } from "../../components/MadinDashboard";
import { getDashboardData } from "../../lib/store";

export const dynamic = "force-dynamic";

export default async function MonDossierPage() {
  const data = await getDashboardData();
  return (
    <AuthGate>
      <MadinDashboard activePage="mon-dossier" initialData={data} />
    </AuthGate>
  );
}
