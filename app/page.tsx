import { MadinDashboard } from "../components/MadinDashboard";
import { getDashboardData } from "../lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getDashboardData();
  return <MadinDashboard initialData={data} />;
}
