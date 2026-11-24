"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, Kpi, KpiGrid } from "@/components/ui/indicators";
import { useI18n } from "@/i18n/i18n-provider";
import { today } from "@/lib/domain/dates";
import { dividendNetEur, yearSummary } from "@/lib/domain/portfolio";
import type { AppData, DividendOperation, Instrument } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const gainTone = (amount: number) => (amount === 0 ? "" : amount > 0 ? "text-success" : "text-danger");

function dividendsByInstrument(dividends: DividendOperation[], instruments: Instrument[]) {
  return instruments
    .map((instrument) => {
      const own = dividends.filter((op) => op.instrumentId === instrument.id);
      return {
        instrument,
        grossEur: own.reduce((acc, op) => acc + op.eur.gross, 0),
        withheldEur: own.reduce((acc, op) => acc + op.eur.withholdingOrigin + op.eur.withholdingSpain, 0),
        netEur: own.reduce((acc, op) => acc + dividendNetEur(op), 0),
        count: own.length,
      };
    })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.netEur - a.netEur);
}

function YearNav({ year, currentYear }: { year: number; currentYear: number }) {
  const { dict, locale } = useI18n();
  const text = dict.investments;
  const href = (target: number) => `/${locale}/investments?view=year&year=${target}`;
  const arrow = "grid size-10 place-items-center rounded-[10px] border bg-surface hover:bg-surface-2";

  return (
    <div className="flex items-center gap-2">
      <Link href={href(year - 1)} aria-label={text.previousYear} className={arrow}>
        <ChevronLeft size={18} aria-hidden />
      </Link>
      <h2 className="min-w-16 text-center text-lg font-bold tabular-nums">{year}</h2>
      {year < currentYear ? (
        <Link href={href(year + 1)} aria-label={text.nextYear} className={arrow}>
          <ChevronRight size={18} aria-hidden />
        </Link>
      ) : (
        <span aria-hidden className={cn(arrow, "opacity-40")}>
          <ChevronRight size={18} />
        </span>
      )}
    </div>
  );
}

