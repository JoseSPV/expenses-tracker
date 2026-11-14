"use client";

import type { ReactNode, RefObject } from "react";
import { useI18n } from "@/i18n/i18n-provider";
import { PAD, visibleLabelIndices } from "./scale";

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
}

interface ChartFrameProps {
  label: string;
  frameRef: RefObject<HTMLDivElement | null>;
  width: number;
  height: number;
  ticks: number[];
  y: (value: number) => number;
  labels: string[];
  labelX: (index: number) => number;
  children: ReactNode;
}

const MIN_LABEL_SPACING = 48;

/** Shared SVG shell: horizontal grid with money ticks and x-axis labels. Draws once the container is measured. */
export function ChartFrame({ label, frameRef, width, height, ticks, y, labels, labelX, children }: ChartFrameProps) {
  const { format } = useI18n();
  const innerWidth = width - PAD.left - PAD.right;
  const visible = visibleLabelIndices(labels.length, Math.max(2, Math.floor(innerWidth / MIN_LABEL_SPACING)));

  return (
    <div ref={frameRef} style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="block overflow-visible">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeDasharray="3 4" />
              <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[11px]">
                {format.compactMoney(tick)}
              </text>
            </g>
          ))}
          {children}
          {labels.map((text, i) =>
            visible.has(i) ? (
              <text key={i} x={labelX(i)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">
                {text}
              </text>
            ) : null,
          )}
        </svg>
      ) : null}
    </div>
  );
}
