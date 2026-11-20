"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hrefFor } from "@/components/layout/navigation";
import { useI18n } from "@/i18n/i18n-provider";
import type { Dictionary } from "@/i18n/types";

type Step = { target: string; title: string; body: string; form?: boolean };
type Chapter = { id: string; label: string; segment: string | null; steps: Step[] };

function chapters(text: Dictionary["tour"]): Chapter[] {
  return [
    {
      id: "summary",
      label: text.summary,
      segment: "",
      steps: [
        { target: "month", title: text.summaryMonthTitle, body: text.summaryMonth },
        { target: "summary-totals", title: text.summaryTotalsTitle, body: text.summaryTotals },
        { target: "summary-spending", title: text.summarySpendTitle, body: text.summarySpend },
        { target: "summary-rest", title: text.summaryRestTitle, body: text.summaryRest },
      ],
    },
    {
      id: "movement",
      label: text.movement,
      segment: null,
      steps: [
        { target: "add-transaction", title: text.movementButtonTitle, body: text.movementButton },
        { target: "movement-amount", title: text.movementAmountTitle, body: text.movementAmount, form: true },
        { target: "movement-category", title: text.movementCategoryTitle, body: text.movementCategory, form: true },
        { target: "movement-date", title: text.movementDateTitle, body: text.movementDate, form: true },
      ],
    },
    {
      id: "budgets",
      label: text.budgets,
      segment: "budgets",
      steps: [
        { target: "budget-list", title: text.budgetListTitle, body: text.budgetList },
        { target: "budget-add", title: text.budgetAddTitle, body: text.budgetAdd },
      ],
    },
    {
      id: "categories",
      label: text.categories,
      segment: "categories",
      steps: [
        { target: "category-expense", title: text.categoryExpenseTitle, body: text.categoryExpense },
        { target: "category-income", title: text.categoryIncomeTitle, body: text.categoryIncome },
      ],
    },
    {
      id: "bills",
      label: text.bills,
      segment: "bills",
      steps: [
        { target: "bill-list", title: text.billListTitle, body: text.billList },
        { target: "bill-paid", title: text.billPaidTitle, body: text.billPaid },
      ],
    },
  ];
}

function visibleTarget(name: string): HTMLElement | null {
  for (const node of document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(name)}"]`)) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }
  return null;
}

function cardPosition(anchor: DOMRect | null, card: DOMRect | null): { top: number; left: number } {
  const margin = 12;
  const width = card?.width ?? 320;
  const height = card?.height ?? 160;
  const maxLeft = Math.max(margin, window.innerWidth - width - margin);
  if (!anchor) return { top: Math.max(margin, (window.innerHeight - height) / 2), left: Math.max(margin, (window.innerWidth - width) / 2) };
  const spaceBelow = window.innerHeight - anchor.bottom - margin;
  const top = spaceBelow >= height ? anchor.bottom + margin : Math.max(margin, anchor.top - margin - height);
  const left = Math.min(Math.max(anchor.left, margin), maxLeft);
  return { top, left };
}

