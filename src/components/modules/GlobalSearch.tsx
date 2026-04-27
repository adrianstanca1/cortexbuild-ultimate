import { useState, useEffect, useRef, useCallback } from 'react';
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
  Sparkles,
  Brain,
  Trash2,
  Save,
  TrendingUp,
} from 'lucide-react';
import { searchApi } from '../../services/api';
import { toast } from 'sonner';
import { EmptyState } from '../ui/EmptyState';
import clsx from 'clsx';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

type AnyRow = Record<string, unknown>;
type SubTab = 'search' | 'recent' | 'saved' | 'advanced' | 'analytics';

interface SearchResult {
  [key: string]: AnyRow[] | unknown;
}

interface SemanticMatch {
  type: 'semantic';
  table: string;
  row_id: string;
  chunk_text: string;
  score: number;
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

interface PopularSearch {
  term: string;
  count: number;
  category: string;
}

const resultIcons: Record<string, React.ElementType> = {
  projects: Briefcase,
  invoices: FileText,
  contacts: User,
  rfis: ClipboardList,
  documents: FolderOpen,
  team: Users,
  default: Search,
};

const resultLabels: Record<string, string> = {
  projects: 'Projects',
  invoices: 'Invoices',
  contacts: 'Contacts',
  rfis: 'RFIs',
  documents: 'Documents',
  team: 'Team',
};

export function GlobalSearch({
  onClose,
  embedded = false,
}: {
  onClose?: () => void;
  /** When true, render inline in the main area instead of a full-screen overlay */
  embedded?: boolean;
}) {
  const [subTab, setSubTab] = useState<SubTab>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [semanticResults, setSemanticResults] = useState<SemanticMatch[]>([]);
  const [searchMode, setSearchMode] = useState<string>('text');
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState({
    module: 'all',
    status: 'all',
    dateRange: 'all',
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string[]>([]);
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [statusFilterAdvanced, setStatusFilterAdvanced] = useState('all');
  const [recentSearchesExpanded, setRecentSearchesExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('cortexbuild_search_history');
    if (saved) setHistory(JSON.parse(saved));
    const savedSearches = localStorage.getItem('cortexbuild_saved_searches');
    if (savedSearches) setSavedSearches(JSON.parse(savedSearches));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && embedded === false) {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [embedded, onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults(null);
      setSemanticResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchApi.search(query);
        setResults((data.results || {}) as SearchResult);
        setSemanticResults(((data.semanticResults || []) as unknown) as SemanticMatch[]);
        setSearchMode(data.searchMode || 'text');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        console.error('Search error', err);
        toast.error(msg);
        setResults(null);
        setSemanticResults([]);
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
          ? items.map((item: unknown, _i: number) => ({
              type,
              item: item as AnyRow,
            }))
          : []
      )
    : [];

  const totalCount = allResults.length + semanticResults.length;

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

  const saveCurrentSearch = useCallback(() => {
    if (!query.trim() || !saveSearchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }
    const newSearch: SavedSearch = {
      id: String(Date.now()),
      name: saveSearchName,
      query,
      module: advancedFilters.module,
      resultCount: allResults.length,
      createdDate: new Date().toISOString().slice(0, 10),
    };
    const updated = [newSearch, ...savedSearches].slice(0, 20);
    setSavedSearches(updated);
    localStorage.setItem('cortexbuild_saved_searches', JSON.stringify(updated));
    toast.success(`Saved search "${saveSearchName}"`);
    setSaveSearchName('');
    setShowSaveModal(false);
  }, [query, saveSearchName, advancedFilters.module, allResults.length, savedSearches]);

  const deleteSavedSearch = useCallback((id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem('cortexbuild_saved_searches', JSON.stringify(updated));
    toast.success('Search deleted');
  }, [savedSearches]);

  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setQuery(search.query);
    setSubTab('search');
    saveToHistory(search.query);
  }, []);

  const shellClass = embedded
    ? 'relative w-full z-auto'
    : 'fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50';
  const panelClass = embedded
    ? 'bg-gray-900 border border-gray-700 rounded-xl w-full max-w-4xl mx-auto shadow-2xl min-h-[min(70vh,720px)] max-h-[calc(100dvh-10rem)] flex flex-col'
    : 'bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl shadow-2xl max-h-[85vh] flex flex-col';

  return (
    <>
      <ModuleBreadcrumbs currentModule="search" />
      <div className={shellClass} onClick={embedded ? undefined : onClose} role={embedded ? undefined : 'presentation'}>
      <div
        className={panelClass}
        data-allow-chrome-shortcuts
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800">
          {embedded && (
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-300">Global search</h2>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          )}
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
              placeholder="Search projects, invoices, contacts, RFIs, documents, AI..."
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {searchMode === 'hybrid' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-cyan-400">
              <Sparkles className="h-3 w-3" />
              AI semantic search active — showing ranked contextual results
            </div>
          )}
          <div className="mt-3 flex gap-2 text-xs text-gray-500">
            <kbd className="px-2 py-1 bg-gray-800 rounded">Ctrl+Shift+K</kbd>
            <span className="text-gray-600">/</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded">⌘⇧K</kbd>
            <span>to open global search from anywhere</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="border-b border-gray-800 flex gap-1 px-4 bg-gray-900/50">
          {[
            { key: 'search' as SubTab, label: 'Search' },
            { key: 'recent' as SubTab, label: 'Recent' },
            { key: 'saved' as SubTab, label: 'Saved Searches' },
            { key: 'advanced' as SubTab, label: 'Advanced' },
            { key: 'analytics' as SubTab, label: 'Popular' },
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

              {results && totalCount === 0 && (
                <EmptyState
                  icon={Search}
                  title={`No results found for "${String(query)}"`}
                  description="Try a different search term or check your filters."
                  className="py-12"
                />
              )}

              {/* Semantic / AI Results */}
              {semanticResults.length > 0 && (
                <div className="p-4 border-b border-gray-800 bg-gray-800/30">
                  <div className="flex items-center gap-2 mb-3 text-xs text-cyan-400 uppercase font-medium">
                    <Brain className="h-4 w-4" />
                    AI Semantic Results (RAG)
                  </div>
                  <div className="space-y-2">
                    {semanticResults.slice(0, 8).map((match, i) => {
                      const Icon = resultIcons[match.table] || Search;
                      return (
                        <button
                          key={`${match.table}-${match.row_id}-${i}`}
                          onClick={() => { handleSearch(); onClose?.(); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-300 line-clamp-2">{match.chunk_text}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {resultLabels[match.table] || match.table}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-cyan-400 flex-shrink-0">
                              {Math.round(match.score * 100)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
            <div className="p-4 space-y-3">
              <button type="button" onClick={() => setShowSaveModal(true)} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 flex items-center justify-center gap-2">
                <Save size={16} />
                Save Current Search
              </button>
              {savedSearches.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No saved searches yet</p>
              ) : (
                <div className="space-y-2">
                  {savedSearches.map(s => (
                    <div key={s.id} className="bg-gray-800/50 rounded-lg p-3 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                      <div className="flex-1 cursor-pointer" onClick={() => loadSavedSearch(s)}>
                        <p className="text-sm font-medium text-white">{String(s.name)}</p>
                        <p className="text-xs text-gray-400">{String(s.resultCount)} results · {s.createdDate}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => loadSavedSearch(s)} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded" title="Load search">
                          <ArrowRight size={14} />
                        </button>
                        <button type="button" onClick={() => deleteSavedSearch(s.id)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded" title="Delete search">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Advanced Tab */}
          {subTab === 'advanced' && (
            <div className="p-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Entity Type</label>
                <div className="space-y-2">
                  {['Projects', 'RFIs', 'Invoices', 'Documents', 'Users', 'Tasks'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entityTypeFilter.includes(type)}
                        onChange={e => {
                          if (e.target.checked) {
                            setEntityTypeFilter(prev => [...prev, type]);
                          } else {
                            setEntityTypeFilter(prev => prev.filter(t => t !== type));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select
                  value={dateRangeFilter}
                  onChange={e => setDateRangeFilter(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={statusFilterAdvanced}
                  onChange={e => setStatusFilterAdvanced(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <button type="button" onClick={() => { handleSearch(); toast.success('Advanced search applied'); }} className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm hover:bg-orange-700 flex items-center justify-center gap-2">
                <Filter className="h-4 w-4" />
                Apply Filters
              </button>
            </div>
          )}


          {subTab === 'analytics' && (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Most Searched Terms</span>
                </div>
                <div className="space-y-2">
                  {[
                    { term: 'Acme Project', count: 28, category: 'Projects' },
                    { term: 'Invoice INV-001', count: 19, category: 'Invoices' },
                    { term: 'John Smith', count: 15, category: 'Users' },
                    { term: 'Electrical Safety', count: 12, category: 'Documents' },
                    { term: 'RFI-42', count: 11, category: 'RFIs' },
                    { term: 'Site Plan Q1', count: 9, category: 'Documents' },
                    { term: 'Budget Review', count: 8, category: 'Projects' },
                    { term: 'Structural Report', count: 7, category: 'Documents' },
                  ].map((search, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(search.term)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-gray-300">{search.term}</p>
                        <p className="text-xs text-gray-500">{search.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-orange-400">{search.count} searches</span>
                    </button>
                  ))}
                </div>
              </div>
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
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">Cmd+K</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-800 rounded ml-1">Ctrl+K</kbd>
            </span>
          </div>
          {results && <span className="text-blue-400">{Number(allResults.length)} results</span>}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Save Search</h2>
              <button type="button" onClick={() => { setShowSaveModal(false); setSaveSearchName(''); }} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Name</label>
                <input
                  type="text"
                  value={saveSearchName}
                  onChange={e => setSaveSearchName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveCurrentSearch(); }}
                  placeholder="e.g., 'Active Projects This Month'"
                  className="w-full border border-gray-600 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  autoFocus
                />
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <p className="text-xs text-gray-400 mb-1">Search query:</p>
                <p className="text-sm text-gray-300 truncate">{query}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowSaveModal(false); setSaveSearchName(''); }} className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-sm text-gray-300 hover:bg-gray-700">
                  Cancel
                </button>
                <button type="button" onClick={saveCurrentSearch} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50" disabled={!saveSearchName.trim()}>
                  Save Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
export default GlobalSearch;
