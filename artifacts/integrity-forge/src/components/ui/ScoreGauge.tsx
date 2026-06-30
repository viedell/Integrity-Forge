interface ScoreGaugeProps {
  value: number;
  label: string;
  size?: number;
  thresholdWarn?: number;
  thresholdDanger?: number;
}

export function ScoreGauge({
  value,
  label,
  size = 80,
  thresholdWarn = 40,
  thresholdDanger = 70,
}: ScoreGaugeProps) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const rounded = Math.round(value);
  const progress = Math.min(100, Math.max(0, rounded));
  const offset = circumference - (progress / 100) * circumference;

  const color =
    rounded >= thresholdDanger
      ? "#dc2626"
      : rounded >= thresholdWarn
        ? "#d97706"
        : "#16a34a";

  const trackColor = "hsl(var(--secondary))";
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = Math.max(10, size * 0.20);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={8}
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text
          x={cx}
          y={cy}
          dominantBaseline="middle"
          textAnchor="middle"
          transform={`rotate(90, ${cx}, ${cy})`}
          fill={color}
          fontSize={fontSize}
          fontWeight={700}
          fontFamily="monospace"
        >
          {rounded}%
        </text>
      </svg>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
