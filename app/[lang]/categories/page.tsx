import { CategoriesView } from "@/features/categories/categories-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("categories");

export default function Page() {
  return <CategoriesView />;
}
