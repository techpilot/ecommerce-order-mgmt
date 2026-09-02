import { NavLink } from 'react-router-dom';
import { useMobileNav } from '../../lib/mobile-nav-context';
import { useLogout } from '../../features/auth/use-auth';

const NAV_ITEMS = [
  { to: '/orders', label: 'Orders' },
  { to: '/products', label: 'Products' },
];

export function Sidebar() {
  const { isOpen, close } = useMobileNav();
  const logout = useLogout();

  return (
    <>
      {/* Backdrop -- mobile only, closes drawer on tap outside */}
      {isOpen && (
        <button
          aria-label="Close navigation"
          onClick={close}
          className="fixed inset-0 z-30 bg-ink/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-line bg-surface transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
              onClick={close}
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

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper hover:text-status-cancelled"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6M11 11.5 14.5 8 11 4.5M14.5 8H6"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Log out
        </button>
      </aside>
    </>
  );
}
