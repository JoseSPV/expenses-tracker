import { GoalsView } from "@/features/goals/goals-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("goals");

export default function Page() {
  return <GoalsView />;
}
