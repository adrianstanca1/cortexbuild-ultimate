import { type Module } from '../../types';
import {
  LayoutDashboard, FolderOpen, FileText, Calculator, ShoppingCart,
  ShieldCheck, Receipt, Hammer, Users, FileSearch, BarChart3,
  AlertTriangle, MapPin, UserCheck, BookOpen, Clock, Wrench,
  Building2, Bot, Settings, ChevronLeft, ChevronRight, Zap,
  MessageSquare, GitPullRequest, CheckSquare, ClipboardCheck,
  Triangle, Layers, Package, ClipboardList, Store,
  HardHat, TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeModule: Module;
  setModule: (m: Module) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const groups: { label: string; items: { id: Module; label: string; icon: React.FC<{ className?: string }>; badge?: string; color?: string }[] }[] = [
  {
    label: 'OVERVIEW', items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics & BI', icon: BarChart3 },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI', color: 'purple' },
    ]
  },
  {
    label: 'PROJECT MANAGEMENT', items: [
      { id: 'projects', label: 'Projects', icon: FolderOpen },
      { id: 'site-ops', label: 'Site Operations', icon: Hammer },
      { id: 'daily-reports', label: 'Daily Reports', icon: ClipboardList },
      { id: 'field-view', label: 'Field View / Maps', icon: MapPin },
      { id: 'drawings', label: 'Drawings & Plans', icon: Layers },
      { id: 'meetings', label: 'Meetings', icon: MessageSquare },
    ]
  },
  {
    label: 'COMMERCIAL & FINANCE', items: [
      { id: 'tenders', label: 'Tenders & Bids', icon: TrendingUp },
      { id: 'invoicing', label: 'Invoicing', icon: FileText },
      { id: 'accounting', label: 'Accounting', icon: Calculator },
      { id: 'cis', label: 'CIS Returns', icon: Receipt, badge: 'UK', color: 'blue' },
      { id: 'procurement', label: 'Procurement', icon: ShoppingCart },
      { id: 'change-orders', label: 'Change Orders', icon: GitPullRequest },
    ]
  },
  {
    label: 'SITE & OPERATIONS', items: [
      { id: 'teams', label: 'Teams & Labour', icon: Users },
      { id: 'timesheets', label: 'Timesheets', icon: Clock },
      { id: 'subcontractors', label: 'Subcontractors', icon: UserCheck },
      { id: 'plant', label: 'Plant & Equipment', icon: Wrench },
      { id: 'materials', label: 'Materials', icon: Package },
      { id: 'rfis', label: 'RFIs', icon: HardHat },
    ]
  },
  {
    label: 'SAFETY & COMPLIANCE', items: [
      { id: 'safety', label: 'Safety & HSE', icon: AlertTriangle },
      { id: 'rams', label: 'RAMS', icon: ShieldCheck, badge: 'UK', color: 'blue' },
      { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
      { id: 'punch-list', label: 'Punch List / Snagging', icon: CheckSquare },
      { id: 'risk-register', label: 'Risk Register', icon: Triangle },
      { id: 'documents', label: 'Documents', icon: BookOpen },
    ]
  },
  {
    label: 'BUSINESS', items: [
      { id: 'crm', label: 'CRM & Clients', icon: Building2 },
      { id: 'marketplace', label: 'AI Marketplace', icon: Store, badge: 'NEW', color: 'green' },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  },
];

// deduplicate items — tenders appears in two groups; keep unique per id
const seen = new Set<string>();
const deduped = groups.map(g => ({
  ...g,
  items: g.items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  })
})).filter(g => g.items.length > 0);

export function Sidebar({ activeModule, setModule, collapsed, setCollapsed }: SidebarProps) {
  return (
    <aside className={`flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">CortexBuild</div>
              <div className="text-[10px] text-blue-400 font-semibold tracking-wide">ULTIMATE</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="flex items-center justify-center py-2 text-gray-500 hover:text-gray-300 transition-colors border-b border-gray-800">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {deduped.map(group => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <div className="px-4 pt-2 pb-1 text-[10px] font-semibold text-gray-600 tracking-widest uppercase">
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              const badgeColors: Record<string, string> = {
                purple: 'bg-purple-600 text-white',
                blue: 'bg-blue-600 text-white',
                green: 'bg-green-600 text-white',
              };
              return (
                <button
                  key={item.id}
                  onClick={() => setModule(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-all duration-100 group relative ${
                    active
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-200'
                  }`}
                >
                  {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />}
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
                  {!collapsed && (
                    <>
                      <span className="truncate text-xs font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColors[item.color || 'blue']}`}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      {!collapsed && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Adrian Stanca</div>
              <div className="text-[10px] text-gray-500 truncate">Company Owner</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" title="Online" />
          </div>
        </div>
      )}
    </aside>
  );
}
