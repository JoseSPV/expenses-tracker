"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, ColorDot, EmptyState, Kpi, KpiGrid } from "@/components/ui/indicators";
import { Select } from "@/components/ui/input";
import { ViewSkeleton } from "@/components/ui/view-skeleton";
import { useI18n } from "@/i18n/i18n-provider";
import { listInstrumentOperations } from "@/lib/books/investments";
import { dividendNetEur, positionOf, tradeTotalEur } from "@/lib/domain/portfolio";
import type { Instrument, InvestmentOperationType, InvestmentTransaction } from "@/lib/domain/types";
import { useAppData } from "@/lib/store/use-app-data";
import { InstrumentFormDialog } from "./instrument-form-dialog";
import { OperationFormDialog } from "./operation-form-dialog";
import { PriceFormDialog } from "./price-form-dialog";

type TypeFilter = InvestmentOperationType | "all";
type Dialog = { kind: "instrument" } | { kind: "price" } | { kind: "operation"; operation?: InvestmentTransaction } | null;

const TYPE_TONE = { buy: "neutral", sell: "warning", dividend: "success" } as const;

function pageThrough(operations: InvestmentTransaction[], instrumentId: string, type: TypeFilter, pageCount: number) {
  let items: InvestmentTransaction[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < pageCount; page++) {
    const result = listInstrumentOperations(operations, { instrumentId, type, cursor });
    items = items.concat(result.items);
    cursor = result.nextCursor;
    if (!cursor) break;
  }
  return { items, hasMore: Boolean(cursor) };
}

function OperationRow({ operation, instrument, onEdit }: { operation: InvestmentTransaction; instrument: Instrument; onEdit: () => void }) {
  const { dict, format } = useI18n();
  const text = dict.investments;
  const foreign = instrument.currency !== "EUR";
  const detail =
    operation.type === "dividend"
      ? format.foreignMoney(operation.gross, instrument.currency)
      : format.message(text.tradeLine, {
          quantity: format.quantity(operation.quantity),
          price: format.foreignMoney(operation.unitPrice, instrument.currency),
        });
  const extras = [
    foreign ? format.message(text.rateLine, { currency: instrument.currency, rate: format.quantity(operation.eurRate) }) : null,
    operation.fee.amount > 0 ? format.message(text.feeLine, { amount: format.foreignMoney(operation.fee.amount, operation.fee.currency) }) : null,
  ].filter(Boolean);
  const amount = operation.type === "dividend" ? dividendNetEur(operation) : tradeTotalEur(operation);

  return (
    <button type="button" onClick={onEdit} className="flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 text-left hover:bg-surface-2">
      <span className="w-20 shrink-0">
        <Badge tone={TYPE_TONE[operation.type]}>{text.types[operation.type]}</Badge>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate font-semibold tabular-nums">{detail}</strong>
        <small className="truncate text-[13px] text-muted">
          {[format.date(operation.date, { day: "numeric", month: "short", year: "numeric" }), ...extras, operation.note].filter(Boolean).join(" · ")}
        </small>
      </span>
      <span className={`font-semibold whitespace-nowrap tabular-nums ${operation.type === "buy" ? "" : "text-success"}`}>
        {operation.type === "buy" ? "−" : "+"}
        {format.money(amount)}
      </span>
    </button>
  );
}

