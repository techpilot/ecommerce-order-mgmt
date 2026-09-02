import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStatus } from '../../features/auth/use-auth';

export function ProtectedRoute() {
  const status = useAuthStatus();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-soft">
        Loading…
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
