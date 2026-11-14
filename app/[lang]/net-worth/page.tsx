import { NetWorthView } from "@/features/net-worth/net-worth-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("netWorth");

export default function Page() {
  return <NetWorthView />;
}
