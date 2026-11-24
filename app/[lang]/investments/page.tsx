import { InvestmentsView, type InvestmentsTab } from "@/features/investments/investments-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("investments");

export default async function Page({ searchParams }: PageProps<"/[lang]/investments">) {
  const { view, year } = await searchParams;
  const tab: InvestmentsTab = view === "year" ? "year" : "portfolio";
  const parsedYear = typeof year === "string" && /^\d{4}$/.test(year) ? Number(year) : undefined;
  return <InvestmentsView tab={tab} year={parsedYear} />;
}
