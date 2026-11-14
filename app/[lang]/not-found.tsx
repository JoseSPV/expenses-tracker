import Link from "next/link";
import { getDictionary, getLocale } from "@/i18n/get-dictionary";

export default async function NotFound() {
  const [{ notFound: text }, locale] = await Promise.all([getDictionary(), getLocale()]);

  return (
    <section className="flex flex-col items-start gap-3">
      <h2 className="text-xl font-semibold">{text.title}</h2>
      <p className="text-muted">{text.description}</p>
      <Link href={`/${locale}`} className="font-semibold text-primary hover:underline">
        {text.back}
      </Link>
    </section>
  );
}