export function InstrumentView({ instrumentId }: { instrumentId: string }) {
  const data = useAppData();
  const router = useRouter();
  const { dict, format, locale } = useI18n();
  const text = dict.investments;
  const [type, setType] = useState<TypeFilter>("all");
  const [pages, setPages] = useState(1);
  const [dialog, setDialog] = useState<Dialog>(null);
  const backHref = `/${locale}/investments`;

  if (!data) return <ViewSkeleton />;

  const instrument = data.instruments.find((item) => item.id === instrumentId);
  if (!instrument) {
    return (
      <Card>
        <EmptyState>
          {text.missing}{" "}
          <Link href={backHref} className="text-primary underline">
            {text.back}
          </Link>
        </EmptyState>
      </Card>
    );
  }

  const position = positionOf(instrument, data.investmentTransactions);
  const page = pageThrough(data.investmentTransactions, instrument.id, type, pages);
  const latentTone = position.unrealizedEur === null || position.unrealizedEur === 0 ? "neutral" : position.unrealizedEur > 0 ? "positive" : "negative";

  return (
    <section className="flex animate-fade-in flex-col gap-5">
      <Link href={backHref} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={16} aria-hidden />
        {text.back}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-xl font-bold">
          <ColorDot color={instrument.color} className="size-3" />
          {instrument.ticker}
          <span className="text-base font-medium text-muted">{instrument.name}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "instrument" })}>
            <Pencil size={14} aria-hidden />
            {text.editInstrument}
          </Button>
          <Button size="sm" onClick={() => setDialog({ kind: "price" })}>
            <Tag size={14} aria-hidden />
            {text.updatePrice}
          </Button>
          <Button size="sm" variant="primary" onClick={() => setDialog({ kind: "operation" })}>
            <Plus size={14} aria-hidden />
            {text.addOperation}
          </Button>
        </div>
      </div>

      <KpiGrid>
        <Kpi label={text.position} value={format.quantity(position.quantity)} hint={position.quantity > 0 ? `${text.averageCost} ${format.money(position.averageCostEur)}` : undefined} />
        <Kpi
          label={text.colPrice}
          value={instrument.price ? format.foreignMoney(instrument.price.value, instrument.currency) : text.noPrice}
          hint={instrument.price ? format.message(text.priceOn, { date: format.date(instrument.price.date, { day: "numeric", month: "short", year: "numeric" }) }) : undefined}
        />
        <Kpi
          label={text.unrealized}
          value={position.unrealizedEur === null ? "—" : format.signedMoney(position.unrealizedEur)}
          tone={latentTone}
          hint={position.unrealizedEur !== null && position.costEur > 0 ? format.signedPercent(position.unrealizedEur / position.costEur) : undefined}
        />
        <Kpi label={text.realized} value={format.signedMoney(position.realizedEur)} tone={position.realizedEur > 0 ? "positive" : position.realizedEur < 0 ? "negative" : "neutral"} />
        <Kpi label={text.dividendsTotal} value={format.money(position.dividendsNetEur)} />
      </KpiGrid>

      <Card>
        <CardHeader
          title={text.operations}
          action={
            <Select
              className="w-auto"
              aria-label={text.filterType}
              value={type}
              onChange={(e) => {
                setType(e.target.value as TypeFilter);
                setPages(1);
              }}
            >
              <option value="all">{text.allTypes}</option>
              <option value="buy">{text.types.buy}</option>
              <option value="sell">{text.types.sell}</option>
              <option value="dividend">{text.types.dividend}</option>
            </Select>
          }
        />
        {page.items.length === 0 ? (
          <EmptyState>{position.operationCount === 0 ? text.noOperations : text.operationsEmpty}</EmptyState>
        ) : (
          page.items.map((operation) => (
            <OperationRow key={operation.id} operation={operation} instrument={instrument} onEdit={() => setDialog({ kind: "operation", operation })} />
          ))
        )}
        {page.hasMore ? (
          <Button className="mt-3 min-h-11 w-full" onClick={() => setPages((count) => count + 1)}>
            {text.loadMore}
          </Button>
        ) : null}
      </Card>

      <InstrumentFormDialog
        open={dialog?.kind === "instrument"}
        instrument={instrument}
        operationCount={position.operationCount}
        onClose={() => setDialog(null)}
        onDeleted={() => router.push(backHref)}
      />
      <PriceFormDialog open={dialog?.kind === "price"} instrument={instrument} onClose={() => setDialog(null)} />
      <OperationFormDialog
        open={dialog?.kind === "operation"}
        instruments={data.instruments}
        operation={dialog?.kind === "operation" ? dialog.operation : undefined}
        defaultInstrumentId={instrument.id}
        onClose={() => setDialog(null)}
      />
    </section>
  );
}
