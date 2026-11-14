import { CalculatorsView } from "@/features/calculators/calculators-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("calculators");

export default function Page() {
  return <CalculatorsView />;
}
