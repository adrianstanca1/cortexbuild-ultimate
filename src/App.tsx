// CI/CD workflow test update - (re-re-attempt)      1|// CI/CD workflow test update - (re-attempt)      1|import { useState, lazy, Suspense, useEffect } from 'react';
     2|     2|import { Toaster } from 'sonner';
     3|     3|import { Sidebar } from './components/layout/Sidebar';
     4|     4|import { BlueprintBackground } from './components/layout/BlueprintBackground';
     5|     5|import { Header } from './components/layout/Header';
     6|     6|import { ThemeProvider } from './context/ThemeContext';
     7|     7|import { type Module } from './types';
     8|     8|import { useAuth, AuthProvider } from './context/AuthContext';
     9|     9|import { useTheme } from './context/ThemeContext';
    10|    10|import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from './hooks/useKeyboardShortcuts';
    11|    11|import LoginPage from './components/auth/LoginPage';
    12|    12|
    13|    13|// Layout components kept eager — always rendered
    14|    14|import { NotificationsPanel } from './components/layout/NotificationsPanel';
    15|    15|import { ShortcutsHelp } from './components/layout/ShortcutsHelp';
    16|    16|import { MobileNav } from './components/layout/MobileNav';
    17|    17|import { QuickActionsHUD } from './components/layout/QuickActionsHUD';
    18|    18|
    19|    19|// ── Named-export modules ────────────────────────────────────────────────────
    20|    20|const Dashboard           = lazy(() => import('./components/modules/Dashboard').then(m => ({ default: m.Dashboard })));
    21|    21|const Projects            = lazy(() => import('./components/modules/Projects').then(m => ({ default: m.Projects })));
    22|    22|const Invoicing           = lazy(() => import('./components/modules/Invoicing').then(m => ({ default: m.Invoicing })));
    23|    23|const Accounting          = lazy(() => import('./components/modules/Accounting').then(m => ({ default: m.Accounting })));
    24|    24|const FinancialReports    = lazy(() => import('./components/modules/FinancialReports').then(m => ({ default: m.FinancialReports })));
    25|    25|const Procurement         = lazy(() => import('./components/modules/Procurement').then(m => ({ default: m.Procurement })));
    26|    26|const RAMS                = lazy(() => import('./components/modules/RAMS').then(m => ({ default: m.RAMS })));
    27|    27|const CIS                 = lazy(() => import('./components/modules/CIS').then(m => ({ default: m.CIS })));
    28|    28|const SiteOperations      = lazy(() => import('./components/modules/SiteOperations').then(m => ({ default: m.SiteOperations })));
    29|    29|const Teams               = lazy(() => import('./components/modules/Teams').then(m => ({ default: m.Teams })));
    30|    30|const Tenders             = lazy(() => import('./components/modules/Tenders').then(m => ({ default: m.Tenders })));
    31|    31|const Analytics           = lazy(() => import('./components/modules/Analytics').then(m => ({ default: m.Analytics })));
    32|    32|const Safety              = lazy(() => import('./components/modules/Safety').then(m => ({ default: m.Safety })));
    33|    33|const FieldView           = lazy(() => import('./components/modules/FieldView').then(m => ({ default: m.FieldView })));
    34|    34|const CRM                 = lazy(() => import('./components/modules/CRM').then(m => ({ default: m.CRM })));
    35|    35|const Documents           = lazy(() => import('./components/modules/Documents').then(m => ({ default: m.Documents })));
    36|    36|const Timesheets          = lazy(() => import('./components/modules/Timesheets').then(m => ({ default: m.Timesheets })));
    37|    37|const PlantEquipment      = lazy(() => import('./components/modules/PlantEquipment').then(m => ({ default: m.PlantEquipment })));
    38|    38|const Subcontractors      = lazy(() => import('./components/modules/Subcontractors').then(m => ({ default: m.Subcontractors })));
    39|    39|const AIAssistant         = lazy(() => import('./components/modules/AIAssistant').then(m => ({ default: m.AIAssistant })));
    40|    40|const RFIs                = lazy(() => import('./components/modules/RFIs').then(m => ({ default: m.RFIs })));
    41|    41|const ChangeOrders        = lazy(() => import('./components/modules/ChangeOrders').then(m => ({ default: m.ChangeOrders })));
    42|    42|const PunchList           = lazy(() => import('./components/modules/PunchList').then(m => ({ default: m.PunchList })));
    43|    43|const Inspections         = lazy(() => import('./components/modules/Inspections').then(m => ({ default: m.Inspections })));
    44|    44|const RiskRegister        = lazy(() => import('./components/modules/RiskRegister').then(m => ({ default: m.RiskRegister })));
    45|    45|const Drawings            = lazy(() => import('./components/modules/Drawings').then(m => ({ default: m.Drawings })));
    46|    46|const Meetings            = lazy(() => import('./components/modules/Meetings').then(m => ({ default: m.Meetings })));
    47|    47|const Materials           = lazy(() => import('./components/modules/Materials').then(m => ({ default: m.Materials })));
    48|    48|const DailyReports        = lazy(() => import('./components/modules/DailyReports').then(m => ({ default: m.DailyReports })));
    49|    49|const Marketplace         = lazy(() => import('./components/modules/Marketplace').then(m => ({ default: m.Marketplace })));
    50|    50|const Settings            = lazy(() => import('./components/modules/Settings').then(m => ({ default: m.Settings })));
    51|    51|const Insights            = lazy(() => import('./components/modules/Insights').then(m => ({ default: m.Insights })));
    52|    52|const ExecutiveReports    = lazy(() => import('./components/modules/ExecutiveReports').then(m => ({ default: m.ExecutiveReports })));
    53|    53|const PredictiveAnalytics = lazy(() => import('./components/modules/PredictiveAnalytics').then(m => ({ default: m.PredictiveAnalytics })));
    54|    54|const Calendar            = lazy(() => import('./components/modules/Calendar').then(m => ({ default: m.Calendar })));
    55|    55|const GlobalSearch        = lazy(() => import('./components/modules/GlobalSearch').then(m => ({ default: m.GlobalSearch })));
    56|    56|const AuditLog            = lazy(() => import('./components/modules/AuditLog').then(m => ({ default: m.AuditLog })));
    57|    57|
    58|    58|// ── Default-export modules (new modules + Variations/Defects/Valuations/Specs) ─
    59|    59|const Variations          = lazy(() => import('./components/modules/Variations'));
    60|    60|const Defects             = lazy(() => import('./components/modules/Defects'));
    61|    61|const Valuations          = lazy(() => import('./components/modules/Valuations'));
    62|    62|const Specifications      = lazy(() => import('./components/modules/Specifications'));
    63|    63|const TempWorks           = lazy(() => import('./components/modules/TempWorks'));
    64|    64|const Signage             = lazy(() => import('./components/modules/Signage'));
    65|    65|const WasteManagement     = lazy(() => import('./components/modules/WasteManagement'));
    66|    66|const Sustainability      = lazy(() => import('./components/modules/Sustainability'));
    67|    67|const Training            = lazy(() => import('./components/modules/Training'));
    68|    68|const Certifications      = lazy(() => import('./components/modules/Certifications'));
    69|    69|const Prequalification    = lazy(() => import('./components/modules/Prequalification'));
    70|    70|const Lettings            = lazy(() => import('./components/modules/Lettings'));
    71|    71|const Measuring           = lazy(() => import('./components/modules/Measuring'));
    72|    72|const EmailHistory        = lazy(() => import('./components/modules/EmailHistory').then(m => ({ default: m.EmailHistory })));
    73|    73|const PermissionsManager  = lazy(() => import('./components/modules/PermissionsManager').then(m => ({ default: m.PermissionsManager })));
    74|    74|const ReportTemplates     = lazy(() => import('./components/modules/ReportTemplates').then(m => ({ default: m.ReportTemplates })));
    75|    75|
    76|    76|// ── New Construction Features ─
    77|    77|const BIMViewer           = lazy(() => import('./components/modules/BIMViewer'));
    78|    78|const CostManagement      = lazy(() => import('./components/modules/CostManagement'));
    79|    79|const SubmittalManagement = lazy(() => import('./components/modules/SubmittalManagement'));
    80|    80|
    81|    81|// ── AI & Desktop Features ─
    82|    82|const DevSandbox          = lazy(() => import('./components/modules/DevSandbox'));
    83|    83|const AIVision            = lazy(() => import('./components/modules/AIVision'));
    84|    84|const MyDesktop           = lazy(() => import('./components/modules/MyDesktop'));
    85|    85|
    86|    86|const ModuleLoader = () => (
    87|    87|  <div className="flex items-center justify-center h-64">
    88|    88|    <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    89|    89|  </div>
    90|    90|);
    91|    91|
    92|    92|function AppShell() {
    93|    93|  const [activeModule, setActiveModule] = useState<Module>('dashboard');
    94|    94|  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    95|    95|  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    96|    96|  const [showShortcuts, setShowShortcuts] = useState(false);
    97|    97|  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    98|    98|  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    99|    99|
   100|   100|  useEffect(() => {
   101|   101|    const handleOnline = () => setIsOnline(true);
   102|   102|    const handleOffline = () => setIsOnline(false);
   103|   103|    window.addEventListener('online', handleOnline);
   104|   104|    window.addEventListener('offline', handleOffline);
   105|   105|    return () => {
   106|   106|      window.removeEventListener('online', handleOnline);
   107|   107|      window.removeEventListener('offline', handleOffline);
   108|   108|    };
   109|   109|  }, []);
   110|   110|
   111|   111|  const toggleSearch = () => setShowGlobalSearch(p => !p);
   112|   112|
   113|   113|  useKeyboardShortcuts([
   114|   114|    { ...DEFAULT_SHORTCUTS.goToDashboard, handler: () => setActiveModule('dashboard') },
   115|   115|    { ...DEFAULT_SHORTCUTS.goToProjects, handler: () => setActiveModule('projects') },
   116|   116|    { ...DEFAULT_SHORTCUTS.goToInvoicing, handler: () => setActiveModule('invoicing') },
   117|   117|    { ...DEFAULT_SHORTCUTS.goToSafety, handler: () => setActiveModule('safety') },
   118|   118|    { ...DEFAULT_SHORTCUTS.goToSettings, handler: () => setActiveModule('settings') },
   119|   119|    { ...DEFAULT_SHORTCUTS.toggleSidebar, handler: () => setSidebarCollapsed(p => !p) },
   120|   120|    { ...DEFAULT_SHORTCUTS.showHelp, handler: () => setShowShortcuts(true) },
   121|   121|    { ...DEFAULT_SHORTCUTS.search, handler: toggleSearch },
   122|   122|  ]);
   123|   123|
   124|   124|  const renderModule = () => {
   125|   125|    switch (activeModule) {
   126|   126|      case 'dashboard':             return <Dashboard />;
   127|   127|      case 'projects':              return <Projects />;
   128|   128|      case 'invoicing':             return <Invoicing />;
   129|   129|      case 'accounting':            return <Accounting />;
   130|   130|      case 'financial-reports':     return <FinancialReports />;
   131|   131|      case 'procurement':           return <Procurement />;
   132|   132|      case 'rams':                  return <RAMS />;
   133|   133|      case 'cis':                   return <CIS />;
   134|   134|      case 'site-ops':              return <SiteOperations />;
   135|   135|      case 'teams':                 return <Teams />;
   136|   136|      case 'tenders':               return <Tenders />;
   137|   137|      case 'analytics':             return <Analytics />;
   138|   138|      case 'safety':                return <Safety />;
   139|   139|      case 'field-view':            return <FieldView />;
   140|   140|      case 'crm':                   return <CRM />;
   141|   141|      case 'documents':             return <Documents />;
   142|   142|      case 'timesheets':            return <Timesheets />;
   143|   143|      case 'plant':                 return <PlantEquipment />;
   144|   144|      case 'subcontractors':        return <Subcontractors />;
   145|   145|      case 'ai-assistant':          return <AIAssistant />;
   146|   146|      case 'rfis':                  return <RFIs />;
   147|   147|      case 'change-orders':         return <ChangeOrders />;
   148|   148|      case 'punch-list':            return <PunchList />;
   149|   149|      case 'inspections':           return <Inspections />;
   150|   150|      case 'risk-register':         return <RiskRegister />;
   151|   151|      case 'drawings':              return <Drawings />;
   152|   152|      case 'meetings':              return <Meetings />;
   153|   153|      case 'materials':             return <Materials />;
   154|   154|      case 'daily-reports':         return <DailyReports />;
   155|   155|      case 'marketplace':           return <Marketplace />;
   156|   156|      case 'settings':              return <Settings />;
   157|   157|      case 'insights':              return <Insights />;
   158|   158|      case 'notifications':         return <NotificationsPanel authToken=*** onClose={() => {}} />;
   159|   159|      case 'executive-reports':     return <ExecutiveReports />;
   160|   160|      case 'predictive-analytics':  return <PredictiveAnalytics />;
   161|   161|      case 'calendar':              return <Calendar />;
   162|   162|      case 'search':                return <div className="card p-8 text-center text-gray-500">Use Ctrl+K to open Global Search</div>;
   163|   163|      case 'audit-log':             return <AuditLog />;
   164|   164|      case 'variations':            return <Variations />;
   165|   165|      case 'defects':               return <Defects />;
   166|   166|      case 'valuations':            return <Valuations />;
   167|   167|      case 'specifications':        return <Specifications />;
   168|   168|      case 'temp-works':            return <TempWorks />;
   169|   169|      case 'signage':               return <Signage />;
   170|   170|      case 'waste-management':      return <WasteManagement />;
   171|   171|      case 'sustainability':        return <Sustainability />;
   172|   172|      case 'training':              return <Training />;
   173|   173|      case 'certifications':        return <Certifications />;
   174|   174|      case 'prequalification':      return <Prequalification />;
   175|   175|      case 'lettings':              return <Lettings />;
   176|   176|      case 'measuring':             return <Measuring />;
   177|   177|      case 'email-history':         return <EmailHistory />;
   178|   178|      case 'permissions':           return <PermissionsManager />;
   179|   179|      case 'report-templates':      return <ReportTemplates />;
   180|   180|      case 'bim-viewer':            return <BIMViewer />;
   181|   181|      case 'cost-management':       return <CostManagement />;
   182|   182|      case 'submittal-management':  return <SubmittalManagement />;
   183|   183|      case 'dev-sandbox':           return <DevSandbox />;
   184|   184|      case 'ai-vision':             return <AIVision />;
   185|   185|      case 'my-desktop':            return <MyDesktop />;
   186|   186|      default:                      return <Dashboard />;
   187|   187|    }
   188|   188|  };
   189|   189|
   190|   190|  return (
   191|   191|    <>
   192|   192|      <div className="flex h-screen overflow-hidden" style={{ position:'relative' }}>
   193|   193|        <BlueprintBackground />
   194|   194|        {/* Sidebar: hidden on mobile, shown on md+ */}
   195|   195|        <div className="hidden md:block flex-shrink-0" style={{ position: 'relative', zIndex: 1 }}>
   196|   196|          <Sidebar
   197|   197|            activeModule={activeModule}
   198|   198|            setModule={setActiveModule}
   199|   199|            collapsed={sidebarCollapsed}
   200|   200|            setCollapsed={setSidebarCollapsed}
   201|   201|          />
   202|   202|        </div>
   203|   203|        <div className="flex flex-col flex-1 overflow-hidden min-w-0" style={{ position: 'relative', zIndex: 1 }}>
   204|   204|          {!isOnline && (
   205|   205|            <div className="bg-yellow-500 text-black px-4 py-1.5 text-sm text-center font-medium">
   206|   206|              You're offline. Some features may not work.
   207|   207|            </div>
   208|   208|          )}
   209|   209|          <Header
   210|   210|            activeModule={activeModule}
   211|   211|            onMenuToggle={() => {
   212|   212|              if (window.innerWidth < 768) {
   213|   213|                setMobileMenuOpen(p => !p);
   214|   214|              } else {
   215|   215|                setSidebarCollapsed(p => !p);
   216|   216|              }
   217|   217|            }}
   218|   218|          />
   219|   219|          <main className="flex-1 overflow-auto pb-20 md:pb-6" style={{ backgroundAttachment: 'fixed' }}>
   220|   220|            <div className="p-4 md:p-6">
   221|   221|              <Suspense fallback={<ModuleLoader />}>
   222|   222|                {renderModule()}
   223|   223|              </Suspense>
   224|   224|            </div>
   225|   225|          </main>
   226|   226|        </div>
   227|   227|      </div>
   228|   228|      {/* Mobile sidebar drawer */}
   229|   229|      {mobileMenuOpen && (
   230|   230|        <>
   231|   231|          {/* Backdrop */}
   232|   232|          <div
   233|   233|            className="mobile-nav-overlay md:hidden"
   234|   234|            onClick={() => setMobileMenuOpen(false)}
   235|   235|          />
   236|   236|          {/* Drawer */}
   237|   237|          <div
   238|   238|            className="md:hidden"
   239|   239|            style={{
   240|   240|              position: 'fixed',
   241|   241|              top: 0,
   242|   242|              left: 0,
   243|   243|              bottom: 0,
   244|   244|              zIndex: 60,
   245|   245|              width: '280px',
   246|   246|              overflowY: 'auto',
   247|   247|              animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
   248|   248|            }}
   249|   249|          >
   250|   250|            <Sidebar
   251|   251|              activeModule={activeModule}
   252|   252|              setModule={(m) => { setActiveModule(m); setMobileMenuOpen(false); }}
   253|   253|              collapsed={false}
   254|   254|              setCollapsed={() => {}}
   255|   255|            />
   256|   256|          </div>
   257|   257|        </>
   258|   258|      )}
   259|   259|      <QuickActionsHUD currentModule={activeModule} onAction={(m) => setActiveModule(m as Module)} />
   260|   260|      <ShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
   261|   261|      <MobileNav activeModule={activeModule} setModule={setActiveModule} />
   262|   262|      {showGlobalSearch && (
   263|   263|        <Suspense fallback={null}>
   264|   264|          <GlobalSearch onClose={() => setShowGlobalSearch(false)} />
   265|   265|        </Suspense>
   266|   266|      )}
   267|   267|    </>
   268|   268|  );
   269|   269|}
   270|   270|
   271|   271|function ThemedApp() {
   272|   272|  const { isAuthenticated, loading } = useAuth();
   273|   273|  const { resolvedTheme } = useTheme();
   274|   274|
   275|   275|  if (loading) {
   276|   276|    return (
   277|   277|      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
   278|   278|        <div className="flex flex-col items-center gap-4">
   279|   279|          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
   280|   280|          <p className="text-gray-400 text-sm">Loading CortexBuild...</p>
   281|   281|        </div>
   282|   282|      </div>
   283|   283|    );
   284|   284|  }
   285|   285|
   286|   286|  return (
   287|   287|    <>
   288|   288|      <Toaster
   289|   289|        theme={resolvedTheme}
   290|   290|        position="top-right"
   291|   291|        toastOptions={{
   292|   292|          style: { background: resolvedTheme === 'dark' ? '#1f2937' : '#ffffff', border: '1px solid #374151', color: resolvedTheme === 'dark' ? '#f9fafb' : '#1f2937' },
   293|   293|        }}
   294|   294|      />
   295|   295|      {isAuthenticated ? <AppShell /> : <LoginPage />}
   296|   296|    </>
   297|   297|  );
   298|   298|}
   299|   299|
   300|   300|export default function App() {
   301|   301|  return (
   302|   302|    <ThemeProvider>
   303|   303|      <AuthProvider>
   304|   304|        <ThemedApp />
   305|   305|      </AuthProvider>
   306|   306|    </ThemeProvider>
   307|   307|  );
   308|   308|}
   309|   309|