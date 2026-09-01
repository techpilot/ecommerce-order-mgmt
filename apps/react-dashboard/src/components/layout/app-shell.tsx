import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen bg-paper">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
