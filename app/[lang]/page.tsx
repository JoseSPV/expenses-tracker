import { DashboardView } from "@/features/dashboard/dashboard-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("dashboard");

export default function Page() {
  return <DashboardView />;
}
