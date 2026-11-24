import type { Dictionary } from "@/i18n/types";
import type { InvestmentSaveResult } from "@/lib/store/actions";

/** The toast for a failed write. `null` when it was saved. */
export function failureMessage(result: InvestmentSaveResult, dict: Dictionary, oversold = dict.investments.oversold): string | null {
  switch (result) {
    case "saved":
      return null;
    case "duplicate":
      return dict.investments.duplicateTicker;
    case "oversold":
      return oversold;
    case "conflict":
      return dict.investments.conflict;
    case "invalid":
      return dict.common.notSaved;
  }
}
