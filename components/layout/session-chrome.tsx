"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/indicators";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/i18n-provider";
import { hrefFor } from "@/components/layout/navigation";
import { createBook, deleteAccount, listBooks, listInvites, respondToInvite, signOut, type Person } from "@/lib/session/placeholders";

function Unavailable({ message }: { message: string }) {
  return (
    <p role="status" className="text-sm text-danger">
      {message}
    </p>
  );
}

export function NoBooks() {
  const { dict } = useI18n();
  const text = dict.shell;
  const [name, setName] = useState("Personal");
  const [problem, setProblem] = useState<"name" | "unavailable" | "invite" | null>(null);
  const invites = listInvites();

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setProblem("name");
      return;
    }
    setProblem(createBook(trimmed).ok ? null : "unavailable");
  };

  const answer = (id: string, accept: boolean) => {
    setProblem(respondToInvite(id, accept).ok ? null : "invite");
  };

  return (
    <section className="mx-auto flex max-w-md flex-col gap-4">
      <EmptyState>{text.noBooks}</EmptyState>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {text.bookName}
        <Input className="h-11" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <Button variant="primary" className="min-h-11" onClick={create}>
        {text.createBook}
      </Button>
      {problem === "name" ? <Unavailable message={text.createBookNeedsName} /> : null}
      {problem === "unavailable" ? <Unavailable message={text.createBookUnavailable} /> : null}
      {invites.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">{text.pendingInvites}</h2>
          <ul className="flex flex-col gap-2">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-sm">{invite.bookName}</span>
                <Button className="min-h-11" onClick={() => answer(invite.id, true)}>
                  {text.acceptInvite}
                </Button>
                <Button className="min-h-11" onClick={() => answer(invite.id, false)}>
                  {text.declineInvite}
                </Button>
              </li>
            ))}
          </ul>
          {problem === "invite" ? <Unavailable message={text.inviteUnavailable} /> : null}
        </div>
      ) : null}
    </section>
  );
}

export function BooksUnknown() {
  const { dict } = useI18n();
  const text = dict.shell;
  const [failed, setFailed] = useState(true);

  const retry = () => {
    setFailed(!listBooks().ok);
  };

  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-4 py-6">
      {failed ? <Unavailable message={text.booksUnknown} /> : null}
      <Button variant="primary" className="min-h-11" onClick={retry}>
        {text.retry}
      </Button>
    </section>
  );
}

export function BookUnavailable() {
  const { dict } = useI18n();
  return (
    <section className="mx-auto max-w-md py-6">
      <EmptyState>{dict.shell.bookUnavailable}</EmptyState>
    </section>
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

  const confirmOut = () => {
    setError(signOut().ok ? null : text.signOutUnavailable);
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
