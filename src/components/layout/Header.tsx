import { useState } from 'react';
import { Bell, Search, Moon, Wifi, WifiOff, ChevronDown, Menu, X } from 'lucide-react';
import { type Module } from '../../types';

const MODULE_LABELS: Record<Module, string> = {
  'dashboard': 'Dashboard',
  'projects': 'Projects',
  'invoicing': 'Invoicing',
  'accounting': 'Accounting',
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
};

interface HeaderProps {
  activeModule: Module;
  onMenuToggle?: () => void;
}

export function Header({ activeModule, onMenuToggle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [online] = useState(true);
  const notifications = 4;

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-gray-900 border-b border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-4">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="text-gray-400 hover:text-white lg:hidden">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-sm font-semibold text-white">{MODULE_LABELS[activeModule]}</h1>
          <p className="text-[10px] text-gray-500">CortexBuild Ultimate · UK Construction Management</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-700">
            <Search className="w-4 h-4 text-gray-400" />
            <input autoFocus className="bg-transparent text-sm text-white outline-none w-48 placeholder-gray-500" placeholder="Search anything..." onBlur={() => setSearchOpen(false)} />
            <button onClick={() => setSearchOpen(false)}>
              <X className="w-4 h-4 text-gray-500 hover:text-gray-300" />
            </button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Online status */}
        <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full ${online ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="font-medium">{online ? 'Live' : 'Offline'}</span>
        </div>

        {/* Notifications */}
        <button className="relative text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
          <Bell className="w-4 h-4" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
              {notifications}
            </span>
          )}
        </button>

        {/* Dark mode */}
        <button className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
          <Moon className="w-4 h-4" />
        </button>

        {/* User menu */}
        <button className="flex items-center gap-2 hover:bg-gray-800 rounded-lg px-2 py-1.5 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            AS
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-white leading-tight">Adrian Stanca</div>
            <div className="text-[9px] text-gray-500">CortexBuild Ltd</div>
          </div>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
