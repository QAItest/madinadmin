import { AuthGate } from "../../components/AuthGate";
import { MadinDashboard } from "../../components/MadinDashboard";
import { getDashboardData } from "../../lib/store";

export const dynamic = "force-dynamic";

export default async function DemarchesPage() {
  const data = await getDashboardData();
  return (
    <AuthGate>
      <MadinDashboard activePage="demarches" initialData={data} />
    </AuthGate>
  );
}
