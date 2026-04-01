/**
 * Breadcrumbs Component
 * Navigation breadcrumb trail for context and quick navigation
 */
import { ChevronRight, Home } from 'lucide-react';
import { type Module } from '../../types';

interface BreadcrumbItem {
  label: string;
  href?: string;
  module?: Module;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (module: Module) => void;
}

const MODULE_LABELS: Record<Module, string> = {
  'dashboard': 'Dashboard',
  'projects': 'Projects',
  'invoicing': 'Invoicing',
  'accounting': 'Accounting',
  'financial-reports': 'Financial Reports',
  'procurement': 'Procurement',
  'rams': 'RAMS',
  'cis': 'CIS Returns',
  'site-ops': 'Site Operations',
  'teams': 'Teams',
  'tenders': 'Tenders',
  'analytics': 'Analytics',
  'safety': 'Safety',
  'field-view': 'Field View',
  'crm': 'CRM',
  'documents': 'Documents',
  'timesheets': 'Timesheets',
  'plant': 'Plant & Equipment',
  'subcontractors': 'Subcontractors',
  'ai-assistant': 'AI Assistant',
  'rfis': 'RFIs',
  'change-orders': 'Change Orders',
  'punch-list': 'Punch List',
  'inspections': 'Inspections',
  'risk-register': 'Risk Register',
  'drawings': 'Drawings',
  'meetings': 'Meetings',
  'materials': 'Materials',
  'daily-reports': 'Daily Reports',
  'marketplace': 'Marketplace',
  'settings': 'Settings',
  'insights': 'Insights',
  'notifications': 'Notifications',
  'executive-reports': 'Executive Reports',
  'predictive-analytics': 'Predictive Analytics',
  'calendar': 'Calendar',
  'search': 'Search',
  'audit-log': 'Audit Log',
  'variations': 'Variations',
  'defects': 'Defects',
  'valuations': 'Valuations',
  'specifications': 'Specifications',
  'temp-works': 'Temp Works',
  'signage': 'Signage',
  'waste-management': 'Waste Management',
  'sustainability': 'Sustainability',
  'training': 'Training',
  'certifications': 'Certifications',
  'prequalification': 'Prequalification',
  'lettings': 'Lettings',
  'measuring': 'Measuring',
  'email-history': 'Email History',
  'permissions': 'Permissions',
  'report-templates': 'Report Templates',
  'bim-viewer': 'BIM Viewer',
  'cost-management': 'Cost Management',
  'submittal-management': 'Submittals',
  'dev-sandbox': 'Dev Sandbox',
  'ai-vision': 'AI Vision',
  'my-desktop': 'My Desktop',
};

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center text-sm text-slate-400 mb-4" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {/* Home link */}
        <li>
          <button
            onClick={() => onNavigate?.('dashboard')}
            className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            aria-label="Go to dashboard"
          >
            <Home className="w-4 h-4" />
          </button>
        </li>

        {/* Breadcrumb items */}
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-slate-600" aria-hidden="true" />
            {index === items.length - 1 ? (
              // Current page (not clickable)
              <span className="text-slate-200 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              // Clickable link
              <button
                onClick={() => item.module && onNavigate?.(item.module)}
                className="hover:text-amber-400 transition-colors"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * ModuleBreadcrumbs - Pre-configured for module navigation
 */
interface ModuleBreadcrumbsProps {
  currentModule: Module;
  onNavigate: (module: Module) => void;
  extraItems?: { label: string; href?: string }[];
}

export function ModuleBreadcrumbs({ currentModule, onNavigate, extraItems = [] }: ModuleBreadcrumbsProps) {
  const items = [
    { label: MODULE_LABELS[currentModule] || currentModule, module: currentModule },
    ...extraItems,
  ];

  return <Breadcrumbs items={items} onNavigate={onNavigate} />;
}