export function YearPanel({ data, year: requested }: { data: AppData; year?: number }) {
  const { dict, format } = useI18n();
  const text = dict.investments;
  const currentYear = Number(today().slice(0, 4));
  const year = requested && requested <= currentYear ? requested : currentYear;
  const summary = yearSummary(data.investmentTransactions, year);
  const instrumentOf = (id: string) => data.instruments.find((instrument) => instrument.id === id);
  const operationOf = (id: string) => data.investmentTransactions.find((op) => op.id === id);
  const dividendRows = dividendsByInstrument(summary.dividends, data.instruments);
  const hasActivity = summary.sales.length > 0 || summary.dividends.length > 0;

  return (
    <>
      <YearNav year={year} currentYear={currentYear} />
      <KpiGrid>
        <Kpi label={text.gains} value={format.money(summary.gainsEur)} tone={summary.gainsEur > 0 ? "positive" : "neutral"} />
        <Kpi label={text.losses} value={format.money(summary.lossesEur)} tone={summary.lossesEur > 0 ? "negative" : "neutral"} />
        <Kpi
          label={text.dividendsNet}
          value={format.money(summary.dividendNetEur)}
          hint={format.message(text.dividendsBreakdown, {
            gross: format.money(summary.dividendGrossEur),
            withheld: format.money(summary.withholdingOriginEur + summary.withholdingSpainEur),
          })}
        />
        <Kpi
          label={text.totalRealized}
          value={format.signedMoney(summary.totalEur)}
          tone={summary.totalEur > 0 ? "positive" : summary.totalEur < 0 ? "negative" : "neutral"}
          hint={text.totalRealizedHint}
        />
      </KpiGrid>

      {hasActivity ? (
        <Card>
          <CardHeader title={text.byMonth} />
          <BarChart
            label={text.byMonth}
            labels={summary.byMonth.map((month) => format.shortMonth(month.month))}
            series={[
              { name: text.monthDividends, color: "var(--color-success)", values: summary.byMonth.map((month) => month.dividendsEur) },
              { name: text.monthSales, color: "var(--color-primary)", values: summary.byMonth.map((month) => month.salesEur) },
            ]}
          />
        </Card>
      ) : null}

      <Card>
        <CardHeader title={text.sales} />
        {summary.sales.length === 0 ? (
          <EmptyState>{format.message(text.salesEmpty, { year })}</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">{text.colDate}</th>
                  <th className="py-2 pr-3 font-medium">{text.colInstrument}</th>
                  <th className="py-2 pr-3 text-right font-medium">{text.colShares}</th>
                  <th className="py-2 pr-3 text-right font-medium">{text.colProceeds}</th>
                  <th className="py-2 pr-3 text-right font-medium">{text.colCost}</th>
                  <th className="py-2 text-right font-medium">{text.colResult}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {summary.sales.map((sale) => {
                  const instrument = instrumentOf(sale.instrumentId);
                  const operation = operationOf(sale.id);
                  const original = operation && operation.type === "sell" && instrument && instrument.currency !== "EUR"
                    ? format.foreignMoney(operation.quantity * operation.unitPrice, instrument.currency)
                    : null;
                  return (
                    <tr key={sale.id} className="border-b align-top last:border-b-0">
                      <td className="py-2.5 pr-3 whitespace-nowrap">{format.date(sale.date, { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="py-2.5 pr-3 font-semibold">{instrument?.ticker ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right">{format.quantity(sale.quantity)}</td>
                      <td className="py-2.5 pr-3 text-right">
                        {format.money(sale.proceedsEur)}
                        {original ? <small className="block text-muted">{original}</small> : null}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {format.money(sale.costEur)}
                        {sale.lots.map((lot) => (
                          <small key={`${lot.buyDate}-${lot.quantity}`} className="block text-muted">
                            {format.message(text.lot, {
                              quantity: format.quantity(lot.quantity),
                              date: format.date(lot.buyDate, { day: "numeric", month: "short", year: "numeric" }),
                            })}
                          </small>
                        ))}
                      </td>
                      <td className={cn("py-2.5 text-right font-semibold", gainTone(sale.gainEur))}>{format.signedMoney(sale.gainEur)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={text.dividendsByInstrument} />
        {dividendRows.length === 0 ? (
          <EmptyState>{format.message(text.dividendsEmpty, { year })}</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b">
                  <th className="py-2 pr-3 font-medium">{text.colInstrument}</th>
                  <th className="py-2 pr-3 text-right font-medium">{text.colGross}</th>
                  <th className="py-2 pr-3 text-right font-medium">{text.colWithheld}</th>
                  <th className="py-2 text-right font-medium">{text.colNet}</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {dividendRows.map((row) => (
                  <tr key={row.instrument.id} className="border-b last:border-b-0">
                    <td className="py-2.5 pr-3 font-semibold">{row.instrument.ticker}</td>
                    <td className="py-2.5 pr-3 text-right">{format.money(row.grossEur)}</td>
                    <td className="py-2.5 pr-3 text-right">{format.money(row.withheldEur)}</td>
                    <td className="py-2.5 text-right font-semibold">{format.money(row.netEur)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="tabular-nums font-semibold">
                <tr className="border-t">
                  <td className="py-2.5 pr-3">{dict.common.total}</td>
                  <td className="py-2.5 pr-3 text-right">{format.money(summary.dividendGrossEur)}</td>
                  <td className="py-2.5 pr-3 text-right">{format.money(summary.withholdingOriginEur + summary.withholdingSpainEur)}</td>
                  <td className="py-2.5 text-right">{format.money(summary.dividendNetEur)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <p className="text-[13px] text-muted">{text.notTax}</p>
    </>
  );
}
