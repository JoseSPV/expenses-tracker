import { today } from "@/lib/domain/dates";
import { parseDecimal, parseMoney } from "@/lib/domain/money";
import { dividendNetEur, proposeDividendEur, proposeTradeEur, tradeTotalEur } from "@/lib/domain/portfolio";
import type { Instrument, InvestmentOperationType, InvestmentTransaction } from "@/lib/domain/types";
import type { InvestmentOperationInput } from "@/lib/store/actions";

/** Raw field values, as typed. */
export interface OperationForm {
  type: InvestmentOperationType;
  instrumentId: string;
  date: string;
  quantity: string;
  unitPrice: string;
  gross: string;
  withholdingOrigin: string;
  withholdingSpain: string;
  fee: string;
  feeCurrency: string;
  eurRate: string;
  eurGross: string;
  eurFee: string;
  eurWithholdingOrigin: string;
  note: string;
}

/** Changing any of these proposes the EUR figures again, overwriting a manual correction. */
const PROPOSAL_INPUTS = new Set<keyof OperationForm>(["type", "instrumentId", "quantity", "unitPrice", "gross", "withholdingOrigin", "fee", "feeCurrency", "eurRate"]);

const text = (value: number | undefined) => (value === undefined ? "" : String(value));

export function initialForm(operation: InvestmentTransaction | undefined, instrument: Instrument | undefined): OperationForm {
  if (operation) {
    const trade = operation.type === "dividend" ? undefined : operation;
    const dividend = operation.type === "dividend" ? operation : undefined;
    return {
      type: operation.type,
      instrumentId: operation.instrumentId,
      date: operation.date,
      quantity: text(trade?.quantity),
      unitPrice: text(trade?.unitPrice),
      gross: text(dividend?.gross),
      withholdingOrigin: text(dividend?.withholdingOrigin),
      withholdingSpain: text(dividend?.eur.withholdingSpain),
      fee: text(operation.fee.amount),
      feeCurrency: operation.fee.currency,
      eurRate: text(operation.eurRate),
      eurGross: text(operation.eur.gross),
      eurFee: text(operation.eur.fee),
      eurWithholdingOrigin: text(dividend?.eur.withholdingOrigin),
      note: operation.note,
    };
  }
  return {
    type: "buy",
    instrumentId: instrument?.id ?? "",
    date: today(),
    quantity: "",
    unitPrice: "",
    gross: "",
    withholdingOrigin: "",
    withholdingSpain: "",
    fee: "0",
    feeCurrency: "EUR",
    eurRate: instrument?.currency === "EUR" ? "1" : "",
    eurGross: "",
    eurFee: "",
    eurWithholdingOrigin: "",
    note: "",
  };
}

function propose(form: OperationForm): OperationForm {
  const eurRate = parseDecimal(form.eurRate);
  const fee = { amount: parseDecimal(form.fee) ?? 0, currency: form.feeCurrency };
  if (eurRate === null) return form;
  if (form.type === "dividend") {
    const gross = parseDecimal(form.gross);
    if (gross === null) return form;
    const eur = proposeDividendEur({ gross, withholdingOrigin: parseDecimal(form.withholdingOrigin) ?? 0, eurRate, fee }, 0);
    return { ...form, eurGross: text(eur.gross), eurWithholdingOrigin: text(eur.withholdingOrigin), eurFee: text(eur.fee) };
  }
  const quantity = parseDecimal(form.quantity);
  const unitPrice = parseDecimal(form.unitPrice);
  if (quantity === null || unitPrice === null) return form;
  const eur = proposeTradeEur({ quantity, unitPrice, eurRate, fee });
  return { ...form, eurGross: text(eur.gross), eurFee: text(eur.fee) };
}

/** Applies a field change, keeps currency-dependent fields valid, and re-proposes EUR when an input to it changed. */
export function updateForm(form: OperationForm, patch: Partial<OperationForm>, instrument: Instrument | undefined): OperationForm {
  const next = { ...form, ...patch };
  if (instrument?.currency === "EUR") next.eurRate = "1";
  if (next.feeCurrency !== "EUR" && next.feeCurrency !== instrument?.currency) next.feeCurrency = "EUR";
  const reproposes = (Object.keys(patch) as (keyof OperationForm)[]).some((key) => PROPOSAL_INPUTS.has(key));
  return reproposes ? propose(next) : next;
}

/** `null` until every required field parses. */
export function toInput(form: OperationForm): InvestmentOperationInput | null {
  const eurRate = parseDecimal(form.eurRate);
  const fee = parseDecimal(form.fee || "0");
  const eurGross = parseMoney(form.eurGross);
  const eurFee = parseMoney(form.eurFee || "0");
  if (!form.instrumentId || !form.date || eurRate === null || fee === null || eurGross === null || eurFee === null) return null;
  const common = { instrumentId: form.instrumentId, date: form.date, eurRate, fee: { amount: fee, currency: form.feeCurrency }, note: form.note };
  if (form.type === "dividend") {
    const gross = parseDecimal(form.gross);
    const withholdingOrigin = parseDecimal(form.withholdingOrigin || "0");
    const eurWithholdingOrigin = parseMoney(form.eurWithholdingOrigin || "0");
    const withholdingSpain = parseMoney(form.withholdingSpain || "0");
    if (gross === null || withholdingOrigin === null || eurWithholdingOrigin === null || withholdingSpain === null) return null;
    return {
      ...common,
      type: "dividend",
      gross,
      withholdingOrigin,
      eur: { gross: eurGross, withholdingOrigin: eurWithholdingOrigin, withholdingSpain, fee: eurFee },
    };
  }
  const quantity = parseDecimal(form.quantity);
  const unitPrice = parseDecimal(form.unitPrice);
  if (quantity === null || unitPrice === null) return null;
  return { ...common, type: form.type, quantity, unitPrice, eur: { gross: eurGross, fee: eurFee } };
}

/** What the operation costs, brings in, or pays out, in EUR. */
export const eurTotal = (input: InvestmentOperationInput): number =>
  input.type === "dividend" ? dividendNetEur(input) : tradeTotalEur(input);
