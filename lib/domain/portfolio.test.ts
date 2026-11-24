import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasOversold,
  portfolioSummary,
  positionOf,
  proposeDividendEur,
  proposeTradeEur,
  realizedYears,
  replayInstrument,
  valueForTotals,
  yearSummary,
} from "./portfolio.ts";
import type { DividendOperation, Instrument, TradeOperation } from "./types.ts";

const eurFee = (amount = 0) => ({ amount, currency: "EUR" });

function trade(
  type: "buy" | "sell",
  id: string,
  date: string,
  quantity: number,
  unitPrice: number,
  options: { eurRate?: number; fee?: { amount: number; currency: string }; eur?: TradeOperation["eur"] } = {},
): TradeOperation {
  const eurRate = options.eurRate ?? 1;
  const fee = options.fee ?? eurFee();
  return {
    type,
    id,
    instrumentId: "acme",
    date,
    quantity,
    unitPrice,
    eurRate,
    fee,
    note: "",
    eur: options.eur ?? proposeTradeEur({ quantity, unitPrice, eurRate, fee }),
  };
}

function dividend(id: string, date: string, gross: number, withholdingOrigin: number, withholdingSpain: number): DividendOperation {
  const base = { gross, withholdingOrigin, eurRate: 1, fee: eurFee() };
  return { type: "dividend", id, instrumentId: "acme", date, note: "", ...base, eur: proposeDividendEur(base, withholdingSpain) };
}

const acme: Instrument = { id: "acme", ticker: "ACME", name: "Acme", currency: "EUR", color: "#000" };

describe("replayInstrument", () => {
  it("charges a partial sale its share of the lot, fees included", () => {
    const replay = replayInstrument([
      trade("buy", "b1", "2026-01-10", 10, 10, { fee: eurFee(1) }),
      trade("sell", "s1", "2026-03-10", 4, 15, { fee: eurFee(1) }),
    ]);

    assert.equal(replay.sales[0]?.proceedsEur, 59);
    assert.equal(replay.sales[0]?.costEur, 40.4);
    assert.equal(replay.sales[0]?.gainEur, 18.6);
    assert.deepEqual(replay.lots, [{ buyDate: "2026-01-10", quantity: 6, costEur: 60.6 }]);
  });

  it("takes the oldest lot first when a sale spans lots", () => {
    const replay = replayInstrument([
      trade("buy", "b2", "2026-02-01", 5, 20),
      trade("buy", "b1", "2026-01-01", 5, 10),
      trade("sell", "s1", "2026-04-01", 7, 30),
    ]);
    const sale = replay.sales[0];

    assert.equal(sale?.costEur, 90);
    assert.equal(sale?.gainEur, 120);
    assert.deepEqual(
      sale?.lots.map((lot) => [lot.buyDate, lot.quantity]),
      [
        ["2026-01-01", 5],
        ["2026-02-01", 2],
      ],
    );
  });

  it("uses each day's rate for a USD holding", () => {
    const replay = replayInstrument([
      trade("buy", "b1", "2026-01-10", 10, 100, { eurRate: 0.9, fee: { amount: 1, currency: "USD" } }),
      trade("sell", "s1", "2026-06-10", 10, 110, { eurRate: 0.95, fee: eurFee(2) }),
    ]);

    assert.equal(replay.sales[0]?.costEur, 900.9);
    assert.equal(replay.sales[0]?.proceedsEur, 1043);
    assert.equal(replay.sales[0]?.gainEur, 142.1);
  });

  it("keeps a fee paid in EUR as is on a USD trade", () => {
    assert.deepEqual(proposeTradeEur({ quantity: 10, unitPrice: 100, eurRate: 0.9, fee: eurFee(2) }), { gross: 900, fee: 2 });
  });

  it("uses the EUR figure saved by hand, not the rate", () => {
    const replay = replayInstrument([
      trade("buy", "b1", "2026-01-10", 10, 100, { eurRate: 0.9, eur: { gross: 899.5, fee: 0 } }),
      trade("sell", "s1", "2026-06-10", 10, 100, { eurRate: 0.9 }),
    ]);

    assert.equal(replay.sales[0]?.gainEur, 0.5);
  });

  it("puts a buy before a sell on the same day", () => {
    const replay = replayInstrument([trade("sell", "a", "2026-05-05", 3, 12), trade("buy", "z", "2026-05-05", 3, 10)]);

    assert.equal(replay.oversoldSaleId, undefined);
    assert.equal(replay.sales[0]?.gainEur, 6);
  });
});

