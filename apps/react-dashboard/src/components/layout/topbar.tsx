interface TopbarProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Topbar({ title, description, action }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-ink-soft">{description}</p>
        )}
      </div>
      {action}
    </header>
  );
}
