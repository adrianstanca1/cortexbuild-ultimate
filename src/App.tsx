import { useState, lazy, Suspense } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ThemeProvider } from './context/ThemeContext';
import { type Module } from './types';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from './hooks/useKeyboardShortcuts';
import LoginPage from './components/auth/LoginPage';

// Layout components kept eager — always rendered
import { NotificationsPanel } from './components/layout/NotificationsPanel';
import { ShortcutsHelp } from './components/layout/ShortcutsHelp';
import { MobileNav } from './components/layout/MobileNav';

// ── Named-export modules ────────────────────────────────────────────────────
const Dashboard           = lazy(() => import('./components/modules/Dashboard').then(m => ({ default: m.Dashboard })));
const Projects            = lazy(() => import('./components/modules/Projects').then(m => ({ default: m.Projects })));
const Invoicing           = lazy(() => import('./components/modules/Invoicing').then(m => ({ default: m.Invoicing })));
const Accounting          = lazy(() => import('./components/modules/Accounting').then(m => ({ default: m.Accounting })));
const FinancialReports    = lazy(() => import('./components/modules/FinancialReports').then(m => ({ default: m.FinancialReports })));
const Procurement         = lazy(() => import('./components/modules/Procurement').then(m => ({ default: m.Procurement })));
const RAMS                = lazy(() => import('./components/modules/RAMS').then(m => ({ default: m.RAMS })));
const CIS                 = lazy(() => import('./components/modules/CIS').then(m => ({ default: m.CIS })));
const SiteOperations      = lazy(() => import('./components/modules/SiteOperations').then(m => ({ default: m.SiteOperations })));
const Teams               = lazy(() => import('./components/modules/Teams').then(m => ({ default: m.Teams })));
const Tenders             = lazy(() => import('./components/modules/Tenders').then(m => ({ default: m.Tenders })));
const Analytics           = lazy(() => import('./components/modules/Analytics').then(m => ({ default: m.Analytics })));
const Safety              = lazy(() => import('./components/modules/Safety').then(m => ({ default: m.Safety })));
const FieldView           = lazy(() => import('./components/modules/FieldView').then(m => ({ default: m.FieldView })));
const CRM                 = lazy(() => import('./components/modules/CRM').then(m => ({ default: m.CRM })));
const Documents           = lazy(() => import('./components/modules/Documents').then(m => ({ default: m.Documents })));
const Timesheets          = lazy(() => import('./components/modules/Timesheets').then(m => ({ default: m.Timesheets })));
const PlantEquipment      = lazy(() => import('./components/modules/PlantEquipment').then(m => ({ default: m.PlantEquipment })));
const Subcontractors      = lazy(() => import('./components/modules/Subcontractors').then(m => ({ default: m.Subcontractors })));
const AIAssistant         = lazy(() => import('./components/modules/AIAssistant').then(m => ({ default: m.AIAssistant })));
const RFIs                = lazy(() => import('./components/modules/RFIs').then(m => ({ default: m.RFIs })));
const ChangeOrders        = lazy(() => import('./components/modules/ChangeOrders').then(m => ({ default: m.ChangeOrders })));
const PunchList           = lazy(() => import('./components/modules/PunchList').then(m => ({ default: m.PunchList })));
const Inspections         = lazy(() => import('./components/modules/Inspections').then(m => ({ default: m.Inspections })));
const RiskRegister        = lazy(() => import('./components/modules/RiskRegister').then(m => ({ default: m.RiskRegister })));
const Drawings            = lazy(() => import('./components/modules/Drawings').then(m => ({ default: m.Drawings })));
const Meetings            = lazy(() => import('./components/modules/Meetings').then(m => ({ default: m.Meetings })));
const Materials           = lazy(() => import('./components/modules/Materials').then(m => ({ default: m.Materials })));
const DailyReports        = lazy(() => import('./components/modules/DailyReports').then(m => ({ default: m.DailyReports })));
const Marketplace         = lazy(() => import('./components/modules/Marketplace').then(m => ({ default: m.Marketplace })));
const Settings            = lazy(() => import('./components/modules/Settings').then(m => ({ default: m.Settings })));
const Insights            = lazy(() => import('./components/modules/Insights').then(m => ({ default: m.Insights })));
const ExecutiveReports    = lazy(() => import('./components/modules/ExecutiveReports').then(m => ({ default: m.ExecutiveReports })));
const PredictiveAnalytics = lazy(() => import('./components/modules/PredictiveAnalytics').then(m => ({ default: m.PredictiveAnalytics })));
const Calendar            = lazy(() => import('./components/modules/Calendar').then(m => ({ default: m.Calendar })));
const GlobalSearch        = lazy(() => import('./components/modules/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
const AuditLog            = lazy(() => import('./components/modules/AuditLog').then(m => ({ default: m.AuditLog })));

// ── Default-export modules (new modules + Variations/Defects/Valuations/Specs) ─
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
const Prequalification    = lazy(() => import('./components/modules/Prequalification'));
const Lettings            = lazy(() => import('./components/modules/Lettings'));
const Measuring           = lazy(() => import('./components/modules/Measuring'));

const ModuleLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
  </div>
);

function AppShell() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const toggleSearch = () => setShowGlobalSearch(p => !p);

  useKeyboardShortcuts([
    { ...DEFAULT_SHORTCUTS.goToDashboard, handler: () => setActiveModule('dashboard') },
    { ...DEFAULT_SHORTCUTS.goToProjects, handler: () => setActiveModule('projects') },
    { ...DEFAULT_SHORTCUTS.goToInvoicing, handler: () => setActiveModule('invoicing') },
    { ...DEFAULT_SHORTCUTS.goToSafety, handler: () => setActiveModule('safety') },
    { ...DEFAULT_SHORTCUTS.goToSettings, handler: () => setActiveModule('settings') },
    { ...DEFAULT_SHORTCUTS.toggleSidebar, handler: () => setSidebarCollapsed(p => !p) },
    { ...DEFAULT_SHORTCUTS.showHelp, handler: () => setShowShortcuts(true) },
    { ...DEFAULT_SHORTCUTS.search, handler: toggleSearch },
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
      case 'notifications':         return <NotificationsPanel authToken={null} onClose={() => {}} />;
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
      default:                      return <Dashboard />;
    }
  };

  return (
    <>
      <div className="flex h-screen bg-gray-950 overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          setModule={setActiveModule}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Header
            activeModule={activeModule}
            onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="flex-1 overflow-auto bg-gray-950">
            <div className="p-6">
              <Suspense fallback={<ModuleLoader />}>
                {renderModule()}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <MobileNav activeModule={activeModule} setModule={setActiveModule} />
      {showGlobalSearch && (
        <Suspense fallback={null}>
          <GlobalSearch onClose={() => setShowGlobalSearch(false)} />
        </Suspense>
      )}
    </>
  );
}

function ThemedApp() {
  const { isAuthenticated, loading, user } = useAuth();
  const { resolvedTheme } = useTheme();

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
    <>
      <Toaster
        theme={resolvedTheme}
        position="top-right"
        toastOptions={{
          style: { background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', border: '1px solid #374151', color: resolvedTheme === 'dark' ? '#f9fafb' : '#1f2937' },
        }}
      />
      {isAuthenticated ? <AppShell /> : <LoginPage />}
    </>
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
