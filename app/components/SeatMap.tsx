"use client";

import { useState } from "react";

type Seat = { id: string; row: number; col: string; taken?: boolean; premium?: boolean };

const COLS = ["A", "B", "C", "D", "E", "F"];
const ROWS = Array.from({ length: 12 }, (_, i) => i + 1);

function buildSeats(flightId: string): Seat[] {
  let h = 0;
  for (let i = 0; i < flightId.length; i++) h = (h * 31 + flightId.charCodeAt(i)) >>> 0;
  const out: Seat[] = [];
  for (const r of ROWS) {
    for (const c of COLS) {
      const id = `${r}${c}`;
      const taken = ((h + r * 7 + c.charCodeAt(0)) % 5) === 0;
      const premium = r <= 3;
      out.push({ id, row: r, col: c, taken, premium });
    }
  }
  return out;
}

export default function SeatMap({
  flightId,
  value,
  onChange,
}: {
  flightId: string;
  value: string | null;
  onChange: (seat: string | null) => void;
}) {
  const [seats] = useState(() => buildSeats(flightId || "default"));
  const [hover, setHover] = useState<string | null>(null);

  const SEAT_W = 34;
  const SEAT_H = 34;
  const GAP = 6;
  const AISLE = 18;
  const startX = 20;
  const startY = 40;

  const colX = (c: string) => {
    const idx = COLS.indexOf(c);
    const aisleOffset = idx >= 3 ? AISLE : 0;
    return startX + idx * (SEAT_W + GAP) + aisleOffset;
  };
  const rowY = (r: number) => startY + (r - 1) * (SEAT_H + GAP);

  const width = startX * 2 + COLS.length * (SEAT_W + GAP) + AISLE;
  const height = startY + ROWS.length * (SEAT_H + GAP) + 10;

  const activeSeat = hover
    ? seats.find((s) => s.id === hover)
    : value
    ? seats.find((s) => s.id === value)
    : null;

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Choose your seat</div>
        <div className="text-xs text-slate-500">
          {value ? (
            <>
              Selected: <strong data-selected-seat={value}>{value}</strong>{" "}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => onChange(null)}
              >
                clear
              </button>
            </>
          ) : (
            "No seat selected"
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-md mx-auto block"
        role="img"
        aria-label="Cabin seat map"
        data-testid="cabin-seatmap"
      >
        {/* fuselage */}
        <rect
          x={4}
          y={20}
          width={width - 8}
          height={height - 30}
          rx={40}
          fill="#fff"
          stroke="#cbd5e1"
        />
        {/* column labels */}
        {COLS.map((c) => (
          <text
            key={c}
            x={colX(c) + SEAT_W / 2}
            y={startY - 8}
            textAnchor="middle"
            fontSize={10}
            fill="#64748b"
          >
            {c}
          </text>
        ))}
        {seats.map((s) => {
          const selected = value === s.id;
          const fill = s.taken
            ? "#cbd5e1"
            : selected
            ? "#2f80ed"
            : s.premium
            ? "#fde68a"
            : "#ffffff";
          const stroke = selected ? "#1e40af" : "#94a3b8";
          return (
            <g key={s.id}>
              <rect
                x={colX(s.col)}
                y={rowY(s.row)}
                width={SEAT_W}
                height={SEAT_H}
                rx={6}
                fill={fill}
                stroke={stroke}
                strokeWidth={selected ? 2 : 1}
                data-seat-id={s.id}
                data-seat-status={s.taken ? "taken" : selected ? "selected" : "free"}
                style={{ cursor: s.taken ? "not-allowed" : "pointer" }}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => {
                  if (s.taken) return;
                  onChange(selected ? null : s.id);
                }}
              />
              <text
                x={colX(s.col) + SEAT_W / 2}
                y={rowY(s.row) + SEAT_H / 2 + 3}
                textAnchor="middle"
                fontSize={9}
                fill={selected ? "#ffffff" : "#334155"}
                pointerEvents="none"
              >
                {s.id}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-white border border-slate-400" />
          Available
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-200 border border-amber-400" />
          Premium (+$40)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-300" />
          Taken
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-[color:var(--brand-accent)]" />
          Selected
        </span>
      </div>

      {activeSeat && (
        <div className="mt-2 text-xs text-slate-700">
          Seat {activeSeat.id} —{" "}
          {activeSeat.taken
            ? "unavailable"
            : activeSeat.premium
            ? "premium seat (+$40)"
            : "standard seat"}
        </div>
      )}
    </div>
  );
}
