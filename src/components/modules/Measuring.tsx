/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { useState, useMemo } from 'react';
import { Plus, Ruler, BarChart3, FileText, Trash2, X, Upload, Pencil, Layers, TrendingUp } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { uploadFile } from '../../services/api';
import { toast } from 'sonner';
import { useMeasuring } from '../../hooks/useData';

interface Measurement {
  id: string;
  item_no?: string | null;
  description?: string | null;
  unit?: string | null;
  quantity?: number | null;
  rate?: number | null;
  section?: string | null;
  total?: number | null;
}

interface Section {
  name: string;
  items: Measurement[];
}

interface Valuation {
  period: string;
  amount_certified: number;
  cumulative_total: number;
  retention_deducted: number;
  net_payment: number;
}

const mockMeasurements: Measurement[] = [
  { id: '1', item_no: 'PREL-001', description: 'Site Management & Supervision', unit: 'sum', quantity: 1, rate: 45000, section: 'Preliminaries', total: 45000 },
  { id: '2', item_no: 'PREL-002', description: 'Site Insurances & Safety', unit: 'sum', quantity: 1, rate: 28000, section: 'Preliminaries', total: 28000 },
  { id: '3', item_no: 'PREL-003', description: 'Temporary Works & Fencing', unit: 'sum', quantity: 1, rate: 15000, section: 'Preliminaries', total: 15000 },
  { id: '4', item_no: 'SUBS-001', description: 'Excavation to Formation Level', unit: 'm³', quantity: 1250, rate: 28, section: 'Substructure', total: 35000 },
  { id: '5', item_no: 'SUBS-002', description: 'Concrete Foundations Grade C30', unit: 'm³', quantity: 450, rate: 185, section: 'Substructure', total: 83250 },
  { id: '6', item_no: 'SUBS-003', description: 'Reinforcement Steel', unit: 'tonne', quantity: 85, rate: 650, section: 'Substructure', total: 55250 },
  { id: '7', item_no: 'FRAME-001', description: 'Structural Steel Frame', unit: 'tonne', quantity: 450, rate: 1500, section: 'Frame', total: 675000 },
  { id: '8', item_no: 'FRAME-002', description: 'Composite Metal Decking', unit: 'm²', quantity: 8500, rate: 42, section: 'Frame', total: 357000 },
  { id: '9', item_no: 'ENV-001', description: 'External Brick & Block Walls', unit: 'm²', quantity: 3200, rate: 95, section: 'Envelope', total: 304000 },
  { id: '10', item_no: 'ENV-002', description: 'Curtain Walling System', unit: 'm²', quantity: 2100, rate: 320, section: 'Envelope', total: 672000 },
  { id: '11', item_no: 'ENV-003', description: 'Roof Covering & Waterproofing', unit: 'm²', quantity: 2800, rate: 85, section: 'Envelope', total: 238000 },
  { id: '12', item_no: 'ME-001', description: 'Heating System Installation', unit: 'sum', quantity: 1, rate: 125000, section: 'M&E', total: 125000 },
  { id: '13', item_no: 'ME-002', description: 'Electrical Installation & Distribution', unit: 'sum', quantity: 1, rate: 245000, section: 'M&E', total: 245000 },
  { id: '14', item_no: 'ME-003', description: 'Plumbing & Drainage Installation', unit: 'sum', quantity: 1, rate: 95000, section: 'M&E', total: 95000 },
  { id: '15', item_no: 'FIT-001', description: 'Internal Partitioning & Doors', unit: 'm²', quantity: 6500, rate: 125, section: 'Fit-Out', total: 812500 },
  { id: '16', item_no: 'FIT-002', description: 'Flooring & Skirting Boards', unit: 'm²', quantity: 8200, rate: 65, section: 'Fit-Out', total: 533000 },
  { id: '17', item_no: 'FIT-003', description: 'Decoration & Finishes', unit: 'm²', quantity: 8200, rate: 35, section: 'Fit-Out', total: 287000 },
];

