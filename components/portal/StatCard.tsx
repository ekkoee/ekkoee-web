export default function StatCard({
  label,
  value,
  unit,
  delta,
  wide,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  wide?: boolean;
}) {
  return (
    <div className={`stat${wide ? " wide" : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      {delta && <div className="stat-delta">{delta}</div>}
    </div>
  );
}
