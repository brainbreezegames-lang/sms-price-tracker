import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  highlightLast?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 20,
  color = '#06b6d4',
  fillOpacity = 0.15,
  highlightLast = true,
  className = '',
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((val, i) => ({
    x: pad + (i / (data.length - 1)) * (width - 2 * pad),
    y: pad + (1 - (val - min) / range) * (height - 2 * pad),
  }));

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath =
    `M${points[0].x},${height} ` +
    points.map(p => `L${p.x},${p.y}`).join(' ') +
    ` L${points[points.length - 1].x},${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`inline-block shrink-0 ${className}`}
      aria-hidden
    >
      <path d={areaPath} fill={color} opacity={fillOpacity} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {highlightLast && (
        <circle cx={last.x} cy={last.y} r={2} fill={color} />
      )}
    </svg>
  );
};
