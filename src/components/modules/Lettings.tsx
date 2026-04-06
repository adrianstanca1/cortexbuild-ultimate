 
import { useState, useMemo } from 'react';
import { Plus, FileText, Clock, CheckCircle, Trash2, X, Pencil, CheckSquare, Square, TrendingUp, Award } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { BulkActionsBar, useBulkSelection } from '../ui/BulkActions';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { useLettings } from '../../hooks/useData';

const STATUSES = ['Draft', 'Tendering', 'Under Review', 'Awarded', 'On Hold'];
const TRADES = [
  'Groundworks',
  'Steelwork',
  'Mechanical & Electrical',
  'Roofing',
  'Fit-Out',
  'Drainage',
  'Concrete',
  'Carpentry',
];

interface Package {
  id: string;
  package_no?: string | null;
  description?: string | null;
  trade?: string | null;
  budget?: number | null;
  status?: string | null;
  tender_date?: string | null;
  awarded_to?: string | null;
  contract_value?: number | null;
  tender_count?: number | null;
  notes?: string | null;
  created_at?: string | null;
}

interface Tender {
  contractor: string;
  price: number;
  notes: string;
  missing_items?: string[];
}

const mockPackages: Package[] = [
  {
    id: '1',
    package_no: 'PKG-001',
    description: 'Groundworks & Excavation',
    trade: 'Groundworks',
    budget: 250000,
    status: 'Awarded',
    tender_date: '2026-02-15',
    awarded_to: 'BuildRight Contractors',
    contract_value: 240000,
    tender_count: 4,
    notes: 'Main contractor preferred',
    created_at: '2026-01-10',
  },
  {
    id: '2',
    package_no: 'PKG-002',
    description: 'Structural Steelwork',
    trade: 'Steelwork',
    budget: 450000,
    status: 'Under Review',
    tender_date: '2026-03-01',
    awarded_to: null,
    contract_value: 0,
    tender_count: 3,
    notes: 'Fast track required',
    created_at: '2026-01-20',
  },
  {
    id: '3',
    package_no: 'PKG-003',
    description: 'Mechanical & Electrical Installation',
    trade: 'Mechanical & Electrical',
    budget: 680000,
    status: 'Tendering',
    tender_date: '2026-03-15',
    awarded_to: null,
    contract_value: 0,
    tender_count: 5,
    notes: 'Complex M&E requirements',
    created_at: '2026-02-01',
  },
  {
    id: '4',
    package_no: 'PKG-004',
    description: 'Roofing & Weatherproofing',
    trade: 'Roofing',
    budget: 180000,
    status: 'Awarded',
    tender_date: '2026-02-28',
    awarded_to: 'Peak Roofing Ltd',
    contract_value: 175000,
    tender_count: 2,
    notes: 'Single pitched roof system',
    created_at: '2026-01-25',
  },
  {
    id: '5',
    package_no: 'PKG-005',
    description: 'Interior Fit-Out',
    trade: 'Fit-Out',
    budget: 320000,
    status: 'Draft',
    tender_date: '2026-04-15',
    awarded_to: null,
    contract_value: 0,
    tender_count: 0,
    notes: 'Pending design finalization',
    created_at: '2026-02-10',
  },
  {
    id: '6',
    package_no: 'PKG-006',
    description: 'Drainage & Utilities',
    trade: 'Drainage',
    budget: 95000,
    status: 'Awarded',
    tender_date: '2026-03-05',
    awarded_to: 'Aqua Services',
    contract_value: 92000,
    tender_count: 3,
    notes: 'Surface and foul water',
    created_at: '2026-01-30',
  },
  {
    id: '7',
    package_no: 'PKG-007',
    description: 'Concrete & Pavings',
    trade: 'Concrete',
    budget: 140000,
    status: 'Under Review',
    tender_date: '2026-03-10',
    awarded_to: null,
    contract_value: 0,
    tender_count: 4,
    notes: 'Including parking areas',
    created_at: '2026-02-05',
  },
  {
    id: '8',
    package_no: 'PKG-008',
    description: 'Timber & Carpentry',
    trade: 'Carpentry',
    budget: 85000,
    status: 'On Hold',
    tender_date: null,
    awarded_to: null,
    contract_value: 0,
    tender_count: 0,
    notes: 'Awaiting material availability',
    created_at: '2026-02-15',
  },
];

