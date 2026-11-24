// Type-only imports: `node --test` loads this file without a bundler to resolve extensionless paths.
import type { DividendOperation, Fee, ISODate, Instrument, InvestmentTransaction, TradeOperation } from "./types";

/** Share quantities are fractional; anything below this is zero. */
const EPSILON = 1e-9;

const cents = (value: number): number => Math.round(value * 100) / 100;

const total = <T>(items: readonly T[], pick: (item: T) => number): number =>
  cents(items.reduce((acc, item) => acc + pick(item), 0));

const feeInEur = (fee: Fee, eurRate: number): number => cents(fee.currency === "EUR" ? fee.amount : fee.amount * eurRate);

// EUR equivalents proposed by the form. Once saved, the stored `eur` block wins.

export function proposeTradeEur(input: Pick<TradeOperation, "quantity" | "unitPrice" | "eurRate" | "fee">): TradeOperation["eur"] {
  return { gross: cents(input.quantity * input.unitPrice * input.eurRate), fee: feeInEur(input.fee, input.eurRate) };
}

export function proposeDividendEur(
  input: Pick<DividendOperation, "gross" | "withholdingOrigin" | "eurRate" | "fee">,
  withholdingSpain: number,
): DividendOperation["eur"] {
  return {
    gross: cents(input.gross * input.eurRate),
    withholdingOrigin: cents(input.withholdingOrigin * input.eurRate),
    withholdingSpain: cents(withholdingSpain),
    fee: feeInEur(input.fee, input.eurRate),
  };
}

export const dividendNetEur = (op: Pick<DividendOperation, "eur">): number =>
  cents(op.eur.gross - op.eur.withholdingOrigin - op.eur.withholdingSpain - op.eur.fee);

/** A buy's acquisition cost or a sale's transfer value. */
export const tradeTotalEur = (op: Pick<TradeOperation, "type" | "eur">): number =>
  cents(op.type === "buy" ? op.eur.gross + op.eur.fee : op.eur.gross - op.eur.fee);

// FIFO

export interface LotSlice {
  buyDate: ISODate;
  quantity: number;
  costEur: number;
}

export interface Sale {
  id: string;
  instrumentId: string;
  date: ISODate;
  quantity: number;
  proceedsEur: number;
  costEur: number;
  gainEur: number;
  lots: LotSlice[];
}

export interface Replay {
  lots: LotSlice[];
  sales: Sale[];
  /** First sale that sells more shares than were held on its date. */
  oversoldSaleId?: string;
}

/** Same day: buys before sells, so a buy and a sell on one date always line up. */
function chronological(a: TradeOperation, b: TradeOperation): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.type !== b.type) return a.type === "buy" ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Replays one instrument's trades in order. Each sale consumes the oldest lots first. */
export function replayInstrument(operations: readonly InvestmentTransaction[]): Replay {
  const trades = operations.filter((op): op is TradeOperation => op.type !== "dividend").sort(chronological);
  const lots: LotSlice[] = [];
  const sales: Sale[] = [];
  let oversoldSaleId: string | undefined;

  for (const op of trades) {
    if (op.type === "buy") {
      lots.push({ buyDate: op.date, quantity: op.quantity, costEur: tradeTotalEur(op) });
      continue;
    }
    const slices: LotSlice[] = [];
    let remaining = op.quantity;
    while (remaining > EPSILON) {
      const lot = lots[0];
      if (!lot) {
        oversoldSaleId ??= op.id;
        break;
      }
      const take = Math.min(lot.quantity, remaining);
      const whole = lot.quantity - take <= EPSILON;
      const costEur = whole ? lot.costEur : cents((lot.costEur * take) / lot.quantity);
      slices.push({ buyDate: lot.buyDate, quantity: take, costEur });
      if (whole) lots.shift();
      else lots[0] = { ...lot, quantity: lot.quantity - take, costEur: cents(lot.costEur - costEur) };
      remaining -= take;
    }
    const proceedsEur = tradeTotalEur(op);
    const costEur = total(slices, (slice) => slice.costEur);
    sales.push({
      id: op.id,
      instrumentId: op.instrumentId,
      date: op.date,
      quantity: op.quantity,
      proceedsEur,
      costEur,
      gainEur: cents(proceedsEur - costEur),
      lots: slices,
    });
  }
  return { lots, sales, oversoldSaleId };
}

/** Writes call this before committing: a list where any sale outruns its shares is rejected. */
export function hasOversold(operations: readonly InvestmentTransaction[], instrumentId: string): boolean {
  return replayInstrument(operations.filter((op) => op.instrumentId === instrumentId)).oversoldSaleId !== undefined;
}

// Positions

export interface Position {
  instrument: Instrument;
  quantity: number;
  costEur: number;
  averageCostEur: number;
  /** `null` without a price. */
  marketValueEur: number | null;
  unrealizedEur: number | null;
  realizedEur: number;
  dividendsNetEur: number;
  operationCount: number;
}

export const isOpen = (position: Position): boolean => position.quantity > EPSILON;

/** Without a price a position counts at cost. Never at an invented market value. */
export const valueForTotals = (position: Position): number => position.marketValueEur ?? position.costEur;

