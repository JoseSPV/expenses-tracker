"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { clearAllData, loadDemoData } from "@/lib/store/actions";
import { useTrialImport } from "@/lib/store/use-trial-import";
import { trialImportMessage } from "./trial-import-message";

export function DataView() {
  const { dict } = useI18n();
  const toast = useToast();
  const text = dict.data;
  const trialImport = useTrialImport();

  const run = (action: () => void, message: string) => {
    action();
    toast(message);
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <p className="text-sm text-muted">{text.description}</p>
      {trialImport.available ? (
        <Card className="flex flex-col items-start gap-2">
          <h2 className="text-base font-semibold">{text.importTitle}</h2>
          <p className="text-sm text-muted">{text.importHint}</p>
          <Button variant="primary" onClick={() => toast(trialImportMessage(trialImport.importTrial(), text))}>
            {text.importAction}
          </Button>
        </Card>
      ) : null}
      <Card className="flex flex-col items-start gap-2">
        <h2 className="text-base font-semibold">{text.loadDemo}</h2>
        <p className="text-sm text-muted">{text.loadDemoHint}</p>
        <ConfirmButton
          label={text.loadDemo}
          confirmLabel={text.loadDemoConfirm}
          onConfirm={() => run(() => loadDemoData(dict.seed), text.demoLoaded)}
        />
      </Card>
      <Card className="flex flex-col items-start gap-2">
        <h2 className="text-base font-semibold">{text.clearAll}</h2>
        <p className="text-sm text-muted">{text.clearAllHint}</p>
        <ConfirmButton
          label={text.clearAll}
          confirmLabel={text.clearAllConfirm}
          onConfirm={() => run(clearAllData, text.allCleared)}
        />
      </Card>
    </div>
  );
}