const mockTenders: Record<string, Tender[]> = {
  '2': [
    { contractor: 'Steel Fabricators Ltd', price: 445000, notes: 'Experienced team, fast delivery', missing_items: [] },
    { contractor: 'Premium Steel Works', price: 455000, notes: 'Quality focus', missing_items: ['Insurance cert'] },
    { contractor: 'Industrial Steel Co', price: 460000, notes: 'Competitive but longer lead time', missing_items: [] },
  ],
  '3': [
    { contractor: 'ElectroTech Solutions', price: 675000, notes: 'Full design & install', missing_items: [] },
    { contractor: 'PowerBuild Services', price: 695000, notes: 'BIM coordination included', missing_items: [] },
    { contractor: 'Modern M&E Ltd', price: 710000, notes: 'Premium service', missing_items: ['References'] },
    { contractor: 'Efficient Systems', price: 665000, notes: 'Value option', missing_items: ['Insurance cert', 'References'] },
    { contractor: 'Pro Electrical', price: 680000, notes: 'Established contractor', missing_items: [] },
  ],
};

export default function Lettings() {
  const [activeTab, setActiveTab] = useState<'packages' | 'analysis' | 'awards' | 'pipeline'>('packages');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPackageDetail, setShowPackageDetail] = useState<Package | null>(null);
  const [_uploading, setUploading] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Package | null>(null);
  const [selectedPackageForAnalysis, setSelectedPackageForAnalysis] = useState<string>('2');
  const [form, setForm] = useState({
    package_no: '',
    description: '',
    trade: '',
    budget: '',
    status: 'Draft',
    tender_date: '',
    notes: '',
  });

  const listResult = useLettings.useList();
  const lettings = listResult.data || [];
  const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const typedLettings = (USE_MOCK && lettings.length === 0 ? mockPackages : lettings) as Package[];
  const createMutation = useLettings.useCreate();
  const updateMutation = useLettings.useUpdate();
  const deleteMutation = useLettings.useDelete();

  const { selectedIds, toggle, clearSelection } = useBulkSelection();

  // Calculate KPIs from filtered data
  const filtered = useMemo(() =>
    typedLettings.filter(p =>
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.trade || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.package_no || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [typedLettings, searchTerm]
  );

  const kpis = useMemo(() => {
    const awarded = filtered.filter(p => p.status === 'Awarded');
    const totalCommitted = awarded.reduce((sum, p) => sum + (p.contract_value || 0), 0);
    const totalBudget = filtered.reduce((sum, p) => sum + (p.budget || 0), 0);
    const savings = totalBudget - totalCommitted;
    const packagesOutstanding = filtered.filter(p => p.status !== 'Awarded').length;

    return { totalCommitted, savings, packagesOutstanding, awardedCount: awarded.length, totalPackages: filtered.length };
  }, [filtered]);

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} package(s)?`)) return;
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id)));
      toast.success(`Deleted ${ids.length} item(s)`);
      clearSelection();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const handleCreate = async () => {
    if (!form.description) {
      toast.error('Description is required');
      return;
    }
    try {
      await createMutation.mutateAsync({
        data: {
          package_no: form.package_no || `PKG-${Date.now()}`,
          description: form.description,
          trade: form.trade || '',
          budget: parseFloat(form.budget) || 0,
          status: form.status,
          tender_date: form.tender_date || null,
          awarded_to: null,
          contract_value: 0,
          tender_count: 0,
          notes: form.notes || '',
        },
      });
      toast.success('Package created successfully');
      setShowCreateModal(false);
      setForm({
        package_no: '',
        description: '',
        trade: '',
        budget: '',
        status: 'Draft',
        tender_date: '',
        notes: '',
      });
    } catch (err) {
      toast.error(`Failed to create: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUpdate = async () => {
    if (!editItem || !editItem.description) {
      toast.error('Description is required');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          package_no: editItem.package_no,
          description: editItem.description,
          trade: editItem.trade,
          budget: editItem.budget,
          status: editItem.status,
          tender_date: editItem.tender_date,
          awarded_to: editItem.awarded_to,
          contract_value: editItem.contract_value,
          tender_count: editItem.tender_count,
          notes: editItem.notes,
        },
      });
      toast.success('Package updated successfully');
      setEditItem(null);
    } catch (err) {
      toast.error(`Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Package deleted successfully');
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  async function _handleUploadDoc(id: string, file: File) {
    setUploading(id);
    try {
      await uploadFile(file, 'REPORTS');
      toast.success(`Uploaded: ${file.name}`);
    } catch (err) {
      toast.error(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUploading(null);
    }
  }

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'Awarded':
        return 'bg-green-500/10 text-green-400';
      case 'Under Review':
      case 'Tendering':
        return 'bg-amber-500/10 text-amber-400';
      case 'On Hold':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const _getPipelineStage = (status?: string | null) => {
    switch (status) {
      case 'Draft':
        return 0;
      case 'Tendering':
        return 1;
      case 'Under Review':
        return 2;
      case 'Awarded':
        return 3;
      default:
        return 4;
    }
  };

  const pipelineStages = ['Draft', 'Tendering', 'Under Review', 'Awarded', 'On Hold'];

  return (
    <>
      <ModuleBreadcrumbs currentModule="lettings" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Subcontract Lettings</h2>
            <p className="text-gray-400 text-sm mt-1">Manage contract packages, tenders and subcontractor awards</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            <Plus size={18} /> New Package
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total Packages</p>
                <p className="text-2xl font-bold text-white">{kpis.totalPackages}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Award className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Awarded</p>
                <p className="text-2xl font-bold text-green-400">{kpis.awardedCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Outstanding</p>
                <p className="text-2xl font-bold text-amber-400">{kpis.packagesOutstanding}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Potential Savings</p>
                <p className="text-2xl font-bold text-emerald-400">£{(kpis.savings / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card border-b border-gray-700">
          <div className="flex gap-0">
            {[
              { id: 'packages' as const, label: 'Packages', icon: FileText },
              { id: 'analysis' as const, label: 'Tender Analysis', icon: TrendingUp },
              { id: 'awards' as const, label: 'Awards', icon: CheckCircle },
              { id: 'pipeline' as const, label: 'Pipeline', icon: Clock },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-400'
                    : 'border-gray-700 text-gray-400 hover:text-gray-300'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PACKAGES TAB */}
        {activeTab === 'packages' && (
          <div className="space-y-4">
            <div className="card p-4">
              <input
                type="text"
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 input input-bordered text-white mb-4"
              />

              {filtered.length === 0 ? (
                <EmptyState title="No packages found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">
                          <button
                            onClick={() => {
                              if (selectedIds.size === filtered.length) clearSelection();
                              else filtered.forEach(p => toggle(String(p.id)));
                            }}
                          >
                            {selectedIds.size === filtered.length && filtered.length > 0 ? (
                              <CheckSquare size={16} className="text-blue-400" />
                            ) : (
                              <Square size={16} className="text-gray-500" />
                            )}
                          </button>
                        </th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Package</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Trade</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Budget</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Tenders</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p: Package) => {
                        const isSelected = selectedIds.has(String(p.id));
                        return (
                          <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                            <td className="py-3 px-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggle(String(p.id));
                                }}
                              >
                                {isSelected ? (
                                  <CheckSquare size={16} className="text-blue-400" />
                                ) : (
                                  <Square size={16} className="text-gray-500" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-white font-medium cursor-pointer hover:text-orange-400" onClick={() => setShowPackageDetail(p)}>
                              {p.package_no}
                            </td>
                            <td className="py-3 px-4 text-gray-300">{p.description}</td>
                            <td className="py-3 px-4 text-gray-400">{p.trade}</td>
                            <td className="py-3 px-4 text-right text-white font-medium">£{(p.budget || 0).toLocaleString()}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(p.status)}`}>{p.status}</span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400">{p.tender_count || 0}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => setEditItem(p)} className="p-1 hover:bg-blue-900/30 rounded">
                                  <Pencil size={14} className="text-blue-400" />
                                </button>
                                <button onClick={() => handleDelete(String(p.id))} className="p-1 hover:bg-red-900/30 rounded">
                                  <Trash2 size={14} className="text-red-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <BulkActionsBar
              selectedIds={Array.from(selectedIds)}
              actions={[
                {
                  id: 'delete',
                  label: 'Delete Selected',
                  icon: Trash2,
                  variant: 'danger',
                  onClick: handleBulkDelete,
                  confirm: 'This action cannot be undone.',
                },
              ]}
              onClearSelection={clearSelection}
            />
          </div>
        )}

        {/* TENDER ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Select Package for Analysis</label>
                <select
                  value={selectedPackageForAnalysis}
                  onChange={(e) => setSelectedPackageForAnalysis(e.target.value)}
                  className="w-full px-4 py-2 input input-bordered text-white"
                >
                  {typedLettings.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.package_no} - {p.description}
                    </option>
                  ))}
                </select>
              </div>

              {mockTenders[selectedPackageForAnalysis] ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Contractor</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Notes</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Missing Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTenders[selectedPackageForAnalysis].map((tender, idx) => {
                          const lowestPrice = Math.min(...mockTenders[selectedPackageForAnalysis].map(t => t.price));
                          const isLowest = tender.price === lowestPrice;
                          return (
                            <tr
                              key={idx}
                              className={`border-b border-gray-700 hover:bg-gray-800/50 ${
                                isLowest ? 'bg-green-500/5' : ''
                              }`}
                            >
                              <td className="py-3 px-4 text-white font-medium">{tender.contractor}</td>
                              <td className={`py-3 px-4 text-right font-bold ${isLowest ? 'text-green-400' : 'text-white'}`}>
                                £{tender.price.toLocaleString()}
                                {isLowest && <span className="text-green-400 text-xs ml-2">(Lowest)</span>}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    tender.missing_items?.length ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400'
                                  }`}
                                >
                                  {tender.missing_items?.length ? 'Incomplete' : 'Complete'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-400 text-xs">{tender.notes}</td>
                              <td className="py-3 px-4 text-center">
                                {tender.missing_items && tender.missing_items.length > 0 ? (
                                  <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs font-medium">
                                    {tender.missing_items.length} item(s)
                                  </span>
                                ) : (
                                  <span className="text-green-400">✓</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <p className="text-gray-400 text-xs mb-1">Total Responses</p>
                      <p className="text-2xl font-bold text-white">{mockTenders[selectedPackageForAnalysis].length}</p>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded border border-blue-500/30">
                      <p className="text-blue-400 text-xs mb-1">Average Price</p>
                      <p className="text-2xl font-bold text-blue-400">
                        £{Math.round(mockTenders[selectedPackageForAnalysis].reduce((sum, t) => sum + t.price, 0) / mockTenders[selectedPackageForAnalysis].length).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded border border-green-500/30">
                      <p className="text-green-400 text-xs mb-1">Lowest Price</p>
                      <p className="text-2xl font-bold text-green-400">
                        £{Math.min(...mockTenders[selectedPackageForAnalysis].map(t => t.price)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">No tenders received for this package</div>
              )}
            </div>
          </div>
        )}

        {/* AWARDS TAB */}
        {activeTab === 'awards' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Award Summary</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-500/10 p-4 rounded border border-blue-500/30">
                  <p className="text-blue-400 text-sm mb-2">Total Committed</p>
                  <p className="text-3xl font-bold text-blue-400">£{(kpis.totalCommitted / 1000).toFixed(0)}k</p>
                </div>
                <div className="bg-emerald-500/10 p-4 rounded border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm mb-2">Projected Savings</p>
                  <p className="text-3xl font-bold text-emerald-400">£{(kpis.savings / 1000).toFixed(0)}k</p>
                </div>
                <div className="bg-amber-500/10 p-4 rounded border border-amber-500/30">
                  <p className="text-amber-400 text-sm mb-2">Packages Pending</p>
                  <p className="text-3xl font-bold text-amber-400">{kpis.packagesOutstanding}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-lg font-bold text-white mb-4">Awarded Subcontracts</h3>
              <div className="space-y-3">
                {typedLettings
                  .filter(p => p.status === 'Awarded')
                  .map(p => (
                    <div key={p.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-white font-bold">{p.package_no}</h4>
                          <p className="text-gray-400 text-sm">{p.description}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded text-sm font-medium">Awarded</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Contractor</p>
                          <p className="text-white font-medium">{p.awarded_to}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Contract Value</p>
                          <p className="text-white font-medium">£{(p.contract_value || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Retention %</p>
                          <p className="text-white font-medium">5%</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs mb-1">Payment Terms</p>
                          <p className="text-white font-medium">Net 30</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            {pipelineStages.map((stage, _idx) => {
              const packagesInStage = typedLettings.filter(p => p.status === stage);
              return (
                <div key={stage} className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-400 uppercase">
                    {stage} <span className="ml-2 text-gray-500">({packagesInStage.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {packagesInStage.length === 0 ? (
                      <div className="p-6 bg-gray-800/30 rounded border-2 border-dashed border-gray-700 text-center text-gray-400">
                        No packages
                      </div>
                    ) : (
                      packagesInStage.map(p => (
                        <div key={p.id} className={`p-4 rounded-lg border-l-4 bg-gray-800/50 border ${getStatusColor(p.status).split(' ')[0]}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-white font-bold">{p.package_no}</h4>
                              <p className="text-gray-400 text-sm">{p.description}</p>
                              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>Budget: £{(p.budget || 0).toLocaleString()}</span>
                                <span>Tenders: {p.tender_count || 0}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setEditItem(p)}
                              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm font-medium whitespace-nowrap"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PACKAGE DETAIL MODAL */}
      {showPackageDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
              <h3 className="text-xl font-bold text-white">{showPackageDetail.package_no}</h3>
              <button onClick={() => setShowPackageDetail(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Description</p>
                <p className="text-white font-medium">{showPackageDetail.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Trade</p>
                  <p className="text-white">{showPackageDetail.trade}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(showPackageDetail.status)}`}>
                    {showPackageDetail.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Budget</p>
                  <p className="text-white font-bold">£{(showPackageDetail.budget || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Tender Responses</p>
                  <p className="text-white">{showPackageDetail.tender_count}</p>
                </div>
              </div>
              {showPackageDetail.awarded_to && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Awarded To</p>
                    <p className="text-white font-medium">{showPackageDetail.awarded_to}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Contract Value</p>
                    <p className="text-green-400 font-bold">£{(showPackageDetail.contract_value || 0).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {showPackageDetail.notes && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                  <p className="text-gray-300 text-sm">{showPackageDetail.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-900">
              <button onClick={() => setShowPackageDetail(null)} className="px-4 py-2 text-gray-400 hover:text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {(showCreateModal || editItem) && !showPackageDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
              <h3 className="text-xl font-bold text-white">{editItem ? 'Edit Package' : 'New Package'}</h3>
              <button type="button" onClick={() => { setShowCreateModal(false); setEditItem(null); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="pkgNo" className="block text-gray-400 text-xs mb-1">
                  Package Number
                </label>
                <input
                  id="pkgNo"
                  type="text"
                  value={editItem ? editItem.package_no || '' : form.package_no}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, package_no: e.target.value });
                    } else {
                      setForm({ ...form, package_no: e.target.value });
                    }
                  }}
                  placeholder="e.g. PKG-001"
                  className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-gray-400 text-xs mb-1">
                  Description *
                </label>
                <input
                  id="description"
                  type="text"
                  value={editItem ? editItem.description || '' : form.description}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, description: e.target.value });
                    } else {
                      setForm({ ...form, description: e.target.value });
                    }
                  }}
                  placeholder="e.g. Groundworks & Excavation"
                  className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="trade" className="block text-gray-400 text-xs mb-1">
                  Trade
                </label>
                <select
                  id="trade"
                  value={editItem ? editItem.trade || '' : form.trade}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, trade: e.target.value });
                    } else {
                      setForm({ ...form, trade: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 input input-bordered text-white"
                >
                  <option value="">Select a trade...</option>
                  {TRADES.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-gray-400 text-xs mb-1">
                  Budget (£)
                </label>
                <input
                  id="budget"
                  type="number"
                  value={editItem ? editItem.budget || '' : form.budget}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, budget: parseFloat(e.target.value) || 0 });
                    } else {
                      setForm({ ...form, budget: e.target.value });
                    }
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-gray-400 text-xs mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={editItem ? editItem.status || 'Draft' : form.status}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, status: e.target.value });
                    } else {
                      setForm({ ...form, status: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 input input-bordered text-white"
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="tenderDate" className="block text-gray-400 text-xs mb-1">
                  Tender Date
                </label>
                <input
                  id="tenderDate"
                  type="date"
                  value={editItem ? editItem.tender_date || '' : form.tender_date}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, tender_date: e.target.value });
                    } else {
                      setForm({ ...form, tender_date: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 input input-bordered text-white"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-gray-400 text-xs mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={editItem ? editItem.notes || '' : form.notes}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, notes: e.target.value });
                    } else {
                      setForm({ ...form, notes: e.target.value });
                    }
                  }}
                  placeholder="Additional notes..."
                  className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500 resize-none h-16"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-900">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditItem(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={editItem ? handleUpdate : handleCreate}
                disabled={editItem ? updateMutation.isPending : createMutation.isPending}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold disabled:opacity-50"
              >
                {editItem ? (updateMutation.isPending ? 'Saving...' : 'Save') : createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
