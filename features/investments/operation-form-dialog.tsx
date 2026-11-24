"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { today } from "@/lib/domain/dates";
import type { Instrument, InvestmentOperationType, InvestmentTransaction } from "@/lib/domain/types";
import { deleteInvestmentOperation, saveInvestmentOperation } from "@/lib/store/actions";
import { eurTotal, initialForm, toInput, updateForm, type OperationForm } from "./operation-form-state";
import { failureMessage } from "./save-message";

interface OperationFormDialogProps {
  open: boolean;
  instruments: Instrument[];
  operation?: InvestmentTransaction;
  defaultInstrumentId?: string;
  onClose: () => void;
}

export function OperationFormDialog({ open, onClose, ...props }: OperationFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <OperationFormBody onClose={onClose} {...props} />
    </Dialog>
  );
}

const TYPES: InvestmentOperationType[] = ["buy", "sell", "dividend"];

function MoneyInput({ value, onChange, step = "0.01", ...rest }: { value: string; onChange: (value: string) => void; step?: string; required?: boolean }) {
  return <Input type="number" inputMode="decimal" min="0" step={step} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

function OperationFormBody({ instruments, operation, defaultInstrumentId, onClose }: Omit<OperationFormDialogProps, "open">) {
  const { dict, format } = useI18n();
  const toast = useToast();
  const text = dict.investments;
  const [form, setForm] = useState<OperationForm>(() =>
    initialForm(operation, instruments.find((item) => item.id === defaultInstrumentId) ?? instruments[0]),
  );
  const instrument = instruments.find((item) => item.id === form.instrumentId);
  const currency = instrument?.currency ?? "EUR";
  const foreign = currency !== "EUR";
  const input = toInput(form);
  const set = (patch: Partial<OperationForm>) =>
    setForm((current) => updateForm(current, patch, instruments.find((item) => item.id === (patch.instrumentId ?? current.instrumentId))));
  const field = (key: keyof OperationForm) => ({ value: form[key], onChange: (value: string) => set({ [key]: value }) });
  const withCurrency = (template: string) => format.message(template, { currency });

  const submit = () => {
    if (!input) return;
    const failure = failureMessage(saveInvestmentOperation(input, operation?.id, operation?.version ?? 1), dict);
    toast(failure ?? text.operationSaved);
    if (!failure) onClose();
  };

  const remove = () => {
    if (!operation) return;
    const failure = failureMessage(deleteInvestmentOperation(operation.id, operation.version ?? 1), dict, text.oversoldDelete);
    toast(failure ?? text.operationDeleted);
    if (!failure) onClose();
  };

  const totalTemplate = { buy: text.eurTotalBuy, sell: text.eurTotalSell, dividend: text.eurTotalDividend }[form.type];

  return (
    <DialogForm
      title={operation ? text.editOperationTitle : text.newOperationTitle}
      submitLabel={operation ? dict.common.saveChanges : dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!input}
      onDelete={operation ? remove : undefined}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label={text.type}>
          <Select data-autofocus value={form.type} onChange={(e) => set({ type: e.target.value as InvestmentOperationType })}>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {text.types[type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={text.date}>
          <Input type="date" required max={today()} value={form.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
      </div>
      <Field label={text.instrument}>
        <Select disabled={Boolean(operation)} value={form.instrumentId} onChange={(e) => set({ instrumentId: e.target.value })}>
          {instruments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.ticker} · {item.name}
            </option>
          ))}
        </Select>
      </Field>

      {form.type === "dividend" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={withCurrency(text.gross)}>
              <MoneyInput required step="any" {...field("gross")} />
            </Field>
            <Field label={withCurrency(text.withholdingOrigin)}>
              <MoneyInput step="any" {...field("withholdingOrigin")} />
            </Field>
          </div>
          <Field label={text.withholdingSpain}>
            <MoneyInput {...field("withholdingSpain")} />
          </Field>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Field label={text.quantity}>
            <MoneyInput required step="any" {...field("quantity")} />
          </Field>
          <Field label={withCurrency(text.unitPrice)}>
            <MoneyInput required step="any" {...field("unitPrice")} />
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={text.fee}>
          <MoneyInput step="any" {...field("fee")} />
        </Field>
        <Field label={text.feeCurrency}>
          <Select value={form.feeCurrency} disabled={!foreign} onChange={(e) => set({ feeCurrency: e.target.value })}>
            <option value="EUR">EUR</option>
            {foreign ? <option value={currency}>{currency}</option> : null}
          </Select>
        </Field>
      </div>
      {foreign ? (
        <Field label={withCurrency(text.eurRate)} hint={text.eurRateHint}>
          <MoneyInput required step="any" {...field("eurRate")} />
        </Field>
      ) : null}

      <fieldset className="flex flex-col gap-3 rounded-[10px] border p-3">
        <legend className="px-1 text-[13px] font-semibold">{text.inEuros}</legend>
        <p className="text-[13px] text-muted">{text.inEurosHint}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={text.eurGross}>
            <MoneyInput required {...field("eurGross")} />
          </Field>
          <Field label={text.eurFee}>
            <MoneyInput {...field("eurFee")} />
          </Field>
        </div>
        {form.type === "dividend" ? (
          <Field label={text.eurWithholdingOrigin}>
            <MoneyInput {...field("eurWithholdingOrigin")} />
          </Field>
        ) : null}
        {input ? <strong className="text-sm tabular-nums">{format.message(totalTemplate, { amount: format.money(eurTotal(input)) })}</strong> : null}
      </fieldset>

      <Field label={text.note}>
        <Input placeholder={text.notePlaceholder} value={form.note} onChange={(e) => set({ note: e.target.value })} />
      </Field>
    </DialogForm>
  );
}