describe("hasOversold", () => {
  it("flags a sale of more shares than were held", () => {
    const operations = [trade("buy", "b1", "2026-01-01", 5, 10), trade("sell", "s1", "2026-02-01", 6, 10)];

    assert.equal(hasOversold(operations, "acme"), true);
  });

  it("flags a sale left without shares when its buy is removed", () => {
    const operations = [trade("buy", "b1", "2026-01-01", 5, 10), trade("sell", "s1", "2026-02-01", 5, 10)];

    assert.equal(hasOversold(operations, "acme"), false);
    assert.equal(hasOversold(operations.slice(1), "acme"), true);
  });

  it("flags a sale dated before the buy", () => {
    const operations = [trade("buy", "b1", "2026-03-01", 5, 10), trade("sell", "s1", "2026-02-01", 5, 10)];

    assert.equal(hasOversold(operations, "acme"), true);
  });
});

describe("positions", () => {
  const operations = [trade("buy", "b1", "2026-01-01", 4, 25), dividend("d1", "2026-06-01", 10, 1.5, 1.62)];

  it("counts a position without a price at cost, never at market", () => {
    const position = positionOf(acme, operations);
    const summary = portfolioSummary([acme], operations);

    assert.equal(position.marketValueEur, null);
    assert.equal(position.unrealizedEur, null);
    assert.equal(valueForTotals(position), 100);
    assert.equal(summary.valueEur, 100);
    assert.equal(summary.unpricedCount, 1);
  });

  it("values a priced position with the price's own rate", () => {
    const priced = { ...acme, price: { value: 30, eurRate: 1, date: "2026-11-20" } };
    const position = positionOf(priced, operations);

    assert.equal(position.marketValueEur, 120);
    assert.equal(position.unrealizedEur, 20);
    assert.equal(position.averageCostEur, 25);
    assert.equal(position.dividendsNetEur, 6.88);
  });

  it("lists an instrument with no shares as inactive", () => {
    const summary = portfolioSummary([acme], []);

    assert.equal(summary.open.length, 0);
    assert.equal(summary.inactive.length, 1);
  });
});

describe("yearSummary", () => {
  const operations = [
    trade("buy", "b1", "2025-02-01", 10, 10),
    trade("sell", "s1", "2025-12-01", 2, 15),
    trade("sell", "s2", "2026-03-15", 3, 8),
    trade("sell", "s3", "2026-07-01", 2, 20),
    dividend("d1", "2026-07-20", 10, 1.5, 1.62),
  ];

  it("adds only what was sold or paid in that year", () => {
    const year = yearSummary(operations, 2026);

    assert.deepEqual(
      year.sales.map((sale) => sale.id),
      ["s3", "s2"],
    );
    assert.equal(year.gainsEur, 20);
    assert.equal(year.lossesEur, 6);
    assert.equal(year.dividendNetEur, 6.88);
    assert.equal(year.totalEur, 20.88);
    assert.equal(year.byMonth[6]?.dividendsEur, 6.88);
    assert.equal(year.byMonth[6]?.salesEur, 20);
    assert.equal(year.byMonth[2]?.salesEur, -6);
  });

  it("returns zeros and twelve months for a year with nothing", () => {
    const year = yearSummary(operations, 2024);

    assert.equal(year.totalEur, 0);
    assert.equal(year.byMonth.length, 12);
  });

  it("offers the years with sales or dividends, and the current one", () => {
    assert.deepEqual(realizedYears(operations, 2027), [2027, 2026, 2025]);
  });
});
