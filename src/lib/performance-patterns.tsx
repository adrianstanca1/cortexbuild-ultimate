/**
 * Frontend Performance Patterns
 * Bundle Optimization, Lazy Loading, and Prefetching Strategies
 */

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
} from 'react';


// ═══════════════════════════════════════════════════════════════════════════════
// LAZY LOADING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Lazy load a component with automatic code splitting
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFn);

  return function LazyWrapper(props: ComponentProps<T>) {
    const C = LazyComponent as unknown as ComponentType<Record<string, unknown>>;
    return (
      <Suspense fallback={fallback ?? <DefaultSkeleton />}>
        <C {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  };
}

function DefaultSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-base-300 rounded w-3/4 mb-2" />
      <div className="h-4 bg-base-300 rounded w-1/2" />
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// PREFETCHING STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Prefetch resources when user hovers over link
 */
export function createPrefetchOnHover() {
  const prefetched = new Set<string>();

  return function prefetchOnHover(url: string) {
    if (prefetched.has(url)) return;
    prefetched.add(url);

    // Prefetch page chunk
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = url;
    document.head.appendChild(link);
  };
}

/**
 * Prefetch images for faster perceived loading
 */
export function prefetchImage(url: string): void {
  const img = new Image();
  img.src = url;
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * Prefetch data using React Query
 */
export function createDataPrefetcher<T>(
  queryClient: import('@tanstack/react-query').QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  staleTime = 60_000
) {
  return () => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime,
    });
  };
}


// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE HINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Add DNS prefetch for external domains
 */
export function addDnsPrefetch(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to critical origins
 */
export function preconnect(urls: string[]): void {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Initialize critical prefetches on page load
 */
export function initPrefetches() {
  // Preconnect to API
  preconnect(['http://localhost:3001', 'https://www.cortexbuildpro.com']);

  // DNS prefetch for analytics, etc.
  addDnsPrefetch([]);
}


// ═══════════════════════════════════════════════════════════════════════════════
// MEMOIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stable callback reference for event handlers
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: unknown[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps) as T;
}

/**
 * Stable reference for objects passed to child components
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: unknown[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}


// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE OPTIMIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface ImageLoadingOptions {
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchpriority?: 'high' | 'low' | 'auto';
}

/**
 * Optimized image component with lazy loading
 */
export function OptimizedImage({
  src,
  alt,
  className,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & ImageLoadingOptions) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      {...props}
    />
  );
}

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[]
): string {
  return widths
    .map(w => {
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.set('w', String(w));
      return `${url.toString()} ${w}w`;
    })
    .join(', ');
}


// ═══════════════════════════════════════════════════════════════════════════════
// BUNDLE ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Dynamic import with loading state
 */
export function useDynamicImport<T>(
  importFn: () => Promise<T>,
  options: {
    skip?: boolean;
    onLoading?: () => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: !options.skip,
    error: null,
  });

  // Note: importFn and options are intentionally omitted — importFn is stable
  // (useCallback upstream) and options is a fresh object per render, so relying on
  // skip as the signal is correct.
  useEffect(() => {
    if (options.skip) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function load() {
      options.onLoading?.();
      setState({ data: null, loading: true, error: null });

      try {
        const module = await importFn();
        if (!cancelled) {
          setState({ data: module, loading: false, error: null });
        }
      } catch (e) {
        if (!cancelled) {
          const error = e instanceof Error ? e : new Error(String(e));
          setState({ data: null, loading: false, error });
          options.onError?.(error);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only tracking options.skip
  }, [options.skip]);

  return state;
}


// ═══════════════════════════════════════════════════════════════════════════════
// VIRTUALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Windowing helper for large lists
 */
export interface VirtualWindowConfig {
  itemHeight: number;
  overscan?: number;
}

/**
 * Calculate visible range for windowing
 */
export function getVisibleRange(
  scrollTop: number,
  containerHeight: number,
  config: VirtualWindowConfig
): { start: number; end: number } {
  const { itemHeight, overscan = 3 } = config;

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = start + visibleCount + overscan * 2;

  return { start, end };
}
