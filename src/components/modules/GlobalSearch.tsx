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
  Star,
  Filter,
} from 'lucide-react';
import { searchApi } from '../../services/api';
import { EmptyState } from '../ui/EmptyState';
import clsx from 'clsx';

type AnyRow = Record<string, unknown>;
type SubTab = 'search' | 'recent' | 'saved' | 'advanced';

interface SearchResult {
  projects: AnyRow[];
  invoices: AnyRow[];
  contacts: AnyRow[];
  rfis: AnyRow[];
  documents: AnyRow[];
  team: AnyRow[];
  [key: string]: unknown;
}

interface SearchHistory {
  query: string;
  timestamp: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  module: string;
  resultCount: number;
  createdDate: string;
}

const resultIcons: Record<string, React.ElementType> = {
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
  const [subTab, setSubTab] = useState<SubTab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    module: 'all',
    status: 'all',
    dateRange: 'all',
  });
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
    const updated = [{ query: q, timestamp: Date.now() }, ...history.filter(h => h.query !== q)].slice(
      0,
      10
    );
    setHistory(updated);
    localStorage.setItem('cortexbuild_search_history', JSON.stringify(updated));
  };

  const handleSearch = () => {
    if (query.length >= 2) {
      saveToHistory(query);
    }
  };

  const allResults = results
    ? Object.entries(results).flatMap(([type, items]) =>
        Array.isArray(items)
          ? items.map((item: unknown, i: number) => ({
              type,
              item: item as AnyRow,
            }))
          : []
      )
    : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && allResults[selectedIndex]) {
      saveToHistory(query);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cortexbuild_search_history');
  };

  const pinSearch = (search: SavedSearch) => {
    setSavedSearches(prev =>
      prev.map(s => (s.id === search.id ? { ...s, id: String(Date.now()) } : s))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col"
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
              onChange={e => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search projects, invoices, contacts, RFIs, documents..."
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="mt-3 flex gap-2 text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+K</kbd>
            <span>to open search</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-gray-800 flex gap-1 px-4 bg-gray-900/50">
          {[
            { key: 'search' as SubTab, label: 'Search' },
            { key: 'recent' as SubTab, label: 'Recent' },
            { key: 'saved' as SubTab, label: 'Saved Searches' },
            { key: 'advanced' as SubTab, label: 'Advanced' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                subTab === tab.key
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Search Tab */}
          {subTab === 'search' && (
            <>
              {!results && history.length > 0 && (
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <History className="h-4 w-4" />
                      Recent searches
                    </div>
                    <button type="button" onClick={clearHistory} className="text-xs text-gray-500 hover:text-white">
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(String(h.query))}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-800 text-gray-300 text-sm flex items-center gap-3"
                      >
                        <History className="h-4 w-4 text-gray-600" />
                        {String(h.query)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!results && query.length < 2 && (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">Start typing to search across all modules</p>
                  <p className="text-xs text-gray-600">
                    Popular: "Acme Project" • "Invoice #INV-001" • "John Smith" • "RFI-42" • "Site Plan"
                  </p>
                </div>
              )}

              {results && allResults.length === 0 && (
                <EmptyState
                  icon={Search}
                  title={`No results found for "${String(query)}"`}
                  description="Try a different search term or check your filters."
                  className="py-12"
                />
              )}

              {results &&
                Object.entries(results).map(([type, items]) => {
                  if (!Array.isArray(items) || items.length === 0) return null;
                  const Icon = resultIcons[type] || Search;
                  return (
                    <div key={type} className="p-4 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500 uppercase">
                        <Icon className="h-4 w-4" />
                        {resultLabels[type] || type} ({Number(items.length)})
                      </div>
                      <div className="space-y-1">
                        {items.slice(0, 5).map((item: unknown, i: number) => {
                          const typedItem = item as AnyRow;
                          const itemId = String(typedItem.id || i);
                          return (
                            <button
                              key={itemId}
                              onClick={() => {
                                handleSearch();
                                onClose?.();
                              }}
                              className={clsx(
                                'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
                                'hover:bg-gray-800 text-gray-300'
                              )}
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {String(
                                    typedItem.name || typedItem.number || typedItem.title || typedItem.subject || ''
                                  )}
                                </p>
                                <p className="text-xs opacity-70">
                                  {typedItem.client ? String(typedItem.client) : ''}
                                  {typedItem.company ? String(typedItem.company) : ''}
                                  {typedItem.role ? ` • ${String(typedItem.role)}` : ''}
                                  {typedItem.project ? ` • ${String(typedItem.project)}` : ''}
                                </p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-600" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </>
          )}

          {/* Recent Tab */}
          {subTab === 'recent' && (
            <div className="p-4 space-y-2">
              {history.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No recent searches</p>
              ) : (
                history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(String(h.query))}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 text-gray-300 text-sm flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <History className="h-4 w-4 text-gray-600" />
                      {String(h.query)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(Number(h.timestamp)).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Saved Searches Tab */}
          {subTab === 'saved' && (
            <div className="p-4 space-y-2">
              {savedSearches.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No saved searches yet</p>
              ) : (
                savedSearches.map(s => (
                  <div key={s.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{String(s.name)}</p>
                      <p className="text-xs text-gray-400">{String(s.resultCount)} results</p>
                    </div>
                    <button className="text-gray-400 hover:text-yellow-400">
                      <Star className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Advanced Tab */}
          {subTab === 'advanced' && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Module</label>
                <select
                  value={advancedFilters.module}
                  onChange={e =>
                    setAdvancedFilters(prev => ({ ...prev, module: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                >
                  <option value="all">All Modules</option>
                  <option value="projects">Projects</option>
                  <option value="invoices">Invoices</option>
                  <option value="documents">Documents</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  value={advancedFilters.status}
                  onChange={e =>
                    setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm">
                <Filter className="h-4 w-4 inline mr-2" />
                Run Advanced Search
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-800 bg-gray-900/50 p-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Esc</kbd> Close
            </span>
          </div>
          {results && <span className="text-blue-400">{Number(allResults.length)} results</span>}
        </div>
      </div>
    </div>
  );
}
