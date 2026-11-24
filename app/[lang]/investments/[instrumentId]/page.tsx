import { InstrumentView } from "@/features/investments/instrument-view";
import { navTitle } from "@/i18n/page-metadata";

export const generateMetadata = navTitle("investments");

/** Instrument ids live in the browser, so no path can be generated ahead of time. */
export const dynamicParams = true;

export default async function Page({ params }: PageProps<"/[lang]/investments/[instrumentId]">) {
  const { instrumentId } = await params;
  return <InstrumentView instrumentId={instrumentId} />;
}
