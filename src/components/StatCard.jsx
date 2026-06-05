export default function StatCard({ icon, label, value, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <span className="stat-icon">{icon}</span>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
