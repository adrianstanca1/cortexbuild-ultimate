/**
 * Command Palette Component
 * Quick actions and navigation with Ctrl+K / Cmd+K
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Search,
  Command,
  X,
  ArrowRight,
  FileText,
  Settings,
  Users,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  LayoutDashboard,
  Calculator,
  ShoppingCart,
  ShieldCheck,
  Receipt,
  Hammer,
  MapPin,
  Layers,
  MessageSquare,
  ClipboardCheck,
  Triangle,
  FileStack,
  Building2,
  FileBarChart,
  Store,
  Bell,
  Eye,
  Mail,
  Lock,
  Construction,
  Clock,
  Bot,
  Activity,
  HardHat,
  GitPullRequest,
  CheckSquare,
  FileSearch,
  Package,
  ClipboardList,
  FolderOpen,
  Ruler,
  DollarSign,
  Coins,
  FileEdit,
  Upload,
  Box,
  GraduationCap,
  Award,
  Leaf,
  Trash2,
  Signpost,
  BarChart3,
  Brain,
  PieChart,
  BadgeCheck,
  Building,
  BookOpen,
  Webhook,
  LeafyGreen,
  UserCircle,
  CalendarDays,
} from 'lucide-react';
import { type Module } from '../../types';

interface CommandItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  module?: Module;
  action?: () => void;
  shortcut?: string;
  category: 'navigation' | 'action' | 'settings';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: Module) => void;
}

/** Human-readable labels aligned with sidebar where possible */
const MODULE_LABELS: Record<Module, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  invoicing: 'Invoicing',
  accounting: 'Accounting',
  'financial-reports': 'Financial Reports',
  procurement: 'Procurement',
  rams: 'RAMS',
  cis: 'CIS Returns',
  'site-ops': 'Site Operations',
  teams: 'Teams & Labour',
  tenders: 'Tenders & Bids',
  analytics: 'Analytics & BI',
  safety: 'Safety & HSE',
  'field-view': 'Field View',
  crm: 'CRM & Clients',
  documents: 'Documents',
  timesheets: 'Timesheets',
  plant: 'Plant & Equipment',
  subcontractors: 'Subcontractors',
  'ai-assistant': 'AI Assistant',
  rfis: 'RFIs',
  'change-orders': 'Change Orders',
  'punch-list': 'Punch List',
  inspections: 'Inspections',
  'risk-register': 'Risk Register',
  drawings: 'Drawings & Plans',
  meetings: 'Meetings',
  materials: 'Materials',
  'daily-reports': 'Daily Reports',
  marketplace: 'AI Marketplace',
  settings: 'Settings',
  insights: 'AI Insights',
  notifications: 'Notifications',
  'executive-reports': 'Executive Reports',
  'predictive-analytics': 'Predictive Analytics',
  calendar: 'Calendar',
  search: 'Global Search',
  'audit-log': 'Audit Log',
  variations: 'Variations',
  defects: 'Defects',
  valuations: 'Valuations',
  specifications: 'Specifications',
  'temp-works': 'Temp Works',
  signage: 'Signage',
  'waste-management': 'Waste Management',
  sustainability: 'Sustainability',
  training: 'Training',
  certifications: 'Certifications',
  prequalification: 'Prequalification',
  lettings: 'Lettings',
  measuring: 'Measuring',
  'email-history': 'Email History',
  permissions: 'Permissions',
  'report-templates': 'Report Templates',
  'bim-viewer': 'BIM Viewer',
  'cost-management': 'Cost Management',
  'submittal-management': 'Submittals',
  'dev-sandbox': 'Dev Sandbox',
  'ai-vision': 'AI Vision',
  'my-desktop': 'My Desktop',
  'advanced-analytics': 'Advanced Analytics',
  'project-calendar': 'Project Calendar',
  'admin-dashboard': 'Admin Dashboard',
  'team-chat': 'Team Chat',
  'activity-feed': 'Activity Feed',
  'client-portal': 'Client Portal',
  webhooks: 'Webhooks',
  'carbon-estimating': 'Carbon Estimating',
  'site-inspections': 'Site Inspections',
  'bim-4d': 'BIM 4D',
};

const MODULE_ICON_COMPONENTS: Partial<Record<Module, LucideIcon>> = {
  dashboard: LayoutDashboard,
  projects: FolderOpen,
  invoicing: FileText,
  accounting: Calculator,
  'financial-reports': PieChart,
  procurement: ShoppingCart,
  rams: ShieldCheck,
  cis: Receipt,
  'site-ops': Hammer,
  teams: Users,
  tenders: TrendingUp,
  analytics: BarChart3,
  safety: AlertTriangle,
  'field-view': MapPin,
  crm: Building2,
  documents: BookOpen,
  timesheets: Clock,
  plant: Hammer,
  subcontractors: UserCircle,
  'ai-assistant': Bot,
  rfis: HardHat,
  'change-orders': GitPullRequest,
  'punch-list': CheckSquare,
  inspections: ClipboardCheck,
  'risk-register': Triangle,
  drawings: Layers,
  meetings: MessageSquare,
  materials: Package,
  'daily-reports': ClipboardList,
  marketplace: Store,
  settings: Settings,
  insights: Brain,
  notifications: Bell,
  'executive-reports': FileBarChart,
  'predictive-analytics': TrendingUp,
  calendar: CalendarDays,
  search: Search,
  'audit-log': Eye,
  variations: FileEdit,
  defects: FileSearch,
  valuations: Coins,
  specifications: FileStack,
  'temp-works': Construction,
  signage: Signpost,
  'waste-management': Trash2,
  sustainability: Leaf,
  training: GraduationCap,
  certifications: Award,
  prequalification: BadgeCheck,
  lettings: Building,
  measuring: Ruler,
  'email-history': Mail,
  permissions: Lock,
  'report-templates': FileText,
  'bim-viewer': Box,
  'cost-management': DollarSign,
  'submittal-management': Upload,
  'dev-sandbox': Bot,
  'ai-vision': Eye,
  'my-desktop': LayoutDashboard,
  'advanced-analytics': BarChart3,
  'project-calendar': CalendarDays,
  'admin-dashboard': ShieldCheck,
  'team-chat': MessageSquare,
  'activity-feed': Activity,
  'client-portal': Briefcase,
  webhooks: Webhook,
  'carbon-estimating': LeafyGreen,
  'site-inspections': ClipboardCheck,
  'bim-4d': Layers,
};

