import {
  ArrowLeftRight,
  Calculator,
  LayoutDashboard,
  PieChart,
  Repeat,
  Tags,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/i18n/types";

export interface NavItem {
  /** Path after the locale prefix; `""` is the dashboard. */
  segment: string;
  labelKey: Exclude<keyof Dictionary["nav"], "label">;
  icon: LucideIcon;
  /** Shows the month picker in the top bar. */
  usesMonth: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { segment: "", labelKey: "dashboard", icon: LayoutDashboard, usesMonth: true },
  { segment: "transactions", labelKey: "transactions", icon: ArrowLeftRight, usesMonth: true },
  { segment: "budgets", labelKey: "budgets", icon: PieChart, usesMonth: true },
  { segment: "goals", labelKey: "goals", icon: Target, usesMonth: false },
  { segment: "bills", labelKey: "bills", icon: Repeat, usesMonth: false },
  { segment: "net-worth", labelKey: "netWorth", icon: TrendingUp, usesMonth: false },
  { segment: "calculators", labelKey: "calculators", icon: Calculator, usesMonth: false },
  { segment: "categories", labelKey: "categories", icon: Tags, usesMonth: false },
];

export const hrefFor = (locale: string, segment: string) => (segment ? `/${locale}/${segment}` : `/${locale}`);

export function activeNavItem(pathname: string, locale: string): NavItem | undefined {
  const segment = pathname.replace(`/${locale}`, "").split("/")[1] ?? "";
  return NAV_ITEMS.find((item) => item.segment === segment);
}
