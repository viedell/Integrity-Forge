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
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  const color =
    value >= thresholdDanger
      ? "#dc2626"
      : value >= thresholdWarn
        ? "#d97706"
        : "#16a34a";

  const trackColor = "hsl(var(--secondary))";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
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
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          style={{ transform: "rotate(90deg)", transformOrigin: "center", fill: color, fontSize: size * 0.22, fontWeight: 700, fontFamily: "monospace" }}
        >
          {value}%
        </text>
      </svg>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
