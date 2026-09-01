interface Stat {
  label: string;
  value: string;
  tone?: 'default' | 'warn';
}

export function StatStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-line border border-line bg-surface sm:grid-cols-3 sm:divide-y-0">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`px-4 py-3.5 sm:px-5 ${
            index === stats.length - 1 && stats.length % 2 !== 0
              ? 'col-span-2 sm:col-span-1'
              : ''
          }`}
        >
          <p className="text-xs text-ink-faint">{stat.label}</p>
          <p
            className={`mt-1 font-mono-data text-lg font-medium sm:text-xl ${
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
