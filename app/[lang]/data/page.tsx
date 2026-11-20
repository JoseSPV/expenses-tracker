import { DataView } from "@/features/data/data-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("data");

export default function Page() {
  return <DataView />;
}
