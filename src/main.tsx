import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { registerServiceWorker } from './hooks/usePWA';

registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
// #region agent log
fetch('http://127.0.0.1:7655/ingest/db9ddb40-9e0f-4951-8101-ecdd6dc75884', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '82d802' },
  body: JSON.stringify({
    sessionId: '82d802',
    hypothesisId: 'H3',
    location: 'main.tsx:bootstrap',
    message: 'react root rendered',
    data: { hasRoot: Boolean(document.getElementById('root')) },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion
