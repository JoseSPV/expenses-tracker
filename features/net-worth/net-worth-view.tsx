"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, Kpi, KpiGrid } from "@/components/ui/indicators";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { currentMonth } from "@/lib/domain/dates";
import { netWorthTotals, portfolioValue } from "@/lib/domain/selectors";
import { sum } from "@/lib/domain/sum";
import type { Account, AccountKind, AppData } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { AccountFormDialog } from "./account-form-dialog";

type Editing = { account?: Account; kind: AccountKind } | null;

/** Stored history with the current month replaced by live totals. */
function historyWithCurrent(data: AppData, portfolio: number) {
  const month = currentMonth();
  const { assets, liabilities } = netWorthTotals(data.accounts, portfolio);
  return [...data.netWorthHistory.filter((s) => s.month !== month), { month, assets, liabilities }].sort((a, b) =>
    a.month.localeCompare(b.month),
  );
}

function PortfolioRow({ value }: { value: number }) {
  const { dict, format, locale } = useI18n();
  return (
    <Link href={`/${locale}/investments`} className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-surface-2">
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate font-semibold">{dict.netWorth.portfolio}</strong>
        <small className="text-[13px] text-muted">{dict.netWorth.portfolioHint}</small>
      </span>
      <span className="font-semibold tabular-nums">{format.money(value)}</span>
    </Link>
  );
}

function AccountList({
  title,
  empty,
  accounts,
  portfolio = 0,
  onAdd,
  onEdit,
}: {
  title: string;
  empty: string;
  accounts: Account[];
  /** Shown as a computed row when above zero. */
  portfolio?: number;
  onAdd: () => void;
  onEdit: (account: Account) => void;
}) {
  const { dict, format } = useI18n();
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Button size="sm" variant="ghost" onClick={onAdd}>
            <Plus size={14} aria-hidden />
            {dict.common.add}
          </Button>
        }
      />
      {portfolio > 0 ? <PortfolioRow value={portfolio} /> : null}
      {accounts.length === 0 && portfolio <= 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        accounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => onEdit(account)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-surface-2"
          >
            <strong className="flex-1 truncate font-semibold">{account.name}</strong>
            <span className="font-semibold tabular-nums">{format.money(account.balance)}</span>
          </button>
        ))
      )}
      <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
        <span>{dict.common.total}</span>
        <span className="tabular-nums">{format.money(sum(accounts, (a) => a.balance) + portfolio)}</span>
      </div>
    </Card>
  );
}

export function NetWorthView() {
  const data = useAppData();
  const { dict, format } = useI18n();
  const text = dict.netWorth;
  const [editing, setEditing] = useState<Editing>(null);

  if (!data) return <ViewSkeleton />;

  const portfolio = portfolioValue(data);
  const { assets, liabilities, net } = netWorthTotals(data.accounts, portfolio);
  const history = historyWithCurrent(data, portfolio);
  const previous = history.at(-2);
  const change = previous ? net - (previous.assets - previous.liabilities) : 0;
  const ofKind = (kind: AccountKind) => data.accounts.filter((a) => a.kind === kind);

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <KpiGrid>
        <Kpi
          label={text.netWorth}
          value={format.money(net)}
          tone={net >= 0 ? "positive" : "negative"}
          hint={previous ? format.message(text.vsLastMonth, { amount: format.signedMoney(change) }) : undefined}
        />
        <Kpi label={text.assets} value={format.money(assets)} />
        <Kpi label={text.liabilities} value={format.money(liabilities)} />
        <Kpi label={text.debtRatio} value={assets ? format.percent(liabilities / assets) : "—"} hint={text.debtRatioHint} />
      </KpiGrid>
      <Card>
        <CardHeader title={text.trend} />
        {history.some((snapshot) => snapshot.assets !== 0 || snapshot.liabilities !== 0) ? (
          <LineChart
            label={text.trend}
            labels={history.map((s) => format.shortMonth(s.month))}
            series={[
              { name: text.netWorth, color: "var(--color-primary)", values: history.map((s) => s.assets - s.liabilities) },
              { name: text.liabilities, color: "var(--color-danger)", values: history.map((s) => s.liabilities) },
            ]}
          />
        ) : (
          <EmptyState>{text.noHistory}</EmptyState>
        )}
      </Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <AccountList
          title={text.assets}
          empty={text.noAssets}
          accounts={ofKind("asset")}
          portfolio={portfolio}
          onAdd={() => setEditing({ kind: "asset" })}
          onEdit={(account) => setEditing({ account, kind: account.kind })}
        />
        <AccountList
          title={text.liabilities}
          empty={text.noLiabilities}
          accounts={ofKind("liability")}
          onAdd={() => setEditing({ kind: "liability" })}
          onEdit={(account) => setEditing({ account, kind: account.kind })}
        />
      </div>
      <AccountFormDialog open={editing !== null} account={editing?.account} kind={editing?.kind ?? "asset"} onClose={() => setEditing(null)} />
    </section>
  );
}
