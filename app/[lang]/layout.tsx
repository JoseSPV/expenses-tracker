import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeScript } from "@/components/layout/theme-script";
import { TrialImportNotice } from "@/features/data/trial-import-notice";
import { readPerson } from "@/lib/session/person";
import { ToastProvider } from "@/components/ui/toast";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { I18nProvider } from "@/i18n/i18n-provider";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await getDictionary();
  return {
    title: { template: `%s · ${meta.appName}`, default: meta.appName },
    description: meta.description,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary();
  const person = await readPerson();

  return (
    // The script runs in the first HTML document, before paint, so the stored theme does not flash.
    <html lang={lang} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeScript />
        <I18nProvider locale={lang} dict={dict}>
          <ToastProvider>
            <AppShell person={person} notice={<TrialImportNotice />}>
              {children}
            </AppShell>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
