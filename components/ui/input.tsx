import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "h-10 w-full rounded-[10px] border bg-bg px-3 text-[15px] text-fg placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type={type} className={cn(CONTROL, type === "color" && "w-18 p-1", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(CONTROL, className)} {...props} />;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-muted">
      <span>
        {label}
        {hint ? <small className="font-normal"> · {hint}</small> : null}
      </span>
      {children}
    </label>
  );
}
