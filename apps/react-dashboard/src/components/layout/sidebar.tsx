import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/orders', label: 'Orders' },
  { to: '/products', label: 'Products' },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono-data text-lg font-medium text-ink">
            Manifest
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-faint">Order operations</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent-soft text-accent'
                  : 'text-ink-soft hover:bg-paper hover:text-ink'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
