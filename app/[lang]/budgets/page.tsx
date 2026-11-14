import { BudgetsView } from "@/features/budgets/budgets-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("budgets");

export default function Page() {
  return <BudgetsView />;
}
