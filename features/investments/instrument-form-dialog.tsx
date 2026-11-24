"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import type { Instrument } from "@/lib/domain/types";
import { deleteInstrument, saveInstrument } from "@/lib/store/actions";
import { failureMessage } from "./save-message";

interface InstrumentFormDialogProps {
  open: boolean;
  instrument?: Instrument;
  operationCount?: number;
  onClose: () => void;
  onDeleted?: () => void;
}

export function InstrumentFormDialog({ open, onClose, ...props }: InstrumentFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <InstrumentForm onClose={onClose} {...props} />
    </Dialog>
  );
}

function InstrumentForm({ instrument, operationCount = 0, onClose, onDeleted }: Omit<InstrumentFormDialogProps, "open">) {
  const { dict, format } = useI18n();
  const toast = useToast();
  const text = dict.investments;
  const [ticker, setTicker] = useState(instrument?.ticker ?? "");
  const [name, setName] = useState(instrument?.name ?? "");
  const [currency, setCurrency] = useState(instrument?.currency ?? "EUR");
  const currencyLocked = Boolean(instrument) && operationCount > 0;
  const ready = ticker.trim() !== "" && name.trim() !== "" && /^[A-Za-z]{3}$/.test(currency.trim());

  const submit = () => {
    const result = saveInstrument({ ticker, name, currency }, instrument?.id, instrument?.version ?? 1);
    const failure = failureMessage(result, dict);
    if (failure) {
      toast(failure);
      return;
    }
    toast(text.instrumentSaved);
    onClose();
  };

  const remove = () => {
    if (!instrument) return;
    const failure = failureMessage(deleteInstrument(instrument.id, instrument.version ?? 1), dict);
    toast(failure ?? text.instrumentDeleted);
    if (failure) return;
    onClose();
    onDeleted?.();
  };

  return (
    <DialogForm
      title={instrument ? text.editInstrumentTitle : text.newInstrumentTitle}
      submitLabel={instrument ? dict.common.saveChanges : dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!ready}
      onDelete={instrument ? remove : undefined}
    >
      <Field label={text.ticker}>
        <Input required data-autofocus placeholder={text.tickerPlaceholder} value={ticker} onChange={(e) => setTicker(e.target.value)} />
      </Field>
      <Field label={dict.common.name}>
        <Input required placeholder={text.instrumentNamePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={text.currency} hint={currencyLocked ? undefined : text.currencyHint}>
        <Input
          required
          maxLength={3}
          autoCapitalize="characters"
          disabled={currencyLocked}
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
        />
      </Field>
      {currencyLocked ? <p className="text-[13px] text-muted">{text.currencyLocked}</p> : null}
      {instrument && operationCount > 0 ? (
        <p className="text-[13px] text-muted">{format.plural(text.deleteInstrumentWarning, operationCount)}</p>
      ) : null}
    </DialogForm>
  );
}
