"use client";

import { useMemo, useState } from "react";
import { hasOwnData, isEmptyDocument } from "@/lib/books/trial-import";
import { importTrial } from "./actions";
import { dismissTrialImport, isTrialImportDismissed, readTrialDocument } from "./app-store";
import { useAppData } from "./use-app-data";

/** `available` while the account is empty and this browser's trial holds something the person wrote. */
export function useTrialImport() {
  const data = useAppData();
  const [dismissed, setDismissed] = useState(() => typeof window !== "undefined" && isTrialImportDismissed());
  const available = useMemo(() => {
    if (!data || !isEmptyDocument(data)) return false;
    const trial = readTrialDocument();
    return trial !== null && hasOwnData(trial);
  }, [data]);

  const dismiss = () => {
    dismissTrialImport();
    setDismissed(true);
  };

  return { available, dismissed, importTrial, dismiss };
}
