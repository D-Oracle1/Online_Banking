'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { WeekDay } from '@/server/admin-overview';

// Monochrome design: near-black solid line vs mid-grey dashed line.
// Dashes are the secondary encoding, so the two never rely on shade alone.
const DEPOSITS_COLOR = '#111111';
const OUTGOING_COLOR = '#71717a';

const WIDTH = 300;
const HEIGHT = 120;
const PAD_X = 12;
const PAD_TOP = 10;
const PAD_BOTTOM = 6;

/** Smooth curve that never overshoots between points (monotone cubic) */
function smoothPath(points: [number, number][]) {
  if (points.length < 2) return '';
  const n = points.length;
  const dx = points.slice(1).map((p, i) => p[0] - points[i][0]);
  const slopes = points.slice(1).map((p, i) => (p[1] - points[i][1]) / dx[i]);
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });

  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + tangents[i] * h} ${x1 - h},${y1 - tangents[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

export default function WeeklyActivityChart({ week }: { week: WeekDay[] }) {
  // Today is highlighted until another day is hovered or tapped
  const [active, setActive] = useState(week.length - 1);

  const max = Math.max(1, ...week.map(d => Math.max(d.deposits, d.outgoing)));
  const hasActivity = week.some(d => d.deposits > 0 || d.outgoing > 0);
  const step = (WIDTH - PAD_X * 2) / (week.length - 1);
  const x = (i: number) => PAD_X + i * step;
  const y = (v: number) => PAD_TOP + (1 - v / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const depositPoints = week.map((d, i) => [x(i), y(d.deposits)] as [number, number]);
  const outgoingPoints = week.map((d, i) => [x(i), y(d.outgoing)] as [number, number]);
  const activeDay = week[active];
  const activeLeft = `${(x(active) / WIDTH) * 100}%`;

  return (
    <div className="flex flex-col h-full">
      {/* Legend: always shown for two series; swatches show line style too */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
        <span className="flex items-center gap-1.5">
          <svg width="16" height="6" aria-hidden="true"><line x1="0" y1="3" x2="16" y2="3" stroke={DEPOSITS_COLOR} strokeWidth="2" strokeLinecap="round" /></svg>
          Deposits
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="6" aria-hidden="true"><line x1="0" y1="3" x2="16" y2="3" stroke={OUTGOING_COLOR} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" /></svg>
          Transfers &amp; withdrawals
        </span>
      </div>

      <div className="relative flex-1 min-h-[140px]">
        {/* Readout for the active day */}
        <div
          className="absolute -top-1 z-10 -translate-x-1/2 pointer-events-none"
          style={{ left: `clamp(3.5rem, ${activeLeft}, calc(100% - 3.5rem))` }}
        >
          <div className="bg-gray-900 text-white text-[11px] leading-tight rounded-lg px-2 py-1 whitespace-nowrap shadow">
            <span className="font-semibold">{formatCurrency(activeDay.deposits)}</span>
            <span className="text-gray-400"> in · </span>
            <span className="font-semibold">{formatCurrency(activeDay.outgoing)}</span>
            <span className="text-gray-400"> out</span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full overflow-visible pt-6"
          preserveAspectRatio="none"
          role="img"
          aria-label="Daily deposits compared with transfers and withdrawals over the last 7 days"
          onMouseLeave={() => setActive(week.length - 1)}
        >
          {/* Recessive baseline */}
          <line x1={PAD_X} x2={WIDTH - PAD_X} y1={HEIGHT - PAD_BOTTOM} y2={HEIGHT - PAD_BOTTOM} stroke="#e4e4e7" strokeWidth="1" vectorEffect="non-scaling-stroke" />

          {/* Crosshair */}
          <line x1={x(active)} x2={x(active)} y1={PAD_TOP - 4} y2={HEIGHT - PAD_BOTTOM} stroke="#d4d4d8" strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />

          <path d={smoothPath(outgoingPoints)} fill="none" stroke={OUTGOING_COLOR} strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path d={smoothPath(depositPoints)} fill="none" stroke={DEPOSITS_COLOR} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

          {/* Hit targets: one full-height column per day, wider than the marks */}
          {week.map((d, i) => (
            <rect
              key={d.fullLabel}
              x={x(i) - step / 2}
              y={0}
              width={step}
              height={HEIGHT}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
            />
          ))}
        </svg>

        {/* Markers in HTML so they stay round when the SVG stretches */}
        {[
          { points: outgoingPoints, color: OUTGOING_COLOR },
          { points: depositPoints, color: DEPOSITS_COLOR },
        ].map(({ points, color }) => (
          <span
            key={color}
            className="absolute w-2.5 h-2.5 rounded-full ring-2 ring-white -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: activeLeft,
              // The SVG is offset by pt-6 (1.5rem) inside this box
              top: `calc(1.5rem + (100% - 1.5rem) * ${points[active][1] / HEIGHT})`,
              backgroundColor: color,
            }}
          />
        ))}

        {!hasActivity && (
          <p className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 pointer-events-none">
            No completed transactions this week
          </p>
        )}
      </div>

      {/* Day axis; the active day sits in a black circle */}
      <div className="flex justify-between mt-3" style={{ paddingLeft: `${(PAD_X / WIDTH) * 100}%`, paddingRight: `${(PAD_X / WIDTH) * 100}%` }}>
        {week.map((d, i) => (
          <button
            key={d.fullLabel}
            type="button"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            className={`w-7 h-7 -mx-3.5 rounded-full text-xs font-medium transition-colors ${
              i === active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
            title={d.fullLabel}
            aria-label={`${d.fullLabel}: ${formatCurrency(d.deposits)} deposited, ${formatCurrency(d.outgoing)} transferred or withdrawn`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Table view for screen readers */}
      <table className="sr-only">
        <caption>Last 7 days</caption>
        <thead>
          <tr><th>Day</th><th>Deposits</th><th>Transfers &amp; withdrawals</th></tr>
        </thead>
        <tbody>
          {week.map(d => (
            <tr key={d.fullLabel}><td>{d.fullLabel}</td><td>{formatCurrency(d.deposits)}</td><td>{formatCurrency(d.outgoing)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
