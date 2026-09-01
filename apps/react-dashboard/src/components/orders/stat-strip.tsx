interface Stat {
  label: string;
  value: string;
  tone?: 'default' | 'warn';
}

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="flex divide-x divide-line border border-line bg-surface">
      {stats.map((stat) => (
        <div key={stat.label} className="flex-1 px-5 py-3.5">
          <p className="text-xs text-ink-faint">{stat.label}</p>
          <p
            className={`mt-1 font-mono-data text-xl font-medium ${
              stat.tone === 'warn' ? 'text-status-pending' : 'text-ink'
            }`}
          >
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
