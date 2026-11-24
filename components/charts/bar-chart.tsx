"use client";

import { useI18n } from "@/i18n/i18n-provider";
import { ChartFrame, type ChartSeries } from "./chart-frame";
import { PAD, createScale } from "./scale";
import { useChartWidth } from "./use-chart-width";

/** Grouped bars; every series' `values` aligns with `labels`. */
export function BarChart({ label, labels, series, height = 240 }: { label: string; labels: string[]; series: ChartSeries[]; height?: number }) {
  const { dict, format } = useI18n();
  const { ref, width } = useChartWidth();
  const { y, ticks, baseline } = createScale(series.flatMap((s) => s.values), height);
  const groupWidth = (width - PAD.left - PAD.right) / labels.length;
  const barWidth = Math.min(24, (groupWidth * 0.7) / series.length);
  const groupStart = (i: number) => PAD.left + i * groupWidth + (groupWidth - barWidth * series.length) / 2;

  return (
    <ChartFrame label={label} frameRef={ref} width={width} height={height} ticks={ticks} y={y} labels={labels} labelX={(i) => PAD.left + i * groupWidth + groupWidth / 2}>
      {labels.map((name, i) =>
        series.map((s, j) => (
          <rect
            key={`${name}-${s.name}`}
            x={groupStart(i) + j * barWidth}
            y={Math.min(y(s.values[i]), baseline)}
            width={barWidth - 3}
            height={Math.abs(baseline - y(s.values[i]))}
            rx={3}
            style={{ fill: s.color }}
          >
            <title>{format.message(dict.common.chartPoint, { period: name, series: s.name, value: format.money(s.values[i]) })}</title>
          </rect>
        )),
      )}
    </ChartFrame>
  );
}
