"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { hrefFor } from "@/components/layout/navigation";
import { usePerson } from "@/components/layout/person-context";
import { useI18n } from "@/i18n/i18n-provider";
import { signInProblem } from "@/lib/session/google-sign-in";
import { deleteAccount } from "@/lib/session/placeholders";
import { signOutOfGoogle } from "@/lib/session/sign-out";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function subscribeToNothing() {
  return () => {};
}

function googleReturn(): "error" | "denied" | null {
  const value = new URLSearchParams(window.location.search).get("auth");
  if (value === "error" || value === "denied") return value;
  return null;
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
        {error ? (
          <p role="status" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
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

export function ProfileView() {
  const person = usePerson();
  const { dict, locale } = useI18n();
  const text = dict.shell;
  const returned = useSyncExternalStore(subscribeToNothing, googleReturn, () => null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dialog, setDialog] = useState<"out" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const returnedMessage = returned === "denied" ? text.signInDenied : returned === "error" ? text.signInFailed : null;
  const shown = message ?? returnedMessage;

  const openBooks = async () => {
    const problem = signInProblem({ online: navigator.onLine, configured: isSupabaseConfigured() });
    if (problem === "offline") {
      setMessage(text.signInOffline);
      return;
    }
    if (problem) {
      setMessage(text.signInUnavailable);
      return;
    }
    setMessage(null);
    setPending(true);
    const { error: signInError } = await createBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (signInError) {
      setPending(false);
      setMessage(text.signInFailed);
    }
  };

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
    <div className="flex max-w-xl flex-col gap-4">
      <Card className="flex flex-col items-start gap-3">
        {person ? (
          <>
            <div>
              <h2 className="text-base font-semibold">{person.name}</h2>
              <p className="text-sm text-muted">{person.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="min-h-11" onClick={() => setDialog("out")}>
                {text.signOut}
              </Button>
              <Button variant="danger" className="min-h-11" onClick={() => setDialog("delete")}>
                {text.deleteAccount}
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold">{text.signedOut}</h2>
            <Button variant="primary" className="min-h-11" onClick={openBooks} disabled={pending} aria-busy={pending}>
              {text.yourBooks}
            </Button>
            {shown ? (
              <p role="status" className="text-sm text-danger">
                {shown}
              </p>
            ) : null}
          </>
        )}
        <Link href={hrefFor(locale, "privacy")} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">
          {text.privacy}
        </Link>
      </Card>
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
