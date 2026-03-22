/**
 * CortexBuild Ultimate — Keyboard Shortcuts Help Modal
 */
import { X, Keyboard } from 'lucide-react';
import { DEFAULT_SHORTCUTS, formatShortcut } from '../../hooks/useKeyboardShortcuts';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: 'Navigation',
    shortcuts: [
      DEFAULT_SHORTCUTS.goToDashboard,
      DEFAULT_SHORTCUTS.goToProjects,
      DEFAULT_SHORTCUTS.goToInvoicing,
      DEFAULT_SHORTCUTS.goToSafety,
      DEFAULT_SHORTCUTS.goToSettings,
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      DEFAULT_SHORTCUTS.newProject,
      DEFAULT_SHORTCUTS.newInvoice,
      DEFAULT_SHORTCUTS.search,
      DEFAULT_SHORTCUTS.toggleSidebar,
    ],
  },
  {
    title: 'Help',
    shortcuts: [
      DEFAULT_SHORTCUTS.showHelp,
    ],
  },
];

export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Keyboard className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-500">Work faster with these shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {SHORTCUT_GROUPS.map(group => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
                    >
                      <span className="text-gray-300">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm font-mono text-white">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-gray-700 border border-gray-600 rounded text-[10px] font-mono">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}
