import { BillsView } from "@/features/bills/bills-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("bills");

export default function Page() {
  return <BillsView />;
}
