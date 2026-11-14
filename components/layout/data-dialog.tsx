"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmButton, Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { clearTransactions, loadDemoData } from "@/lib/store/actions";

export function DataDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dict } = useI18n();
  const toast = useToast();
  const text = dict.data;

  const run = (action: () => void, message: string) => {
    action();
    onClose();
    toast(message);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <header className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
        <div>
          <h2 className="text-[17px] font-semibold">{text.title}</h2>
          <p className="text-sm text-muted">{text.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label={dict.common.close}>
          <X size={18} />
        </Button>
      </header>
      <div className="flex flex-col gap-5 p-5">
        <section className="flex flex-col items-start gap-2">
          <h3 className="font-semibold">{text.loadDemo}</h3>
          <p className="text-sm text-muted">{text.loadDemoHint}</p>
          <ConfirmButton
            label={text.loadDemo}
            confirmLabel={text.loadDemoConfirm}
            onConfirm={() => run(() => loadDemoData(dict.seed), text.demoLoaded)}
          />
        </section>
        <section className="flex flex-col items-start gap-2">
          <h3 className="font-semibold">{text.clearTransactions}</h3>
          <p className="text-sm text-muted">{text.clearTransactionsHint}</p>
          <ConfirmButton
            label={text.clearTransactions}
            confirmLabel={text.clearTransactionsConfirm}
            onConfirm={() => run(clearTransactions, text.transactionsCleared)}
          />
        </section>
      </div>
    </Dialog>
  );
}
