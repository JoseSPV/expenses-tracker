import type { Dictionary } from "@/i18n/types";
import type { TrialImportResult } from "@/lib/books/trial-import";

export function trialImportMessage(result: TrialImportResult["result"], text: Dictionary["data"]): string {
  if (result === "imported") return text.imported;
  if (result === "notEmpty") return text.importNotEmpty;
  return text.importNothing;
}
