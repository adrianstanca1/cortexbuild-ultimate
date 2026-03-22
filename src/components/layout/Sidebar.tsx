import { type Module } from '../../types';
import {
  LayoutDashboard, FolderOpen, FileText, Calculator, ShoppingCart,
  ShieldCheck, Receipt, Hammer, Users, FileSearch, BarChart3,
  AlertTriangle, MapPin, UserCheck, BookOpen, Clock, Wrench,
  Building2, Bot, Settings, ChevronLeft, ChevronRight, Zap,
  MessageSquare, GitPullRequest, CheckSquare, ClipboardCheck,
  Triangle, Layers, Package, ClipboardList, Store,
  HardHat, TrendingUp, Brain, Bell, FileBarChart, TrendingUp as TrendingUpIcon,
  PieChart
} from 'lucide-react';

interface SidebarProps {
  activeModule: Module;
  setModule: (m: Module) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const groups: { label: string; items: { id: Module; label: string; icon: React.FC<{ className?: string }>; badge?: string; badgeVariant?: 'amber' | 'blue' | 'green'; }[] }[] = [
  {
    label: 'OVERVIEW', items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analytics & BI', icon: BarChart3 },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, badge: 'AI', badgeVariant: 'amber' },
      { id: 'insights', label: 'AI Insights', icon: Brain, badge: 'NEW', badgeVariant: 'green' },
      { id: 'predictive-analytics', label: 'Predictive', icon: TrendingUpIcon, badge: 'NEW', badgeVariant: 'green' },
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
      { id: 'financial-reports', label: 'Financial Reports', icon: PieChart, badge: 'NEW', badgeVariant: 'green' },
      { id: 'cis', label: 'CIS Returns', icon: Receipt, badge: 'UK', badgeVariant: 'blue' },
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
      { id: 'rams', label: 'RAMS', icon: ShieldCheck, badge: 'UK', badgeVariant: 'blue' },
      { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
      { id: 'punch-list', label: 'Punch List / Snagging', icon: CheckSquare },
      { id: 'risk-register', label: 'Risk Register', icon: Triangle },
      { id: 'documents', label: 'Documents', icon: BookOpen },
    ]
  },
  {
    label: 'BUSINESS', items: [
      { id: 'crm', label: 'CRM & Clients', icon: Building2 },
      { id: 'executive-reports', label: 'Executive Reports', icon: FileBarChart, badge: 'NEW', badgeVariant: 'green' },
      { id: 'marketplace', label: 'AI Marketplace', icon: Store, badge: 'NEW', badgeVariant: 'green' },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]
  },
];

const seen = new Set<string>();
const deduped = groups.map(g => ({
  ...g,
  items: g.items.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  })
})).filter(g => g.items.length > 0);

const BADGE_COLORS = {
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
};

export function Sidebar({ activeModule, setModule, collapsed, setCollapsed }: SidebarProps) {
  return (
    <aside
      className="flex flex-col flex-shrink-0 transition-all duration-300"
      style={{
        width: collapsed ? '64px' : '240px',
        background: 'var(--slate-900)',
        borderRight: '1px solid var(--slate-800)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ padding: '0 16px', height: '60px', borderBottom: '1px solid var(--slate-800)' }}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div
              style={{
                width: '32px', height: '32px',
                background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
              }}
            >
              <Zap style={{ width: '16px', height: '16px', color: 'var(--slate-950)' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--slate-50)', lineHeight: 1.1 }}>CortexBuild</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600, color: 'var(--amber-400)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Ultimate</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: '32px', height: '32px', margin: '0 auto',
              background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
            }}
          >
            <Zap style={{ width: '16px', height: '16px', color: 'var(--slate-950)' }} />
          </div>
        )}
        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', padding: '4px', borderRadius: '4px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--slate-200)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--slate-500)')}
          >
            <ChevronLeft style={{ width: '16px', height: '16px' }} />
          </button>
        ) : null}
      </div>

      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '8px', borderBottom: '1px solid var(--slate-800)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--slate-500)', transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--slate-200)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--slate-500)')}
        >
          <ChevronRight style={{ width: '16px', height: '16px' }} />
        </button>
      )}

      {/* Nav */}
      <nav
        className="flex-1 overflow-y-auto nav-scroll py-3"
        style={{ paddingLeft: collapsed ? '8px' : '0', paddingRight: collapsed ? '8px' : '0' }}
      >
        {deduped.map(group => (
          <div key={group.label} style={{ marginBottom: '4px' }}>
            {!collapsed && (
              <div style={{
                padding: '12px 16px 4px',
                fontFamily: 'var(--font-body)',
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--slate-500)',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setModule(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: collapsed ? '8px 0' : '8px 16px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? 'rgba(245,158,11,0.08)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    color: active ? 'var(--amber-400)' : 'var(--slate-400)',
                    position: 'relative',
                    marginBottom: '1px',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = 'var(--slate-100)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--slate-400)';
                    }
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: '0', top: '6px', bottom: '6px',
                      width: '3px',
                      background: 'linear-gradient(180deg, var(--amber-400), var(--amber-600))',
                      borderRadius: '0 2px 2px 0',
                    }} />
                  )}
                  <span style={{ width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon />
              </span>
                  {!collapsed && (
                    <>
                      <span style={{
                        fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500,
                        flex: 1, textAlign: 'left',
                      }}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`badge ${BADGE_COLORS[item.badgeVariant || 'amber']}`}
                          style={{ flexShrink: 0 }}
                        >
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
        <div style={{
          borderTop: '1px solid var(--slate-800)',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700,
                color: 'var(--slate-950)', flexShrink: 0,
              }}
            >
              AS
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-100)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Adrian Stanca</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--slate-500)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Company Owner</div>
            </div>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-500)', flexShrink: 0, boxShadow: '0 0 6px var(--emerald-500)' }} title="Online" />
          </div>
        </div>
      )}
    </aside>
  );
}
