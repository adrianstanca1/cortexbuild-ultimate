import { useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/modules/Dashboard';
import { Projects } from './components/modules/Projects';
import { Invoicing } from './components/modules/Invoicing';
import { Accounting } from './components/modules/Accounting';
import { FinancialReports } from './components/modules/FinancialReports';
import { Procurement } from './components/modules/Procurement';
import { RAMS } from './components/modules/RAMS';
import { CIS } from './components/modules/CIS';
import { SiteOperations } from './components/modules/SiteOperations';
import { Teams } from './components/modules/Teams';
import { Tenders } from './components/modules/Tenders';
import { Analytics } from './components/modules/Analytics';
import { Safety } from './components/modules/Safety';
import { FieldView } from './components/modules/FieldView';
import { CRM } from './components/modules/CRM';
import { Documents } from './components/modules/Documents';
import { ThemeProvider } from './context/ThemeContext';
import { Timesheets } from './components/modules/Timesheets';
import { PlantEquipment } from './components/modules/PlantEquipment';
import { Subcontractors } from './components/modules/Subcontractors';
import { AIAssistant } from './components/modules/AIAssistant';
import { RFIs } from './components/modules/RFIs';
import { ChangeOrders } from './components/modules/ChangeOrders';
import { PunchList } from './components/modules/PunchList';
import { Inspections } from './components/modules/Inspections';
import { RiskRegister } from './components/modules/RiskRegister';
import { Drawings } from './components/modules/Drawings';
import { Meetings } from './components/modules/Meetings';
import { Materials } from './components/modules/Materials';
import { DailyReports } from './components/modules/DailyReports';
import { Marketplace } from './components/modules/Marketplace';
import { Settings } from './components/modules/Settings';
import { Insights } from './components/modules/Insights';
import { NotificationsPanel } from './components/layout/NotificationsPanel';
import { ExecutiveReports } from './components/modules/ExecutiveReports';
import { PredictiveAnalytics } from './components/modules/PredictiveAnalytics';
import { ShortcutsHelp } from './components/layout/ShortcutsHelp';
import { Calendar } from './components/modules/Calendar';
import { GlobalSearch } from './components/modules/GlobalSearch';
import { AuditLog } from './components/modules/AuditLog';
import { MobileNav } from './components/layout/MobileNav';
import LoginPage from './components/auth/LoginPage';
import { type Module } from './types';
import { useAuth, AuthProvider } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from './hooks/useKeyboardShortcuts';

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
      case 'dashboard':       return <Dashboard />;
      case 'projects':        return <Projects />;
      case 'invoicing':       return <Invoicing />;
      case 'accounting':      return <Accounting />;
      case 'financial-reports': return <FinancialReports />;
      case 'procurement':     return <Procurement />;
      case 'rams':            return <RAMS />;
      case 'cis':             return <CIS />;
      case 'site-ops':        return <SiteOperations />;
      case 'teams':           return <Teams />;
      case 'tenders':         return <Tenders />;
      case 'analytics':       return <Analytics />;
      case 'safety':          return <Safety />;
      case 'field-view':      return <FieldView />;
      case 'crm':             return <CRM />;
      case 'documents':       return <Documents />;
      case 'timesheets':      return <Timesheets />;
      case 'plant':           return <PlantEquipment />;
      case 'subcontractors':  return <Subcontractors />;
      case 'ai-assistant':    return <AIAssistant />;
      case 'rfis':            return <RFIs />;
      case 'change-orders':   return <ChangeOrders />;
      case 'punch-list':      return <PunchList />;
      case 'inspections':     return <Inspections />;
      case 'risk-register':   return <RiskRegister />;
      case 'drawings':        return <Drawings />;
      case 'meetings':        return <Meetings />;
      case 'materials':       return <Materials />;
      case 'daily-reports':   return <DailyReports />;
      case 'marketplace':     return <Marketplace />;
      case 'settings':        return <Settings />;
      case 'insights':        return <Insights />;
      case 'notifications':   return <NotificationsPanel authToken={null} onClose={() => {}} />;
      case 'executive-reports': return <ExecutiveReports />;
      case 'predictive-analytics': return <PredictiveAnalytics />;
      case 'calendar':          return <Calendar />;
      case 'search':            return <div className="card p-8 text-center text-gray-500">Use Ctrl+K to open Global Search</div>;
      case 'audit-log':         return <AuditLog />;
      default:                return <Dashboard />;
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
            {renderModule()}
          </div>
        </main>
        </div>
      </div>
      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <MobileNav activeModule={activeModule} setModule={setActiveModule} />
      {showGlobalSearch && <GlobalSearch onClose={() => setShowGlobalSearch(false)} />}
    </>
  );
}

function ThemedApp() {
  const { isAuthenticated, loading, user } = useAuth();
  const { resolvedTheme } = useTheme();
  console.log('[App] ThemedApp render:', { isAuthenticated, loading, hasUser: !!user, userName: user?.name });

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
