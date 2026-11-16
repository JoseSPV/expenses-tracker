"use client";

import { useState } from "react";
import { Dialog, DialogForm } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/i18n/i18n-provider";
import { parseMoney } from "@/lib/domain/money";
import type { Account, AccountKind } from "@/lib/domain/types";
import { deleteAccount, saveAccount } from "@/lib/store/actions";

export function AccountFormDialog({ open, account, kind, onClose }: { open: boolean; account?: Account; kind: AccountKind; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <AccountForm account={account} defaultKind={kind} onClose={onClose} />
    </Dialog>
  );
}

function AccountForm({ account, defaultKind, onClose }: { account?: Account; defaultKind: AccountKind; onClose: () => void }) {
  const { dict } = useI18n();
  const toast = useToast();
  const text = dict.netWorth;
  const [name, setName] = useState(account?.name ?? "");
  const [kind, setKind] = useState<AccountKind>(account?.kind ?? defaultKind);
  const [balance, setBalance] = useState(account ? String(account.balance) : "");
  const parsed = parseMoney(balance);

  const submit = () => {
    if (!name.trim() || parsed === null || !saveAccount({ name: name.trim(), kind, balance: parsed }, account?.id)) {
      toast(dict.common.notSaved);
      return;
    }
    onClose();
  };

  return (
    <DialogForm
      title={account ? text.editTitle : defaultKind === "asset" ? text.newAsset : text.newLiability}
      submitLabel={account ? dict.common.saveChanges : dict.common.save}
      onSubmit={submit}
      onCancel={onClose}
      submitDisabled={!name.trim() || parsed === null}
      onDelete={
        account
          ? () => {
              deleteAccount(account.id);
              onClose();
            }
          : undefined
      }
    >
      <Field label={dict.common.name}>
        <Input required data-autofocus placeholder={text.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={text.kind}>
        <Select value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
          <option value="asset">{text.asset}</option>
          <option value="liability">{text.liability}</option>
        </Select>
      </Field>
      <Field label={text.balance}>
        <Input type="number" inputMode="decimal" step="0.01" min="0" required value={balance} onChange={(e) => setBalance(e.target.value)} />
      </Field>
    </DialogForm>
  );
}
