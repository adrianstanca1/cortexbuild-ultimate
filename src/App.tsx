import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/modules/Dashboard';
import { Projects } from './components/modules/Projects';
import { Invoicing } from './components/modules/Invoicing';
import { Accounting } from './components/modules/Accounting';
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
import { type Module } from './types';

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':       return <Dashboard setModule={setActiveModule} />;
      case 'projects':        return <Projects />;
      case 'invoicing':       return <Invoicing />;
      case 'accounting':      return <Accounting />;
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
      default:                return <Dashboard setModule={setActiveModule} />;
    }
  };

  return (
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
  );
}
