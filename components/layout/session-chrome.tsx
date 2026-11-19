"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/i18n-provider";
import { hrefFor } from "@/components/layout/navigation";
import { signOutOfGoogle } from "@/lib/session/sign-out";
import { deleteAccount, type Person } from "@/lib/session/placeholders";

function Unavailable({ message }: { message: string }) {
  return (
    <p role="status" className="text-sm text-danger">
      {message}
    </p>
  );
}

function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { dict } = useI18n();

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col gap-4 p-5">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <p className="text-sm leading-relaxed">{body}</p>
        {error ? <Unavailable message={error} /> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button className="min-h-11" data-autofocus onClick={onClose}>
            {dict.common.cancel}
          </Button>
          <Button variant="danger" className="min-h-11" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/** Name, privacy, sign-out, and delete-account. Shown only when a person is signed in. */
export function SignedInBar({ person }: { person: Person }) {
  const { dict, locale } = useI18n();
  const text = dict.shell;
  const [dialog, setDialog] = useState<"out" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setDialog(null);
    setError(null);
  };

  const confirmOut = async () => {
    const result = await signOutOfGoogle();
    if (!result.ok) setError(text.signOutUnavailable);
  };

  const confirmDelete = () => {
    setError(deleteAccount().ok ? null : text.deleteAccountUnavailable);
  };

  return (
    <div className="flex w-full basis-full flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-sm font-medium">
        {person.name}
        <span className="ml-2 font-normal text-muted">{person.email}</span>
      </p>
      <Link href={hrefFor(locale, "privacy")} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
        {text.privacy}
      </Link>
      <Button className="min-h-11" onClick={() => setDialog("out")}>
        {text.signOut}
      </Button>
      <Button variant="danger" className="min-h-11" onClick={() => setDialog("delete")}>
        {text.deleteAccount}
      </Button>
      <ConfirmDialog
        open={dialog === "out"}
        title={text.signOutTitle}
        body={text.signOutBody}
        confirmLabel={text.signOut}
        error={dialog === "out" ? error : null}
        onConfirm={confirmOut}
        onClose={close}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        title={text.deleteAccountTitle}
        body={text.deleteAccountBody}
        confirmLabel={text.deleteAccount}
        error={dialog === "delete" ? error : null}
        onConfirm={confirmDelete}
        onClose={close}
      />
    </div>
  );
}
