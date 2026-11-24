"use client";

import Link from "next/link";
import { DonutChart } from "@/components/charts/donut-chart";
import { Card, CardHeader } from "@/components/ui/card";
import { ColorDot, Kpi, KpiGrid, Legend } from "@/components/ui/indicators";
import { useI18n } from "@/i18n/i18n-provider";
import { today } from "@/lib/domain/dates";
import { portfolioSummary, valueForTotals, yearSummary, type Position } from "@/lib/domain/portfolio";
import type { AppData } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const gainTone = (amount: number | null) => (amount === null || amount === 0 ? "" : amount > 0 ? "text-success" : "text-danger");

export function PortfolioPanel({ data }: { data: AppData }) {
  const { dict, format, locale } = useI18n();
  const text = dict.investments;
  const summary = portfolioSummary(data.instruments, data.investmentTransactions);
  const year = Number(today().slice(0, 4));
  const dividends = yearSummary(data.investmentTransactions, year).dividendNetEur;
  const href = (position: Position) => `/${locale}/investments/${position.instrument.id}`;

  return (
    <>
      <KpiGrid>
        <Kpi
          label={text.value}
          value={format.money(summary.valueEur)}
          hint={summary.unpricedCount > 0 ? format.plural(text.valueAtCost, summary.unpricedCount) : undefined}
        />
        <Kpi label={text.invested} value={format.money(summary.costEur)} hint={text.investedHint} />
        <Kpi
          label={text.unrealized}
          value={format.signedMoney(summary.unrealizedEur)}
          tone={summary.unrealizedEur > 0 ? "positive" : summary.unrealizedEur < 0 ? "negative" : "neutral"}
          hint={
            summary.pricedCostEur > 0
              ? `${format.signedPercent(summary.unrealizedEur / summary.pricedCostEur)} · ${text.unrealizedHint}`
              : text.unrealizedHint
          }
        />
        <Kpi label={format.message(text.dividendsThisYear, { year })} value={format.money(dividends)} hint={text.dividendsThisYearHint} />
      </KpiGrid>

      {summary.open.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title={text.positions} />
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">{text.colInstrument}</th>
                    <th className="py-2 pr-3 text-right font-medium">{text.colShares}</th>
                    <th className="py-2 pr-3 text-right font-medium">{text.colAverageCost}</th>
                    <th className="py-2 pr-3 text-right font-medium">{text.colPrice}</th>
                    <th className="py-2 pr-3 text-right font-medium">{text.colValue}</th>
                    <th className="py-2 pr-3 text-right font-medium">{text.colUnrealized}</th>
                    <th className="py-2 text-right font-medium">{text.colWeight}</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {summary.open.map((position) => {
                    const { instrument } = position;
                    return (
                      <tr key={instrument.id} className="border-b last:border-b-0 hover:bg-surface-2">
                        <td className="py-2.5 pr-3">
                          <Link href={href(position)} className="flex items-center gap-2 font-semibold hover:underline">
                            <ColorDot color={instrument.color} />
                            <span className="flex flex-col">
                              {instrument.ticker}
                              <small className="font-normal text-muted">{instrument.name}</small>
                            </span>
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 text-right">{format.quantity(position.quantity)}</td>
                        <td className="py-2.5 pr-3 text-right">{format.money(position.averageCostEur)}</td>
                        <td className="py-2.5 pr-3 text-right">
                          {instrument.price ? (
                            <span className="flex flex-col">
                              {format.foreignMoney(instrument.price.value, instrument.currency)}
                              <small className="text-muted">{format.message(text.priceOn, { date: format.date(instrument.price.date) })}</small>
                            </span>
                          ) : (
                            <span className="text-muted">{text.noPrice}</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          {format.money(valueForTotals(position))}
                          {position.marketValueEur === null ? <small className="block text-muted">{text.atCost}</small> : null}
                        </td>
                        <td className={cn("py-2.5 pr-3 text-right", gainTone(position.unrealizedEur))}>
                          {position.unrealizedEur === null ? (
                            "—"
                          ) : (
                            <span className="flex flex-col">
                              {format.signedMoney(position.unrealizedEur)}
                              <small>{format.signedPercent(position.unrealizedEur / position.costEur)}</small>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">{format.percent(valueForTotals(position) / summary.valueEur)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <CardHeader title={text.allocation} />
            <DonutChart
              label={text.value}
              value={format.compactMoney(summary.valueEur)}
              segments={summary.open.map((position) => ({
                label: position.instrument.ticker,
                value: valueForTotals(position),
                color: position.instrument.color,
              }))}
            />
            <div className="mt-4">
              <Legend
                items={summary.open.map((position) => ({
                  label: position.instrument.ticker,
                  color: position.instrument.color,
                  value: format.percent(valueForTotals(position) / summary.valueEur),
                }))}
              />
            </div>
          </Card>
        </div>
      ) : null}

      {summary.inactive.length > 0 ? (
        <Card>
          <CardHeader title={text.inactive} />
          {summary.inactive.map((position) => (
            <Link
              key={position.instrument.id}
              href={href(position)}
              className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 hover:bg-surface-2"
            >
              <ColorDot color={position.instrument.color} />
              <span className="flex min-w-0 flex-1 flex-col">
                <strong className="truncate font-semibold">{position.instrument.ticker}</strong>
                <small className="truncate text-[13px] text-muted">{position.instrument.name}</small>
              </span>
              <span className={cn("text-sm font-semibold tabular-nums", gainTone(position.realizedEur))}>
                {position.operationCount === 0
                  ? text.noOperations
                  : format.message(text.inactiveRealized, { amount: format.signedMoney(position.realizedEur) })}
              </span>
            </Link>
          ))}
        </Card>
      ) : null}
    </>
  );
}
