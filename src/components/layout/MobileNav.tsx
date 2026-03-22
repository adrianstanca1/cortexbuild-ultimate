/**
 * CortexBuild Ultimate — Mobile Navigation Bar
 * Bottom navigation for mobile devices
 */
import { LayoutDashboard, FolderOpen, FileText, AlertTriangle, HardHat, MessageSquare } from 'lucide-react';
import { type Module } from '../../types';

interface MobileNavProps {
  activeModule: Module;
  setModule: (m: Module) => void;
}

const MOBILE_NAV_ITEMS: { module: Module; icon: typeof LayoutDashboard; label: string }[] = [
  { module: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { module: 'projects', icon: FolderOpen, label: 'Projects' },
  { module: 'invoicing', icon: FileText, label: 'Invoices' },
  { module: 'safety', icon: AlertTriangle, label: 'Safety' },
  { module: 'ai-assistant', icon: HardHat, label: 'AI' },
];

export function MobileNav({ activeModule, setModule }: MobileNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-14">
        {MOBILE_NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeModule === item.module;
          return (
            <button
              key={item.module}
              onClick={() => setModule(item.module)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors"
              style={{
                color: isActive ? 'var(--amber-400)' : 'var(--slate-500)',
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
