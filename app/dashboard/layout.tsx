import Sidebar from '@/components/ui/Sidebar';
import Header from '@/components/ui/Header';
import { WebSocketStatus } from '@/components/dashboard/WebSocketStatus';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64">
        <Header />
        <div className="flex items-center justify-between px-6 py-2 border-b bg-white/50">
          <div />
          <WebSocketStatus />
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
