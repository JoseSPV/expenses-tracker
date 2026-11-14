"use client";

import { useI18n } from "@/i18n/i18n-provider";
import { ChartFrame, type ChartSeries } from "./chart-frame";
import { PAD, createScale } from "./scale";
import { useChartWidth } from "./use-chart-width";

const MAX_POINTS = 24;

/** Multi-line chart with a soft area under the first series. */
export function LineChart({ label, labels, series, height = 240 }: { label: string; labels: string[]; series: ChartSeries[]; height?: number }) {
  const { format } = useI18n();
  const { ref, width } = useChartWidth();
  const { y, ticks, baseline } = createScale(series.flatMap((s) => s.values), height);
  const innerWidth = width - PAD.left - PAD.right;
  const x = (i: number) => PAD.left + (labels.length === 1 ? innerWidth / 2 : (i * innerWidth) / (labels.length - 1));

  return (
    <ChartFrame label={label} frameRef={ref} width={width} height={height} ticks={ticks} y={y} labels={labels} labelX={x}>
      {series.map((s, index) => {
        const path = s.values.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ");
        const last = s.values.length - 1;
        return (
          <g key={s.name}>
            {index === 0 ? (
              <path d={`${path} L${x(last)} ${baseline} L${x(0)} ${baseline} Z`} style={{ fill: s.color, opacity: 0.1 }} />
            ) : null}
            <path d={path} fill="none" strokeWidth={2.5} strokeLinejoin="round" style={{ stroke: s.color }} />
            {labels.length <= MAX_POINTS
              ? s.values.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r={4} strokeWidth={2} className="stroke-surface" style={{ fill: s.color }}>
                    <title>{`${labels[i]} · ${s.name}: ${format.money(v)}`}</title>
                  </circle>
                ))
              : null}
          </g>
        );
      })}
    </ChartFrame>
  );
}
