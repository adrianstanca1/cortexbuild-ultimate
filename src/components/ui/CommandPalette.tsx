/**
 * Command Palette Component
 * Quick actions and navigation with Ctrl+K / Cmd+K
 */
import { useState, useEffect, useRef } from 'react';
import { Search, Command, X, ArrowRight, FileText, Settings, Users, Briefcase, AlertTriangle, TrendingUp } from 'lucide-react';
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

const MODULE_ICONS: Partial<Record<Module, React.ReactNode>> = {
  'dashboard': <TrendingUp className="w-4 h-4" />,
  'projects': <Briefcase className="w-4 h-4" />,
  'teams': <Users className="w-4 h-4" />,
  'safety': <AlertTriangle className="w-4 h-4" />,
  'documents': <FileText className="w-4 h-4" />,
  'settings': <Settings className="w-4 h-4" />,
  'rfis': <FileText className="w-4 h-4" />,
  'analytics': <TrendingUp className="w-4 h-4" />,
};

const MODULE_LABELS: Partial<Record<Module, string>> = {
  'dashboard': 'Dashboard',
  'projects': 'Projects',
  'teams': 'Teams & Labour',
  'safety': 'Safety & HSE',
  'documents': 'Documents',
  'settings': 'Settings',
  'rfis': 'RFIs',
  'analytics': 'Analytics',
  'invoicing': 'Invoicing',
  'accounting': 'Accounting',
  'crm': 'CRM & Clients',
  'timesheets': 'Timesheets',
};

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Build command items
  const commandItems: CommandItem[] = [
    // Navigation
    ...Object.entries(MODULE_LABELS).map(([module, label]) => ({
      id: `nav-${module}`,
      label: label || module,
      icon: MODULE_ICONS[module as Module],
      module: module as Module,
      category: 'navigation' as const,
    })),
    // Actions
    {
      id: 'action-new-project',
      label: 'Create New Project',
      icon: <Briefcase className="w-4 h-4" />,
      action: () => onNavigate('projects'),
      category: 'action' as const,
    },
    {
      id: 'action-upload-doc',
      label: 'Upload Document',
      icon: <FileText className="w-4 h-4" />,
      action: () => onNavigate('documents'),
      category: 'action' as const,
    },
    // Settings
    {
      id: 'settings-theme',
      label: 'Theme Settings',
      icon: <Settings className="w-4 h-4" />,
      action: () => onNavigate('settings'),
      category: 'settings' as const,
      shortcut: 'T',
    },
  ];

  // Filter items based on query
  const filteredItems = commandItems.filter(
    (item) =>
      query === '' ||
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.id.toLowerCase().includes(query.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
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
  }, [isOpen, filteredItems, selectedIndex, onNavigate, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle item click
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Command Palette */}
      <div
        className="relative w-full max-w-2xl mx-4 card bg-slate-900 border border-slate-700 shadow-2xl animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
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

        {/* Results */}
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
                  {/* Icon */}
                  <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    {item.icon || <Command className="w-4 h-4" />}
                  </span>

                  {/* Label */}
                  <span className="flex-1 font-medium">{item.label}</span>

                  {/* Category badge */}
                  <span className="text-xs text-slate-500 capitalize">{item.category}</span>

                  {/* Shortcut */}
                  {item.shortcut && (
                    <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-800 text-slate-400 rounded">
                      {item.shortcut}
                    </kbd>
                  )}

                  {/* Arrow for selected */}
                  {index === selectedIndex && (
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  )}
                </button>
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
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
