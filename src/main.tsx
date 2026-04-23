import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { registerServiceWorker } from './hooks/usePWA';
import { agentDebugLog } from '@/lib/agentDebugLog';
import { initServiceWorker } from './services/swRegistration';

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

initServiceWorker();

// #region agent log
agentDebugLog({
  hypothesisId: 'H3',
  location: 'main.tsx:bootstrap',
  message: 'react root rendered',
  data: { hasRoot: Boolean(document.getElementById('root')) },
});
// #endregion
