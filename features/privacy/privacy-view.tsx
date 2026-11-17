"use client";

import { useI18n } from "@/i18n/i18n-provider";

export function PrivacyView() {
  const { dict } = useI18n();
  const text = dict.privacy;
  const sections = [
    [text.storedTitle, text.stored],
    [text.whereTitle, text.where],
    [text.whoTitle, text.who],
    [text.exportTitle, text.export],
    [text.deleteTitle, text.delete],
  ] as const;

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <p className="text-sm leading-relaxed text-muted">{text.intro}</p>
      {sections.map(([title, body]) => (
        <div key={title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm leading-relaxed">{body}</p>
        </div>
      ))}
    </section>
  );
}
