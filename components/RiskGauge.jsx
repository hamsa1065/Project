'use client';

import { useEffect, useRef, useState } from 'react';

const COLORS = {
  0:  '#10b981', // green  — 0–20
  20: '#84cc16', // lime   — 20–40
  40: '#f59e0b', // amber  — 40–60
  60: '#f97316', // orange — 60–80
  80: '#ef4444', // red    — 80–100
};

function getRiskColor(score) {
  if (score <= 20) return '#10b981';
  if (score <= 40) return '#84cc16';
  if (score <= 60) return '#f59e0b';
  if (score <= 80) return '#f97316';
  return '#ef4444';
}

export default function RiskGauge({ score = 0 }) {
  const [animated, setAnimated] = useState(0);

  // Animate counter
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimated(Math.round(eased * score));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  // SVG arc math
  const size    = 240;
  const cx      = size / 2;
  const cy      = size / 2;
  const r       = 90;
  // Semi-circle from 180° to 0° (left to right)
  const startAngle = -180;
  const endAngle   = 0;
  const arcLen     = Math.PI * r; // half circumference
  const dashTotal  = Math.PI * r;
  const fillRatio  = animated / 100;
  const dashFill   = fillRatio * dashTotal;
  const dashGap    = dashTotal - dashFill;
  const color      = getRiskColor(score);

  // Convert polar to cartesian
  const polar = (angle) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const start = polar(-180);
  const end   = polar(0);

  // Track arc path (semi-circle)
  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <svg
          width={size}
          height={size / 2 + 10}
          viewBox={`0 0 ${size} ${size / 2 + 10}`}
          overflow="visible"
        >
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(55,65,81,0.8)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Fill */}
          <path
            d={trackPath}
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${dashFill} ${dashGap + 1}`}
            style={{
              filter: `drop-shadow(0 0 8px ${color}88)`,
              transition: 'stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />

          {/* Scale ticks */}
          {[0, 25, 50, 75, 100].map((val) => {
            const tickAngle = -180 + (val / 100) * 180;
            const inner = {
              x: cx + (r - 14) * Math.cos((tickAngle * Math.PI) / 180),
              y: cy + (r - 14) * Math.sin((tickAngle * Math.PI) / 180),
            };
            const outer = {
              x: cx + (r + 14) * Math.cos((tickAngle * Math.PI) / 180),
              y: cy + (r + 14) * Math.sin((tickAngle * Math.PI) / 180),
            };
            const label = {
              x: cx + (r + 26) * Math.cos((tickAngle * Math.PI) / 180),
              y: cy + (r + 26) * Math.sin((tickAngle * Math.PI) / 180),
            };
            return (
              <g key={val}>
                <line
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="rgba(75,85,99,0.6)"
                  strokeWidth="1.5"
                />
                <text
                  x={label.x} y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fill="rgba(107,114,128,0.8)"
                  fontFamily="Inter, sans-serif"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Center score */}
          <text
            x={cx} y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="42"
            fontWeight="700"
            fill={color}
            fontFamily="Sora, sans-serif"
            style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
          >
            {animated}
          </text>
          <text
            x={cx} y={cy + 18}
            textAnchor="middle"
            fontSize="11"
            fill="rgba(156,163,175,0.8)"
            fontFamily="Inter, sans-serif"
            letterSpacing="2"
          >
            RISK SCORE
          </text>
        </svg>
      </div>
    </div>
  );
}
