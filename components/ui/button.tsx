import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "border-primary bg-primary text-primary-fg hover:brightness-110",
  outline: "border-border bg-surface text-fg hover:bg-surface-2",
  ghost: "border-transparent bg-transparent text-fg hover:bg-surface-2",
  danger: "border-transparent bg-transparent text-danger hover:bg-danger/10",
} as const;

const SIZES = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-[13px]",
  icon: "size-10 text-base",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}

export function Button({ className, type = "button", variant = "outline", size = "md", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border font-semibold transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
