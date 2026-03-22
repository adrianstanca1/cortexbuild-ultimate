import { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Briefcase,
  FileText,
  Users,
  User,
  ClipboardList,
  FolderOpen,
  Loader2,
  ArrowRight,
  History,
  TrendingUp,
} from 'lucide-react';
import { searchApi } from '../../services/api';
import clsx from 'clsx';

interface SearchResult {
  projects: Array<{ id: string; name: string; client: string; status: string; type: string }>;
  invoices: Array<{ id: string; number: string; client: string; amount: string; status: string }>;
  contacts: Array<{ id: string; name: string; company: string; email: string; role: string }>;
  rfis: Array<{ id: string; number: string; subject: string; status: string; project: string }>;
  documents: Array<{ id: string; name: string; type: string; category: string; project: string }>;
  team: Array<{ id: string; name: string; role: string; trade: string }>;
  [key: string]: unknown;
}

interface SearchHistory {
  query: string;
  timestamp: number;
}

const resultIcons: Record<string, typeof Briefcase> = {
  projects: Briefcase,
  invoices: FileText,
  contacts: User,
  rfis: ClipboardList,
  documents: FolderOpen,
  team: Users,
};

const resultLabels: Record<string, string> = {
  projects: 'Projects',
  invoices: 'Invoices',
  contacts: 'Contacts',
  rfis: 'RFIs',
  documents: 'Documents',
  team: 'Team',
};

export function GlobalSearch({ onClose }: { onClose?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const saved = localStorage.getItem('cortexbuild_search_history');
    if (saved) setHistory(JSON.parse(saved));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchApi.search(query);
        setResults(data.results as SearchResult);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const saveToHistory = (q: string) => {
    const updated = [{ query: q, timestamp: Date.now() }, ...history.filter(h => h.query !== q)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('cortexbuild_search_history', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (query.length >= 2) {
      saveToHistory(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = results ? Object.entries(results).flatMap(([type, items]) =>
      (items as unknown[]).map((item: unknown, i: number) => ({ type, item: item as Record<string, unknown> }))
    ) : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      const selected = allResults[selectedIndex];
      saveToHistory(query);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cortexbuild_search_history');
  };

  const allResults = results ? Object.entries(results).flatMap(([type, items]) =>
    (items as unknown[]).map((item: unknown, i: number) => ({ type, item: item as Record<string, unknown> }))
  ) : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-500" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              onSubmit={handleSearch}
              placeholder="Search projects, invoices, contacts, RFIs..."
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {!results && history.length > 0 && (
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <History className="h-4 w-4" />
                  Recent searches
                </div>
                <button onClick={clearHistory} className="text-xs text-gray-500 hover:text-white">Clear</button>
              </div>
              <div className="space-y-1">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(h.query)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 text-sm flex items-center gap-3"
                  >
                    <History className="h-4 w-4 text-gray-600" />
                    {h.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!results && query.length < 2 && (
            <div className="p-8 text-center">
              <Search className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Start typing to search across all modules</p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
                <span>Projects</span>
                <span>•</span>
                <span>Invoices</span>
                <span>•</span>
                <span>Contacts</span>
                <span>•</span>
                <span>RFIs</span>
                <span>•</span>
                <span>Documents</span>
              </div>
            </div>
          )}

          {results && allResults.length === 0 && (
            <div className="p-8 text-center">
              <X className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No results found for "{query}"</p>
            </div>
          )}

          {results && Object.entries(results).map(([type, items]) => {
            if (!(items as unknown[]).length) return null;
            const Icon = resultIcons[type] || Search;
            return (
              <div key={type} className="p-4 border-b border-gray-800 last:border-0">
                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 uppercase">
                  <Icon className="h-4 w-4" />
                  {resultLabels[type] || type}
                </div>
                <div className="space-y-1">
                  {(items as unknown[]).map((item: unknown, i: number) => {
                    const typedItem = item as Record<string, unknown>;
                    const itemId = String(typedItem.id || i);
                    const globalIndex = allResults.findIndex(r => r.item.id === typedItem.id);
                    return (
                      <button
                        key={itemId}
                        onClick={() => { saveToHistory(query); onClose?.(); }}
                        className={clsx(
                          'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
                          globalIndex === selectedIndex ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300'
                        )}
                      >
                        <div>
                          <p className="font-medium">{String(typedItem.name || typedItem.number || typedItem.title || typedItem.subject || '')}</p>
                          <p className="text-xs opacity-70">
                            {typedItem.client ? String(typedItem.client) : ''}
                            {typedItem.company ? String(typedItem.company) : ''}
                            {typedItem.role ? ` • ${String(typedItem.role)}` : ''}
                            {typedItem.trade ? ` • ${String(typedItem.trade)}` : ''}
                            {typedItem.project ? ` • ${String(typedItem.project)}` : ''}
                          </p>
                        </div>
                        <ArrowRight className={clsx('h-4 w-4', globalIndex === selectedIndex ? 'text-white' : 'text-gray-600')} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd> Select</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd> Close</span>
          </div>
          {results && <span className="text-blue-400">{allResults.length} results</span>}
        </div>
      </div>
    </div>
  );
}
