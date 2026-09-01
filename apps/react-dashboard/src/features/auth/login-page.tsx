import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Field } from '../../components/ui/field';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // TODO: wire to POST /api/v1/auth/login once the Nest auth module is live.
    await new Promise((resolve) => setTimeout(resolve, 400));
    setIsSubmitting(false);
    navigate('/orders');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <span className="font-mono-data text-lg font-medium text-ink">
            Manifest
          </span>
          <p className="mt-1 text-sm text-ink-soft">
            Sign in to manage orders and inventory.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 border border-line bg-surface p-6"
        >
          <Field
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <p className="text-sm text-status-cancelled" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-accent hover:text-accent-hover"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
