import { InputHTMLAttributes, forwardRef } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, id, className = '', ...props }, ref) => (
    <label className="flex flex-col gap-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        ref={ref}
        id={id}
        className={`rounded-sm border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent ${
          error ? 'border-status-cancelled' : 'border-line-strong'
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-status-cancelled">{error}</span>}
    </label>
  ),
);

Field.displayName = 'Field';
