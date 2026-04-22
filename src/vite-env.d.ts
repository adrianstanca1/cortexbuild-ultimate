/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK_DATA: string;
  /** Set `true` in `.env.local` to force agent debug POSTs on any host (e.g. tunnel URLs). */
  readonly VITE_AGENT_DEBUG?: string;
  /** Vitest injects this during `vitest run` / watch. */
  readonly VITEST?: string | boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-dom/client' {
  interface Root {
    render(children: import('react').ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment): Root;
}
