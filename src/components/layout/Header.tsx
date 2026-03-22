import { useState } from 'react';
import { Bell, Search, Moon, Sun, Wifi, WifiOff, ChevronDown, Menu, X, Monitor } from 'lucide-react';
import { type Module } from '../../types';
import { NotificationsPanel } from './NotificationsPanel';
import { useTheme } from '../../context/ThemeContext';

const MODULE_LABELS: Record<Module, string> = {
  'dashboard': 'Dashboard',
  'projects': 'Projects',
  'invoicing': 'Invoicing',
  'accounting': 'Accounting',
  'financial-reports': 'Financial Reports',
  'procurement': 'Procurement',
  'rams': 'RAMS — Risk Assessment & Method Statements',
  'cis': 'CIS Returns',
  'site-ops': 'Site Operations',
  'teams': 'Teams & Labour',
  'tenders': 'Tenders & Bids',
  'analytics': 'Analytics & Business Intelligence',
  'safety': 'Safety & HSE',
  'field-view': 'Field View / Maps',
  'crm': 'CRM & Clients',
  'documents': 'Documents',
  'timesheets': 'Timesheets',
  'plant': 'Plant & Equipment',
  'subcontractors': 'Subcontractors',
  'ai-assistant': 'AI Assistant',
  'rfis': 'RFIs — Requests for Information',
  'change-orders': 'Change Orders',
  'punch-list': 'Punch List / Snagging',
  'inspections': 'Inspections & QA',
  'risk-register': 'Risk Register',
  'drawings': 'Drawings & Plans',
  'meetings': 'Meetings',
  'materials': 'Materials Management',
  'daily-reports': 'Daily Reports',
  'marketplace': 'AI Marketplace',
  'settings': 'Settings',
  'insights': 'AI Insights Engine',
  'notifications': 'Notifications',
  'executive-reports': 'Executive Reports',
  'predictive-analytics': 'Predictive Analytics',
};

interface HeaderProps {
  activeModule: Module;
  onMenuToggle?: () => void;
}

export function Header({ activeModule, onMenuToggle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [online] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const notifications = 4;

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <header
      style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--slate-900)',
        borderBottom: '1px solid var(--slate-800)',
        flexShrink: 0,
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-400)', padding: '6px', borderRadius: '6px', transition: 'color 0.2s' }}
          >
            <Menu style={{ width: '20px', height: '20px' }} />
          </button>
        )}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--slate-50)',
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {MODULE_LABELS[activeModule]}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)', letterSpacing: '0.08em', marginTop: '1px' }}>
            CORTEXBUILD ULTIMATE · UK
          </p>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Search */}
        {searchOpen ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--slate-800)',
              border: '1px solid var(--slate-600)',
              borderRadius: '8px', padding: '6px 12px',
            }}
          >
            <Search style={{ width: '14px', height: '14px', color: 'var(--slate-400)' }} />
            <input
              autoFocus
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: '13px',
                color: 'var(--slate-100)', width: '180px',
              }}
              placeholder="Search anything..."
              onBlur={() => setSearchOpen(false)}
            />
            <button
              onClick={() => setSearchOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', padding: '2px' }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: 'none', border: '1px solid transparent', cursor: 'pointer',
              color: 'var(--slate-400)', padding: '8px', borderRadius: '8px',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--slate-800)'; e.currentTarget.style.color = 'var(--slate-100)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--slate-400)'; }}
          >
            <Search style={{ width: '15px', height: '15px' }} />
          </button>
        )}

        {/* Online status */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: online ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${online ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}
        >
          {online
            ? <Wifi style={{ width: '11px', height: '11px', color: 'var(--emerald-400)' }} />
            : <WifiOff style={{ width: '11px', height: '11px', color: 'var(--red-400)' }} />
          }
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 600,
            color: online ? 'var(--emerald-400)' : 'var(--red-400)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {online ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => setNotificationsOpen(true)}
          style={{
            background: 'none', border: '1px solid transparent', cursor: 'pointer',
            color: 'var(--slate-400)', padding: '8px', borderRadius: '8px',
            transition: 'all 0.2s', position: 'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--slate-800)'; e.currentTarget.style.color = 'var(--slate-100)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--slate-400)'; }}
        >
          <Bell style={{ width: '15px', height: '15px' }} />
          {notifications > 0 && (
            <span
              style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#ef4444', color: 'white',
                fontSize: '8px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {notifications}
            </span>
          )}
        </button>
        {notificationsOpen && <NotificationsPanel authToken={null} onClose={() => setNotificationsOpen(false)} />}

        {/* Theme Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            style={{
              background: 'none', border: '1px solid transparent', cursor: 'pointer',
              color: 'var(--slate-400)', padding: '8px', borderRadius: '8px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--slate-800)'; e.currentTarget.style.color = 'var(--slate-100)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--slate-400)'; }}
          >
            <ThemeIcon style={{ width: '15px', height: '15px' }} />
          </button>
          {themeMenuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', marginTop: '8px',
              background: 'var(--slate-800)', border: '1px solid var(--slate-700)',
              borderRadius: '8px', padding: '4px', minWidth: '140px', zIndex: 100,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setTheme(opt.value as 'light' | 'dark' | 'system'); setThemeMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', background: theme === opt.value ? 'var(--slate-700)' : 'transparent',
                    border: 'none', cursor: 'pointer', borderRadius: '6px',
                    color: theme === opt.value ? 'var(--amber-400)' : 'var(--slate-300)',
                    fontFamily: 'var(--font-body)', fontSize: '12px',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--slate-700)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = theme === opt.value ? 'var(--slate-700)' : 'transparent'; }}
                >
                  <opt.icon style={{ width: '14px', height: '14px' }} />
                  {opt.label}
                  {theme === opt.value && (
                    <span style={{ marginLeft: 'auto', color: 'var(--amber-400)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'var(--slate-700)', margin: '0 4px' }} />

        {/* User menu */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'none', border: '1px solid transparent',
            cursor: 'pointer', padding: '6px 10px', borderRadius: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--slate-800)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <div
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--amber-500), var(--amber-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 700,
              color: 'var(--slate-950)',
            }}
          >
            AS
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, color: 'var(--slate-100)', lineHeight: 1.2 }}>Adrian Stanca</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--slate-500)' }}>CortexBuild Ltd</div>
          </div>
          <ChevronDown style={{ width: '12px', height: '12px', color: 'var(--slate-500)' }} />
        </button>
      </div>
    </header>
  );
}