export function positionOf(instrument: Instrument, operations: readonly InvestmentTransaction[]): Position {
  const own = operations.filter((op) => op.instrumentId === instrument.id);
  const { lots, sales } = replayInstrument(own);
  const quantity = lots.reduce((acc, lot) => acc + lot.quantity, 0);
  const open = quantity > EPSILON;
  const costEur = open ? total(lots, (lot) => lot.costEur) : 0;
  const price = instrument.price;
  const marketValueEur = open && price ? cents(quantity * price.value * price.eurRate) : null;
  return {
    instrument,
    quantity: open ? quantity : 0,
    costEur,
    averageCostEur: open ? costEur / quantity : 0,
    marketValueEur,
    unrealizedEur: marketValueEur === null ? null : cents(marketValueEur - costEur),
    realizedEur: total(sales, (sale) => sale.gainEur),
    dividendsNetEur: total(
      own.filter((op): op is DividendOperation => op.type === "dividend"),
      dividendNetEur,
    ),
    operationCount: own.length,
  };
}

export interface PortfolioSummary {
  /** Largest value first. */
  open: Position[];
  /** Instruments with no shares now: sold out, or not bought yet. */
  inactive: Position[];
  costEur: number;
  valueEur: number;
  unrealizedEur: number;
  /** Cost of the priced positions, the base for the unrealized percentage. */
  pricedCostEur: number;
  unpricedCount: number;
}

export function portfolioSummary(instruments: readonly Instrument[], operations: readonly InvestmentTransaction[]): PortfolioSummary {
  const positions = instruments.map((instrument) => positionOf(instrument, operations));
  const open = positions.filter(isOpen).sort((a, b) => valueForTotals(b) - valueForTotals(a));
  const priced = open.filter((position) => position.marketValueEur !== null);
  return {
    open,
    inactive: positions.filter((position) => !isOpen(position)),
    costEur: total(open, (position) => position.costEur),
    valueEur: total(open, valueForTotals),
    unrealizedEur: total(priced, (position) => position.unrealizedEur ?? 0),
    pricedCostEur: total(priced, (position) => position.costEur),
    unpricedCount: open.length - priced.length,
  };
}

// Calendar year

export interface MonthRealized {
  /** `YYYY-MM`. */
  month: string;
  dividendsEur: number;
  salesEur: number;
}

export interface YearSummary {
  /** Newest first. */
  sales: Sale[];
  /** Newest first. */
  dividends: DividendOperation[];
  gainsEur: number;
  /** Positive amount. */
  lossesEur: number;
  dividendGrossEur: number;
  withholdingOriginEur: number;
  withholdingSpainEur: number;
  dividendFeesEur: number;
  dividendNetEur: number;
  totalEur: number;
  byMonth: MonthRealized[];
}

const inYear = (date: ISODate, year: number) => date.startsWith(`${year}-`);
const newestFirst = (a: { date: ISODate; id: string }, b: { date: ISODate; id: string }) =>
  a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.id < b.id ? -1 : 1;

function allSales(operations: readonly InvestmentTransaction[]): Sale[] {
  const byInstrument = new Map<string, InvestmentTransaction[]>();
  for (const op of operations) byInstrument.set(op.instrumentId, [...(byInstrument.get(op.instrumentId) ?? []), op]);
  return [...byInstrument.values()].flatMap((ops) => replayInstrument(ops).sales);
}

/** What was realized in a calendar year: sales and dividends dated in it. Not a tax return. */
export function yearSummary(operations: readonly InvestmentTransaction[], year: number): YearSummary {
  const sales = allSales(operations)
    .filter((sale) => inYear(sale.date, year))
    .sort(newestFirst);
  const dividends = operations
    .filter((op): op is DividendOperation => op.type === "dividend" && inYear(op.date, year))
    .sort(newestFirst);
  const gainsEur = total(sales, (sale) => Math.max(0, sale.gainEur));
  const lossesEur = total(sales, (sale) => Math.max(0, -sale.gainEur));
  const dividendNet = total(dividends, dividendNetEur);
  const byMonth = Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, "0")}`;
    return {
      month,
      dividendsEur: total(dividends.filter((op) => op.date.startsWith(month)), dividendNetEur),
      salesEur: total(sales.filter((sale) => sale.date.startsWith(month)), (sale) => sale.gainEur),
    };
  });
  return {
    sales,
    dividends,
    gainsEur,
    lossesEur,
    dividendGrossEur: total(dividends, (op) => op.eur.gross),
    withholdingOriginEur: total(dividends, (op) => op.eur.withholdingOrigin),
    withholdingSpainEur: total(dividends, (op) => op.eur.withholdingSpain),
    dividendFeesEur: total(dividends, (op) => op.eur.fee),
    dividendNetEur: dividendNet,
    totalEur: cents(gainsEur - lossesEur + dividendNet),
    byMonth,
  };
}

/** Years with a sale or a dividend, plus `current`. Newest first. */
export function realizedYears(operations: readonly InvestmentTransaction[], current: number): number[] {
  const years = new Set([current]);
  for (const op of operations) if (op.type !== "buy") years.add(Number(op.date.slice(0, 4)));
  return [...years].sort((a, b) => b - a);
}
