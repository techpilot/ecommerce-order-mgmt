import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { MobileNavProvider } from '../../lib/mobile-nav-context';

export function AppShell() {
  return (
    <MobileNavProvider>
      <div className="flex h-screen bg-paper">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </MobileNavProvider>
  );
}
