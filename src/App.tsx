import { useState, lazy, Suspense, useEffect } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/layout/Sidebar';
import { BlueprintBackground } from './components/layout/BlueprintBackground';
import { Header } from './components/layout/Header';
import { ThemeProvider } from './context/ThemeContext';
import { type Module } from './types';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from './hooks/useKeyboardShortcuts';
import LoginPage from './components/auth/LoginPage';
import { OAuthCallback } from './components/auth/OAuthCallback';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { CommandPalette } from './components/ui/CommandPalette';

// Layout components kept eager — always rendered
import { NotificationsPanel } from './components/layout/NotificationsPanel';
import { ShortcutsHelp } from './components/layout/ShortcutsHelp';
import { MobileNav } from './components/layout/MobileNav';
import { QuickActionsHUD } from './components/layout/QuickActionsHUD';

// ── All modules now have default exports ──────────────────────────────────
const Dashboard           = lazy(() => import('./components/modules/Dashboard'));
const Projects            = lazy(() => import('./components/modules/projects'));
const Invoicing           = lazy(() => import('./components/modules/Invoicing'));
const Accounting          = lazy(() => import('./components/modules/Accounting'));
const FinancialReports    = lazy(() => import('./components/modules/FinancialReports'));
const Procurement         = lazy(() => import('./components/modules/Procurement'));
const RAMS                = lazy(() => import('./components/modules/RAMS'));
const CIS                 = lazy(() => import('./components/modules/CIS'));
const SiteOperations      = lazy(() => import('./components/modules/SiteOperations'));
const Teams               = lazy(() => import('./components/modules/Teams'));
const Tenders             = lazy(() => import('./components/modules/Tenders'));
const Analytics           = lazy(() => import('./components/modules/Analytics'));
const Safety              = lazy(() => import('./components/modules/Safety'));
const FieldView           = lazy(() => import('./components/modules/FieldView'));
const CRM                 = lazy(() => import('./components/modules/CRM'));
const Documents           = lazy(() => import('./components/modules/Documents'));
const Timesheets          = lazy(() => import('./components/modules/Timesheets'));
const PlantEquipment      = lazy(() => import('./components/modules/PlantEquipment'));
const Subcontractors      = lazy(() => import('./components/modules/Subcontractors'));
const AIAssistant         = lazy(() => import('./components/modules/AIAssistant'));
const RFIs                = lazy(() => import('./components/modules/RFIs'));
const ChangeOrders        = lazy(() => import('./components/modules/ChangeOrders'));
const PunchList           = lazy(() => import('./components/modules/PunchList'));
const Inspections         = lazy(() => import('./components/modules/Inspections'));
const RiskRegister        = lazy(() => import('./components/modules/RiskRegister'));
const Drawings            = lazy(() => import('./components/modules/Drawings'));
const Meetings            = lazy(() => import('./components/modules/Meetings'));
const Materials           = lazy(() => import('./components/modules/Materials'));
const DailyReports        = lazy(() => import('./components/modules/DailyReports'));
const Marketplace         = lazy(() => import('./components/modules/Marketplace'));
const Settings            = lazy(() => import('./components/modules/Settings'));
const Insights            = lazy(() => import('./components/modules/Insights'));
const ExecutiveReports    = lazy(() => import('./components/modules/ExecutiveReports'));
const PredictiveAnalytics = lazy(() => import('./components/modules/PredictiveAnalytics'));
const Calendar            = lazy(() => import('./components/modules/Calendar'));
const GlobalSearch        = lazy(() => import('./components/modules/GlobalSearch'));
const AuditLog            = lazy(() => import('./components/modules/AuditLog'));
const Variations          = lazy(() => import('./components/modules/Variations'));
const Defects             = lazy(() => import('./components/modules/Defects'));
const Valuations          = lazy(() => import('./components/modules/Valuations'));
const Specifications      = lazy(() => import('./components/modules/Specifications'));
const TempWorks           = lazy(() => import('./components/modules/TempWorks'));
const Signage             = lazy(() => import('./components/modules/Signage'));
const WasteManagement     = lazy(() => import('./components/modules/WasteManagement'));
const Sustainability      = lazy(() => import('./components/modules/Sustainability'));
const Training            = lazy(() => import('./components/modules/Training'));
const Certifications      = lazy(() => import('./components/modules/Certifications'));
const Prequalification    = lazy(() => import('./components/modules/prequalification'));
const Lettings            = lazy(() => import('./components/modules/Lettings'));
const Measuring           = lazy(() => import('./components/modules/Measuring'));
const EmailHistory        = lazy(() => import('./components/modules/EmailHistory'));
const PermissionsManager  = lazy(() => import('./components/modules/PermissionsManager'));
const ReportTemplates     = lazy(() => import('./components/modules/ReportTemplates'));
const BIMViewer           = lazy(() => import('./components/modules/BIMViewer'));
const CostManagement      = lazy(() => import('./components/modules/CostManagement'));
const SubmittalManagement = lazy(() => import('./components/modules/SubmittalManagement'));
const DevSandbox          = lazy(() => import('./components/modules/DevSandbox'));
const AIVision            = lazy(() => import('./components/modules/AIVision'));
const ClientPortal        = lazy(() => import('./components/modules/ClientPortal'));
const Webhooks            = lazy(() => import('./components/modules/Webhooks'));
const CarbonEstimating   = lazy(() => import('./components/modules/CarbonEstimating'));
const MyDesktop           = lazy(() => import('./components/modules/MyDesktop'));
const AdvancedAnalytics   = lazy(() => import('./components/modules/AdvancedAnalytics'));
const ProjectCalendar     = lazy(() => import('./components/modules/ProjectCalendar'));
const AdminDashboard      = lazy(() => import('./components/modules/AdminDashboard'));
const TeamChat            = lazy(() => import('./components/modules/TeamChat'));
const ActivityFeed        = lazy(() => import('./components/modules/ActivityFeed'));
const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

