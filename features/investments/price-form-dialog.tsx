"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { today } from "@/lib/domain/dates";
import { parseDecimal } from "@/lib/domain/money";
import type { Instrument } from "@/lib/domain/types";
import { setInstrumentPrice } from "@/lib/store/actions";
import { failureMessage } from "./save-message";

export function PriceFormDialog({ open, instrument, onClose }: { open: boolean; instrument: Instrument; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <PriceForm instrument={instrument} onClose={onClose} />
    </Dialog>
  );
}

function PriceForm({ instrument, onClose }: { instrument: Instrument; onClose: () => void }) {
  const { dict, format } = useI18n();
  const toast = useToast();
  const text = dict.investments;
  const inEuros = instrument.currency === "EUR";
  const [value, setValue] = useState(instrument.price ? String(instrument.price.value) : "");
  const [eurRate, setEurRate] = useState(inEuros ? "1" : instrument.price ? String(instrument.price.eurRate) : "");
  const [date, setDate] = useState(today());
  const price = parseDecimal(value);
  const rate = parseDecimal(eurRate);
  const ready = price !== null && price > 0 && rate !== null && rate > 0 && date !== "";

  const submit = () => {
    if (!ready) return;
    const failure = failureMessage(setInstrumentPrice(instrument.id, { value: price, eurRate: rate, date }, instrument.version ?? 1), dict);
    toast(failure ?? text.priceSaved);
    if (!failure) onClose();
  };

  return (
    <DialogForm
      title={format.message(text.priceTitle, { ticker: instrument.ticker })}
      submitLabel={dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!ready}
    >
      <Field label={format.message(text.priceValue, { currency: instrument.currency })}>
        <Input type="number" inputMode="decimal" step="any" min="0" required data-autofocus value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      {inEuros ? null : (
        <Field label={format.message(text.eurRate, { currency: instrument.currency })} hint={text.eurRateHint}>
          <Input type="number" inputMode="decimal" step="any" min="0" required value={eurRate} onChange={(e) => setEurRate(e.target.value)} />
        </Field>
      )}
      <Field label={text.priceDate}>
        <Input type="date" required max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
