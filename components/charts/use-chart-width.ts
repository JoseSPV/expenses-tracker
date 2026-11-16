"use client";

import { useEffect, useRef, useState } from "react";

/** Tracks the rendered width of the chart container so SVG units map 1:1 to CSS pixels. */
export function useChartWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const apply = (next: number) => setWidth((current) => (current === next ? current : next));
    apply(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => apply(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}