const mockValuations: Valuation[] = [
  {
    period: 'Feb 2026',
    amount_certified: 250000,
    cumulative_total: 250000,
    retention_deducted: 12500,
    net_payment: 237500,
  },
  {
    period: 'Mar 2026',
    amount_certified: 580000,
    cumulative_total: 830000,
    retention_deducted: 41500,
    net_payment: 788500,
  },
  {
    period: 'Apr 2026 (to date)',
    amount_certified: 420000,
    cumulative_total: 1250000,
    retention_deducted: 62500,
    net_payment: 1187500,
  },
];

export default function Measuring() {
  const [activeTab, setActiveTab] = useState<'takeoff' | 'bq' | 'valuations' | 'reports'>('takeoff');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Measurement | null>(null);
  const [form, setForm] = useState({
    item_no: '',
    description: '',
    unit: 'm²',
    quantity: '',
    rate: '',
    section: 'Fit-Out',
  });

  const listResult = useMeasuring.useList() as any;
  const measurements = listResult.data || [];
  const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';
  const typedMeasurements = (USE_MOCK && measurements.length === 0 ? mockMeasurements : measurements) as Measurement[];
  const createMutation = useMeasuring.useCreate() as any;
  const updateMutation = useMeasuring.useUpdate() as any;
  const deleteMutation = useMeasuring.useDelete() as any;

  // Filter data
  const filtered = useMemo(() =>
    typedMeasurements.filter((m: Measurement) =>
      (m.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.item_no || '').toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [typedMeasurements, searchTerm]
  );

  // Organize by section from filtered data
  const sections: Section[] = useMemo(() => {
    const grouped: Record<string, Measurement[]> = {};
    filtered.forEach(m => {
      const section = m.section || 'Other';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push(m);
    });
    return Object.entries(grouped).map(([name, items]) => ({ name, items }));
  }, [filtered]);

  // Calculate totals from filtered data
  const totals = useMemo(() => {
    const grandTotal = filtered.reduce((sum, m) => sum + ((m.quantity || 0) * (m.rate || 0)), 0);
    const measuredItems = filtered.filter(m => m.quantity && m.quantity > 0).length;
    const measurementPercentage = filtered.length > 0 ? Math.round((measuredItems / filtered.length) * 100) : 0;
    const costPlanTotal = filtered.reduce((sum, m) => sum + (m.total || 0), 0);

    return { grandTotal, costPlanTotal, measuredItems, measurementPercentage, totalItems: filtered.length };
  }, [filtered]);

  const handleCreate = async () => {
    if (!form.description) {
      toast.error('Description is required');
      return;
    }
    try {
      const newMeasurement = {
        data: {
          item_no: form.item_no || `ITEM-${Date.now()}`,
          description: form.description,
          unit: form.unit,
          quantity: parseFloat(form.quantity) || 0,
          rate: parseFloat(form.rate) || 0,
          section: form.section,
          total: (parseFloat(form.quantity) || 0) * (parseFloat(form.rate) || 0),
        },
      };
      await createMutation.mutateAsync(newMeasurement);
      toast.success('Measurement created successfully');
      setShowCreateModal(false);
      setForm({ item_no: '', description: '', unit: 'm²', quantity: '', rate: '', section: 'Fit-Out' });
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
          item_no: editItem.item_no,
          description: editItem.description,
          unit: editItem.unit,
          quantity: editItem.quantity,
          rate: editItem.rate,
          section: editItem.section,
          total: (editItem.quantity || 0) * (editItem.rate || 0),
        },
      });
      toast.success('Measurement updated successfully');
      setEditItem(null);
    } catch (err) {
      toast.error(`Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this measurement?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Measurement deleted successfully');
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  async function handleUploadDoc(id: string, file: File) {
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

  const exportToCSV = () => {
    const headers = ['Item No', 'Description', 'Unit', 'Quantity', 'Rate (£)', 'Total (£)', 'Section'];
    const rows = typedMeasurements.map(m => [
      m.item_no || '',
      m.description || '',
      m.unit || '',
      m.quantity || '',
      m.rate || '',
      (m.quantity || 0) * (m.rate || 0),
      m.section || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell}"`).join(',')),
      '',
      ['GRAND TOTAL', '', '', '', '', totals.grandTotal.toFixed(2), ''].map(cell => `"${cell}"`).join(','),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <>
      <ModuleBreadcrumbs currentModule="measuring" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Measurement & Quantities</h2>
            <p className="text-gray-400 text-sm mt-1">Manage take-offs, bills of quantities and valuations</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Total Items</p>
                <p className="text-2xl font-bold text-white">{totals.totalItems}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="text-green-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Measurement %</p>
                <p className="text-2xl font-bold text-green-400">{totals.measurementPercentage}%</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Ruler className="text-orange-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">BQ Total (£)</p>
                <p className="text-2xl font-bold text-orange-400">£{(totals.costPlanTotal / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <BarChart3 className="text-purple-400" size={20} />
              </div>
              <div>
                <p className="text-gray-400 text-xs">Take-Off Total (£)</p>
                <p className="text-2xl font-bold text-purple-400">£{(totals.grandTotal / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card border-b border-gray-700">
          <div className="flex gap-0">
            {[
              { id: 'takeoff' as const, label: 'Take-Off', icon: Ruler },
              { id: 'bq' as const, label: 'Bill of Quantities', icon: Layers },
              { id: 'valuations' as const, label: 'Valuations', icon: TrendingUp },
              { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
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

        {/* TAKE-OFF TAB */}
        {activeTab === 'takeoff' && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Search measurements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 input input-bordered text-white"
                />
                <button
                  onClick={exportToCSV}
                  className="ml-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium text-sm flex items-center gap-2"
                >
                  Export CSV
                </button>
              </div>

              {filtered.length === 0 ? (
                <EmptyState title="No measurements found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Item No</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Unit</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Quantity</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Rate (£)</th>
                        <th className="text-right py-3 px-4 text-gray-400 font-medium">Total (£)</th>
                        <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m: Measurement) => (
                        <tr key={m.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-white font-medium">{m.item_no}</td>
                          <td className="py-3 px-4 text-gray-300">{m.description}</td>
                          <td className="py-3 px-4 text-center text-gray-400">{m.unit}</td>
                          <td className="py-3 px-4 text-right text-white font-medium">{(m.quantity || 0).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-white">{(m.rate || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-white font-bold">
                            £{((m.quantity || 0) * (m.rate || 0)).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => setEditItem(m)} className="p-1 hover:bg-blue-900/30 rounded">
                                <Pencil size={14} className="text-blue-400" />
                              </button>
                              <button onClick={() => handleDelete(String(m.id))} className="p-1 hover:bg-red-900/30 rounded">
                                <Trash2 size={14} className="text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-600 bg-gray-800/50 font-bold">
                        <td colSpan={5} className="py-3 px-4 text-right text-white">
                          TOTAL
                        </td>
                        <td className="py-3 px-4 text-right text-orange-400 text-lg">£{totals.grandTotal.toFixed(2)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BILL OF QUANTITIES TAB */}
        {activeTab === 'bq' && (
          <div className="space-y-4">
            {sections.map(section => {
              const sectionTotal = section.items.reduce((sum, m) => sum + (m.total || 0), 0);
              return (
                <div key={section.name} className="card p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{section.name}</h3>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Item No</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                          <th className="text-center py-3 px-4 text-gray-400 font-medium">Unit</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Quantity</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Rate (£)</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Total (£)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((m: Measurement) => (
                          <tr key={m.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                            <td className="py-3 px-4 text-gray-300 text-xs">{m.item_no}</td>
                            <td className="py-3 px-4 text-gray-300">{m.description}</td>
                            <td className="py-3 px-4 text-center text-gray-400">{m.unit}</td>
                            <td className="py-3 px-4 text-right text-white">{(m.quantity || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-gray-400">{(m.rate || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-white font-bold">
                              £{((m.quantity || 0) * (m.rate || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-600 bg-gray-800/30">
                          <td colSpan={5} className="py-3 px-4 text-right font-bold text-gray-300">
                            {section.name} Total:
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-amber-400">£{sectionTotal.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            <div className="card p-6 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30">
              <div className="text-right">
                <p className="text-gray-400 mb-2">Bill of Quantities Grand Total</p>
                <p className="text-4xl font-bold text-orange-400">£{totals.costPlanTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* VALUATIONS TAB */}
        {activeTab === 'valuations' && (
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-6">Monthly Valuations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Period</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Amount Certified (£)</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Cumulative (£)</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Retention 5% (£)</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Net Payment (£)</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockValuations.map((v, idx) => {
                      const percentageProgress = (v.cumulative_total / totals.costPlanTotal) * 100;
                      return (
                        <tr key={idx} className="border-b border-gray-700 hover:bg-gray-800/50">
                          <td className="py-3 px-4 font-medium text-white">{v.period}</td>
                          <td className="py-3 px-4 text-right text-white">£{v.amount_certified.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-bold text-blue-400">£{v.cumulative_total.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-orange-400">-£{v.retention_deducted.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-bold text-green-400">£{v.net_payment.toLocaleString()}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                                style={{ width: `${Math.min(percentageProgress, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{percentageProgress.toFixed(1)}%</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Running Total Progress */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-6">Valuation Progress</h3>
              <div className="space-y-4">
                {mockValuations.map((v, idx) => {
                  const percentageProgress = (v.cumulative_total / totals.costPlanTotal) * 100;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 font-medium">{v.period}</span>
                        <span className="text-white font-bold">£{v.cumulative_total.toLocaleString()} ({percentageProgress.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
                          style={{ width: `${Math.min(percentageProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-4 bg-blue-500/10 border border-blue-500/30">
                <p className="text-blue-400 text-sm font-medium mb-2">Total Items</p>
                <p className="text-3xl font-bold text-blue-400">{totals.totalItems}</p>
              </div>
              <div className="card p-4 bg-green-500/10 border border-green-500/30">
                <p className="text-green-400 text-sm font-medium mb-2">Measurement Progress</p>
                <p className="text-3xl font-bold text-green-400">{totals.measurementPercentage}%</p>
              </div>
              <div className="card p-4 bg-orange-500/10 border border-orange-500/30">
                <p className="text-orange-400 text-sm font-medium mb-2">Take-Off Total</p>
                <p className="text-2xl font-bold text-orange-400">£{(totals.grandTotal / 1000).toFixed(0)}k</p>
              </div>
              <div className="card p-4 bg-purple-500/10 border border-purple-500/30">
                <p className="text-purple-400 text-sm font-medium mb-2">Variance</p>
                <p className="text-2xl font-bold text-purple-400">
                  {totals.costPlanTotal !== totals.grandTotal
                    ? `£${Math.abs(totals.grandTotal - totals.costPlanTotal).toLocaleString()}`
                    : 'On Target'}
                </p>
              </div>
            </div>

            {/* Measurement by Section */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Measurement by Section</h3>
              <div className="space-y-4">
                {sections.map(section => {
                  const sectionTotal = section.items.reduce((sum, m) => sum + (m.total || 0), 0);
                  const percentage = (sectionTotal / totals.costPlanTotal) * 100;
                  return (
                    <div key={section.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 font-medium">{section.name}</span>
                        <span className="text-white font-bold">£{sectionTotal.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost Plan vs Take-Off Comparison */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-white mb-4">Cost Plan vs Take-Off Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Bill of Quantities Total</span>
                    <span className="text-white font-bold">£{totals.costPlanTotal.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Take-Off Total</span>
                    <span className="text-white font-bold">£{totals.grandTotal.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${totals.costPlanTotal > 0 ? (totals.grandTotal / totals.costPlanTotal) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                {totals.costPlanTotal !== totals.grandTotal && (
                  <div className={`p-3 rounded text-sm font-medium ${totals.grandTotal < totals.costPlanTotal ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {totals.grandTotal < totals.costPlanTotal ? '✓' : '⚠'} Variance: £
                    {Math.abs(totals.grandTotal - totals.costPlanTotal).toLocaleString()}{' '}
                    {totals.grandTotal < totals.costPlanTotal ? 'under budget' : 'over budget'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      {(showCreateModal || editItem) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-900">
              <h3 className="text-xl font-bold text-white">{editItem ? 'Edit Measurement' : 'Add Measurement Item'}</h3>
              <button type="button" onClick={() => { setShowCreateModal(false); setEditItem(null); }} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="itemNo" className="block text-gray-400 text-xs mb-1">
                  Item Number
                </label>
                <input
                  id="itemNo"
                  type="text"
                  value={editItem ? editItem.item_no || '' : form.item_no}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, item_no: e.target.value });
                    } else {
                      setForm({ ...form, item_no: e.target.value });
                    }
                  }}
                  placeholder="e.g. ITEM-001"
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
                  placeholder="Item description"
                  className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="unit" className="block text-gray-400 text-xs mb-1">
                    Unit
                  </label>
                  <select
                    id="unit"
                    value={editItem ? editItem.unit || 'm²' : form.unit}
                    onChange={(e) => {
                      if (editItem) {
                        setEditItem({ ...editItem, unit: e.target.value });
                      } else {
                        setForm({ ...form, unit: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 input input-bordered text-white"
                  >
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="m">m</option>
                    <option value="nr">nr</option>
                    <option value="tonne">tonne</option>
                    <option value="sum">sum</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="quantity" className="block text-gray-400 text-xs mb-1">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={editItem ? editItem.quantity || '' : form.quantity}
                    onChange={(e) => {
                      if (editItem) {
                        setEditItem({ ...editItem, quantity: parseFloat(e.target.value) || 0 });
                      } else {
                        setForm({ ...form, quantity: e.target.value });
                      }
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="rate" className="block text-gray-400 text-xs mb-1">
                    Rate (£)
                  </label>
                  <input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={editItem ? editItem.rate || '' : form.rate}
                    onChange={(e) => {
                      if (editItem) {
                        setEditItem({ ...editItem, rate: parseFloat(e.target.value) || 0 });
                      } else {
                        setForm({ ...form, rate: e.target.value });
                      }
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 input input-bordered text-white placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="section" className="block text-gray-400 text-xs mb-1">
                  Section
                </label>
                <select
                  id="section"
                  value={editItem ? editItem.section || 'Fit-Out' : form.section}
                  onChange={(e) => {
                    if (editItem) {
                      setEditItem({ ...editItem, section: e.target.value });
                    } else {
                      setForm({ ...form, section: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 input input-bordered text-white"
                >
                  <option value="Preliminaries">Preliminaries</option>
                  <option value="Substructure">Substructure</option>
                  <option value="Frame">Frame</option>
                  <option value="Envelope">Envelope</option>
                  <option value="M&E">M&E</option>
                  <option value="Fit-Out">Fit-Out</option>
                </select>
              </div>

              {(editItem || form.quantity) && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                  <p className="text-blue-400 text-sm font-medium">
                    Total: £
                    {(
                      (editItem
                        ? (editItem.quantity || 0) * (editItem.rate || 0)
                        : (parseFloat(form.quantity) || 0) * (parseFloat(form.rate) || 0))
                    ).toFixed(2)}
                  </p>
                </div>
              )}
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
                {editItem ? (updateMutation.isPending ? 'Saving...' : 'Save') : createMutation.isPending ? 'Creating...' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
