"use client";

import { useI18n } from "@/i18n/i18n-provider";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  label,
  value,
  size = 200,
  thickness = 26,
}: {
  segments: DonutSegment[];
  label: string;
  value: string;
  size?: number;
  thickness?: number;
}) {
  const { format } = useI18n();
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offsets = segments.reduce<number[]>(
    (acc, s, i) => [...acc, (acc[i] ?? 0) + (total ? (s.value / total) * circumference : 0)],
    [0],
  );

  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} ${value}`} className="mx-auto block h-auto w-full max-w-50">
      <g fill="none" strokeWidth={thickness} transform={`rotate(-90 ${center} ${center})`}>
        <circle cx={center} cy={center} r={radius} className="stroke-surface-2" />
        {segments.map((s, i) => {
          const length = offsets[i + 1] - offsets[i];
          return (
            <circle
              key={s.label}
              cx={center}
              cy={center}
              r={radius}
              style={{ stroke: s.color }}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offsets[i]}
            >
              <title>{`${s.label}: ${format.money(s.value)}`}</title>
            </circle>
          );
        })}
      </g>
      <text x={center} y={center - 6} textAnchor="middle" className="fill-muted" fontSize={13}>
        {label}
      </text>
      <text x={center} y={center + 16} textAnchor="middle" className="fill-fg" fontSize={value.length > 12 ? 13 : 16} fontWeight={700}>
        {value}
      </text>
    </svg>
  );
}
