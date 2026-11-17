import type { Metadata } from "next";
import { PrivacyView } from "@/features/privacy/privacy-view";
import { getDictionary } from "@/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const { privacy, meta } = await getDictionary();
  return { title: { absolute: `${privacy.title} · ${meta.appName}` } };
}

export default function Page() {
  return <PrivacyView />;
}