function AppShell() {
  const { token } = useAuth();
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSearch = () => setShowGlobalSearch(p => !p);
  const toggleCommandPalette = () => setShowCommandPalette(p => !p);

  useKeyboardShortcuts([
    { ...DEFAULT_SHORTCUTS.goToDashboard, handler: () => setActiveModule('dashboard') },
    { ...DEFAULT_SHORTCUTS.goToProjects, handler: () => setActiveModule('projects') },
    { ...DEFAULT_SHORTCUTS.goToInvoicing, handler: () => setActiveModule('invoicing') },
    { ...DEFAULT_SHORTCUTS.goToSafety, handler: () => setActiveModule('safety') },
    { ...DEFAULT_SHORTCUTS.goToSettings, handler: () => setActiveModule('settings') },
    { ...DEFAULT_SHORTCUTS.goToAnalytics, handler: () => setActiveModule('analytics') },
    { ...DEFAULT_SHORTCUTS.goToCalendar, handler: () => setActiveModule('calendar') },
    { ...DEFAULT_SHORTCUTS.toggleSidebar, handler: () => setSidebarCollapsed(p => !p) },
    { ...DEFAULT_SHORTCUTS.showHelp, handler: () => setShowShortcuts(true) },
    { ...DEFAULT_SHORTCUTS.search, handler: toggleSearch },
    { ...DEFAULT_SHORTCUTS.openNotifications, handler: () => setShowGlobalSearch(true) },
    { key: 'k', ctrl: true, shift: false, handler: toggleCommandPalette, description: 'Open command palette' },
  ]);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':             return <Dashboard />;
      case 'projects':              return <Projects />;
      case 'invoicing':             return <Invoicing />;
      case 'accounting':            return <Accounting />;
      case 'financial-reports':     return <FinancialReports />;
      case 'procurement':           return <Procurement />;
      case 'rams':                  return <RAMS />;
      case 'cis':                   return <CIS />;
      case 'site-ops':              return <SiteOperations />;
      case 'teams':                 return <Teams />;
      case 'tenders':               return <Tenders />;
      case 'analytics':             return <Analytics />;
      case 'advanced-analytics':    return <AdvancedAnalytics />;
      case 'project-calendar':      return <ProjectCalendar />;
      case 'safety':                return <Safety />;
      case 'field-view':            return <FieldView />;
      case 'crm':                   return <CRM />;
      case 'documents':             return <Documents />;
      case 'timesheets':            return <Timesheets />;
      case 'plant':                 return <PlantEquipment />;
      case 'subcontractors':        return <Subcontractors />;
      case 'ai-assistant':          return <AIAssistant />;
      case 'rfis':                  return <RFIs />;
      case 'change-orders':         return <ChangeOrders />;
      case 'punch-list':            return <PunchList />;
      case 'inspections':           return <Inspections />;
      case 'risk-register':         return <RiskRegister />;
      case 'drawings':              return <Drawings />;
      case 'meetings':              return <Meetings />;
      case 'materials':             return <Materials />;
      case 'daily-reports':         return <DailyReports />;
      case 'marketplace':           return <Marketplace />;
      case 'settings':              return <Settings />;
      case 'insights':              return <Insights />;
      case 'notifications':         return <NotificationsPanel authToken={token} onClose={() => setActiveModule('dashboard')} />;
      case 'executive-reports':     return <ExecutiveReports />;
      case 'predictive-analytics':  return <PredictiveAnalytics />;
      case 'calendar':              return <Calendar />;
      case 'search':                return <div className="card p-8 text-center text-gray-500">Use Ctrl+K to open Global Search</div>;
      case 'audit-log':             return <AuditLog />;
      case 'variations':            return <Variations />;
      case 'defects':               return <Defects />;
      case 'valuations':            return <Valuations />;
      case 'specifications':        return <Specifications />;
      case 'temp-works':            return <TempWorks />;
      case 'signage':               return <Signage />;
      case 'waste-management':      return <WasteManagement />;
      case 'sustainability':        return <Sustainability />;
      case 'training':              return <Training />;
      case 'certifications':        return <Certifications />;
      case 'prequalification':      return <Prequalification />;
      case 'lettings':              return <Lettings />;
      case 'measuring':             return <Measuring />;
      case 'email-history':         return <EmailHistory />;
      case 'permissions':           return <PermissionsManager />;
      case 'report-templates':      return <ReportTemplates />;
      case 'bim-viewer':            return <BIMViewer />;
      case 'cost-management':       return <CostManagement />;
      case 'submittal-management':  return <SubmittalManagement />;
      case 'dev-sandbox':           return <DevSandbox />;
      case 'ai-vision':             return <AIVision />;
      case 'my-desktop':            return <MyDesktop />;
      case 'client-portal':         return <ClientPortal />;
      case 'webhooks':               return <Webhooks />;
      case 'carbon-estimating':    return <CarbonEstimating />;
      case 'admin-dashboard':       return <AdminDashboard />;
      case 'team-chat':             return <TeamChat />;
      case 'activity-feed':         return <ActivityFeed />;
      default:                      return <Dashboard />;
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden" style={{ position:'relative' }}>
        <BlueprintBackground />
        {/* Sidebar — always visible on desktop, mobile uses drawer */}
        <div className="flex flex-shrink-0" style={{ position: 'relative', zIndex: 1 }}>
          <Sidebar
            activeModule={activeModule}
            setModule={setActiveModule}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>
          {!isOnline && (
            <div className="bg-yellow-500 text-black px-4 py-1.5 text-sm text-center font-medium">
              You're offline. Some features may not work.
            </div>
          )}
          <Header
            activeModule={activeModule}
            onMenuToggle={() => {
              if (window.innerWidth < 768) {
                setMobileMenuOpen(p => !p);
              } else {
                setSidebarCollapsed(p => !p);
              }
            }}
          />
          <main className="flex-1 overflow-auto pb-20 md:pb-6" style={{ backgroundAttachment: 'fixed' }}>
            <div className="p-4 md:p-6">
              <Suspense fallback={<ModuleLoader />}>
                {renderModule()}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      {/* Mobile sidebar drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="mobile-nav-overlay md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div
            className="md:hidden"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 60,
              width: '280px',
              overflowY: 'auto',
              animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            <Sidebar
              activeModule={activeModule}
              setModule={(m) => { setActiveModule(m); setMobileMenuOpen(false); }}
              collapsed={false}
              setCollapsed={() => {}}
            />
          </div>
        </>
      )}
      <QuickActionsHUD currentModule={activeModule} onAction={(m) => setActiveModule(m as Module)} />
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <MobileNav activeModule={activeModule} setModule={setActiveModule} />
      {showGlobalSearch && (
        <Suspense fallback={null}>
          <GlobalSearch onClose={() => setShowGlobalSearch(false)} />
        </Suspense>
      )}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNavigate={(m) => { setActiveModule(m); setShowCommandPalette(false); }}
      />
    </>
  );
}

function ThemedApp() {
  const { isAuthenticated, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  
  // Check for OAuth callback route
  const isOAuthCallback = typeof window !== 'undefined' && 
    window.location.pathname === '/auth/callback';

  if (isOAuthCallback) {
    return <OAuthCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading CortexBuild...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster
        theme={resolvedTheme}
        position="top-right"
        toastOptions={{
          style: { background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', border: '1px solid #374151', color: resolvedTheme === 'dark' ? '#f9fafb' : '#1f2937' },
        }}
      />
      {isAuthenticated ? <AppShell /> : <LoginPage />}
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
