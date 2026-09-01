import { ReactNode } from 'react';
import { useMobileNav } from '../../lib/mobile-nav-context';

interface TopbarProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function Topbar({ title, description, action }: TopbarProps) {
  const { toggle } = useMobileNav();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          aria-label="Toggle navigation"
          className="-ml-1 rounded-sm p-1.5 text-ink-soft hover:bg-paper hover:text-ink md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div>
          <h1 className="text-base font-semibold text-ink sm:text-lg">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 hidden text-sm text-ink-soft sm:block">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </header>
  );
}
