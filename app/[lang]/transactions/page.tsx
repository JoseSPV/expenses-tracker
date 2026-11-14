import { TransactionsView } from "@/features/transactions/transactions-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("transactions");

export default function Page() {
  return <TransactionsView />;
}
