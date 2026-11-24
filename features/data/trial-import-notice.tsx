"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { useTrialImport } from "@/lib/store/use-trial-import";
import { trialImportMessage } from "./trial-import-message";

/** Asks once per account, on any section, while the account is still empty. */
export function TrialImportNotice() {
  const { dict } = useI18n();
  const toast = useToast();
  const { available, dismissed, importTrial, dismiss } = useTrialImport();
  const text = dict.data;

  if (!available || dismissed) return null;

  return (
    <section
      aria-labelledby="trial-import-notice"
      className="mb-5 flex flex-col gap-3 rounded-2xl border border-primary/40 bg-primary/8 p-4 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 id="trial-import-notice" className="text-base font-semibold">
          {text.importTitle}
        </h2>
        <p className="text-sm text-muted">{text.importNotice}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" onClick={dismiss}>
          {text.importLater}
        </Button>
        <Button variant="primary" onClick={() => toast(trialImportMessage(importTrial(), text))}>
          {text.importAction}
        </Button>
      </div>
    </section>
  );
}