const ICON_CLASS = 'w-4 h-4';

function moduleIcon(module: Module): React.ReactNode {
  const C = MODULE_ICON_COMPONENTS[module] ?? Command;
  return <C className={ICON_CLASS} />;
}

/** Stable order: overview → projects → finance → ops → safety → business → AI → collab */
const MODULE_NAV_ORDER: Module[] = [
  'dashboard',
  'analytics',
  'advanced-analytics',
  'project-calendar',
  'ai-assistant',
  'insights',
  'predictive-analytics',
  'projects',
  'site-ops',
  'daily-reports',
  'field-view',
  'drawings',
  'meetings',
  'tenders',
  'invoicing',
  'accounting',
  'financial-reports',
  'cis',
  'procurement',
  'change-orders',
  'variations',
  'valuations',
  'cost-management',
  'prequalification',
  'lettings',
  'teams',
  'timesheets',
  'subcontractors',
  'plant',
  'materials',
  'rfis',
  'bim-viewer',
  'submittal-management',
  'temp-works',
  'measuring',
  'safety',
  'site-inspections',
  'rams',
  'inspections',
  'punch-list',
  'risk-register',
  'documents',
  'defects',
  'specifications',
  'crm',
  'executive-reports',
  'marketplace',
  'calendar',
  'search',
  'audit-log',
  'email-history',
  'permissions',
  'report-templates',
  'admin-dashboard',
  'settings',
  'signage',
  'waste-management',
  'sustainability',
  'training',
  'certifications',
  'ai-vision',
  'dev-sandbox',
  'my-desktop',
  'team-chat',
  'activity-feed',
  'notifications',
  'client-portal',
  'webhooks',
  'carbon-estimating',
  'bim-4d',
];

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const commandItems: CommandItem[] = useMemo(
    () => [
      ...MODULE_NAV_ORDER.map(module => ({
        id: `nav-${module}`,
        label: MODULE_LABELS[module],
        icon: moduleIcon(module),
        module,
        category: 'navigation' as const,
      })),
      {
        id: 'action-new-project',
        label: 'Create New Project',
        icon: <Briefcase className={ICON_CLASS} />,
        action: () => onNavigate('projects'),
        category: 'action' as const,
      },
      {
        id: 'action-upload-doc',
        label: 'Upload Document',
        icon: <FileText className={ICON_CLASS} />,
        action: () => onNavigate('documents'),
        category: 'action' as const,
      },
      {
        id: 'settings-theme',
        label: 'Theme Settings',
        icon: <Settings className={ICON_CLASS} />,
        action: () => onNavigate('settings'),
        category: 'settings' as const,
        shortcut: 'T',
      },
    ],
    [onNavigate]
  );

  const filteredItems = commandItems.filter(
    item =>
      query === '' ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase())
  );

  const safeLen = Math.max(filteredItems.length, 1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % safeLen);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + safeLen) % safeLen);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem) {
          if (selectedItem.module) {
            onNavigate(selectedItem.module);
          } else if (selectedItem.action) {
            selectedItem.action();
          }
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onNavigate, onClose, safeLen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(i => (filteredItems.length === 0 ? 0 : Math.min(i, filteredItems.length - 1)));
  }, [query, filteredItems.length]);

  const handleItemClick = (item: CommandItem) => {
    if (item.module) {
      onNavigate(item.module);
    } else if (item.action) {
      item.action();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative w-full max-w-2xl mx-4 card bg-slate-900 border border-slate-700 shadow-2xl animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Jump to a module or run an action…"
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 outline-none text-base"
            aria-label="Search commands"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-800 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-mono bg-slate-800 text-slate-400 rounded">
            ESC
          </kbd>
        </div>

        <ul
          ref={listRef}
          className="max-h-96 overflow-auto p-2"
          role="listbox"
          aria-label="Command suggestions"
        >
          {filteredItems.length === 0 ? (
            <li className="p-8 text-center text-slate-400">
              <Command className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </li>
          ) : (
            filteredItems.map((item, index) => (
              <li key={item.id}>
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                    index === selectedIndex
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon || <Command className="w-4 h-4" />}
                  </span>

                  <span className="flex-1 font-medium">{item.label}</span>

                  <span className="text-xs text-slate-500 capitalize">{item.category}</span>

                  {item.shortcut && (
                    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded">
                      {item.shortcut}
                    </kbd>
                  )}

                  {index === selectedIndex && <ArrowRight className="w-4 h-4 text-amber-400" />}
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↑↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">↵</kbd>
              to select
            </span>
          </div>
          <span>{filteredItems.length} commands</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
