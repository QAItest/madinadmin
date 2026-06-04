import { AuthGate } from "../../components/AuthGate";
import { MadinDashboard } from "../../components/MadinDashboard";
import { getDashboardData } from "../../lib/store";

export const dynamic = "force-dynamic";

export default async function AidesPage() {
  const data = await getDashboardData();
  return (
    <AuthGate>
      <MadinDashboard activePage="aides" initialData={data} />
    </AuthGate>
  );
}