export function HelpTour({ pathname, onForm, onActive }: { pathname: string; onForm: (open: boolean) => void; onActive: (active: boolean) => void }) {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const text = dict.tour;
  const list = chapters(text);
  const helpRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [menu, setMenu] = useState(false);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [place, setPlace] = useState({ top: 12, left: 12 });
  const chapter = list.find((item) => item.id === chapterId) ?? null;
  const step = chapter?.steps[index] ?? null;

  useLayoutEffect(() => {
    const next = cardPosition(anchor, cardRef.current?.getBoundingClientRect() ?? null);
    setPlace((current) => (current.top === next.top && current.left === next.left ? current : next));
  }, [anchor, chapterId, index]);

  useEffect(() => {
    onActive(chapterId !== null);
  }, [chapterId, onActive]);

  useEffect(() => {
    if (!chapterId) {
      onForm(false);
      return;
    }
    const current = chapters(text).find((item) => item.id === chapterId);
    onForm(Boolean(current?.steps[index]?.form));
  }, [chapterId, index, onForm, text]);

  useEffect(() => {
    if (!menu) return;
    const close = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || helpRef.current?.contains(event.target)) return;
      setMenu(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menu]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (!layer.matches(":popover-open")) layer.showPopover();
    return () => {
      if (layer.matches(":popover-open")) layer.hidePopover();
    };
  }, [chapterId]);

  const targetName = step?.target ?? null;

  useEffect(() => {
    if (!targetName) return;
    let frame = 0;
    let tries = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const look = () => {
      const target = visibleTarget(targetName);
      if (target) {
        target.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
        const layer = layerRef.current;
        if (layer?.matches(":popover-open")) layer.hidePopover();
        layer?.showPopover();
        const next = target.getBoundingClientRect();
        setAnchor((current) => {
          if (current && current.top === next.top && current.left === next.left && current.width === next.width && current.height === next.height) return current;
          return next;
        });
        cardRef.current?.querySelector<HTMLButtonElement>("[data-tour-next]")?.focus();
        return;
      }
      if (tries++ < 90) frame = requestAnimationFrame(look);
      else setAnchor(null);
    };
    frame = requestAnimationFrame(look);
    const follow = () => {
      const target = visibleTarget(targetName);
      const next = target?.getBoundingClientRect() ?? null;
      setAnchor((current) => {
        if (!next) return null;
        if (current && current.top === next.top && current.left === next.left && current.width === next.width && current.height === next.height) return current;
        return next;
      });
    };
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow, true);
    };
  }, [targetName, pathname]);

  const closeTour = () => {
    setChapterId(null);
    setIndex(0);
    setAnchor(null);
    helpRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };

  const start = (item: Chapter) => {
    setMenu(false);
    setIndex(0);
    setAnchor(null);
    setChapterId(item.id);
    if (item.segment === null) return;
    const href = hrefFor(locale, item.segment);
    if (pathname !== href) router.push(href);
  };

  const last = chapter ? index === chapter.steps.length - 1 : false;
  const forward = () => {
    if (!chapter) return;
    if (last) closeTour();
    else setIndex((current) => current + 1);
  };
  const back = () => setIndex((current) => Math.max(0, current - 1));

  return (
    <div ref={helpRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={text.open}
        aria-expanded={menu}
        aria-haspopup="menu"
        onClick={() => setMenu((open) => !open)}
      >
        <CircleHelp size={18} />
      </Button>
      {menu ? (
        <div role="menu" aria-label={text.open} className="absolute right-0 z-30 mt-2 w-56 rounded-xl border bg-surface p-1 shadow-card">
          {list.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="flex min-h-11 w-full items-center rounded-[10px] px-3 text-left text-sm font-medium hover:bg-surface-2"
              onClick={() => start(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {chapter && step ? (
        <div
          ref={layerRef}
          popover="manual"
          className="tour-layer"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeTour();
            }
            if (event.key === "ArrowRight") forward();
            if (event.key === "ArrowLeft") back();
          }}
        >
          {anchor ? (
            <div
              aria-hidden
              className="pointer-events-none fixed rounded-xl outline-2 outline-primary"
              style={{
                top: anchor.top - 4,
                left: anchor.left - 4,
                width: anchor.width + 8,
                height: anchor.height + 8,
                boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)",
              }}
            />
          ) : null}
          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed w-[min(20rem,calc(100vw-24px))] rounded-2xl border bg-surface p-4 text-fg shadow-card"
            style={{ top: place.top, left: place.left }}
          >
            <p className="text-xs font-medium text-muted">
              {index + 1} de {chapter.steps.length}
            </p>
            <h2 id={titleId} className="mt-1 text-base font-semibold">
              {step.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button className="min-h-11" onClick={closeTour}>
                {text.close}
              </Button>
              <Button className="min-h-11" onClick={back} disabled={index === 0}>
                {text.back}
              </Button>
              <Button data-tour-next variant="primary" className="min-h-11" onClick={forward}>
                {last ? text.done : text.next}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
