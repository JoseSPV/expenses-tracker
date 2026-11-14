"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/i18n/i18n-provider";
import { Button } from "./button";

/**
 * Native `<dialog>` driven by `open`. Content mounts only while open, so form state resets each time.
 * Mark the field to focus with `data-autofocus`: React's `autoFocus` fires before `showModal()` and loses focus.
 */
export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-2xl bg-surface p-0 text-fg shadow-2xl"
    >
      {open ? children : null}
    </dialog>
  );
}

interface DialogFormProps {
  title: string;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  submitDisabled?: boolean;
  children: ReactNode;
}

/** Standard dialog layout: header, fields, and footer with delete / cancel / submit. */
export function DialogForm({ title, submitLabel, onSubmit, onCancel, onDelete, submitDisabled, children }: DialogFormProps) {
  const { dict } = useI18n();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <header className="flex items-center justify-between gap-2 border-b px-5 py-3.5">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label={dict.common.close}>
          <X size={18} />
        </Button>
      </header>
      <div className="flex flex-col gap-3.5 p-5">{children}</div>
      <footer className="flex items-center gap-2 border-t px-5 py-3.5">
        {onDelete ? <DeleteButton onConfirm={onDelete} /> : null}
        <span className="flex-1" />
        <Button variant="ghost" onClick={onCancel}>
          {dict.common.cancel}
        </Button>
        <Button type="submit" variant="primary" disabled={submitDisabled}>
          {submitLabel}
        </Button>
      </footer>
    </form>
  );
}

/** Two-step destructive action: the first click arms it, the second confirms. Blur disarms. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  return (
    <Button
      variant={armed ? "primary" : "danger"}
      className={className}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      onBlur={() => setArmed(false)}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}

export function DeleteButton({ onConfirm }: { onConfirm: () => void }) {
  const { dict } = useI18n();
  return <ConfirmButton label={dict.common.delete} confirmLabel={dict.common.confirmDelete} onConfirm={onConfirm} />;
}
