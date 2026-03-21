// Module: Procurement
import React, { useState } from 'react';
import { Plus, Truck, CheckCircle2 } from 'lucide-react';

export function Procurement() {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const purchaseOrders = [
    { number: 'PO-CW-0089', supplier: 'Tata Steel UK', description: 'UC 305×305×198 Steel Sections (28t)', value: 58800, project: 'Canary Wharf', status: 'delivered', orderDate: '2026-02-15', deliveryDate: '2026-03-12' },
    { number: 'PO-BB-0142', supplier: 'Hanson UK', description: 'Ready-Mix Concrete C40/50 (480m³)', value: 69600, project: 'Birmingham', status: 'on_site', orderDate: '2026-03-01', deliveryDate: '2026-03-18' },
    { number: 'PO-MC-0067', supplier: 'CEMEX UK', description: 'CFA Piling Concrete (180m³)', value: 24840, project: 'Manchester', status: 'pending_delivery', orderDate: '2026-02-20', deliveryDate: '2026-03-27' },
    { number: 'PO-MC-0068', supplier: 'Sika Ltd', description: 'Waterproof Membrane Type B (1200m²)', value: 33600, project: 'Manchester', status: 'pending_delivery', orderDate: '2026-02-25', deliveryDate: '2026-04-02' },
    { number: 'PO-CW-0090', supplier: 'Hilti UK', description: 'Fastening & Anchoring Systems', value: 15420, project: 'Canary Wharf', status: 'delivered', orderDate: '2026-03-01', deliveryDate: '2026-03-10' },
    { number: 'PO-LS-0051', supplier: 'Kingspan Group', description: 'Insulated Composite Cladding Panels', value: 87500, project: 'Leeds', status: 'ordered', orderDate: '2026-03-10', deliveryDate: '2026-05-01' },
    { number: 'PO-BB-0143', supplier: 'Lafarge Cement', description: 'Portland Cement 52.5N (50t)', value: 12750, project: 'Birmingham', status: 'delivered', orderDate: '2026-01-30', deliveryDate: '2026-02-28' },
    { number: 'PO-CW-0091', supplier: 'Bosch Professional', description: 'Power Tools & Equipment', value: 24890, project: 'Canary Wharf', status: 'pending_delivery', orderDate: '2026-03-08', deliveryDate: '2026-03-22' },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'on_site': return 'bg-green-500/20 text-green-400';
      case 'pending_delivery': return 'bg-orange-500/20 text-orange-400';
      case 'ordered': return 'bg-blue-500/20 text-blue-400';
      case 'pending_approval': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredPOs = filterStatus === 'all' ? purchaseOrders : purchaseOrders.filter(po => po.status === filterStatus);

  const stats = [
    { label: 'POs Raised', value: purchaseOrders.length },
    { label: 'Total Value', value: '£' + (purchaseOrders.reduce((sum, po) => sum + po.value, 0) / 1000).toFixed(0) + 'K' },
    { label: 'Pending Delivery', value: purchaseOrders.filter(po => po.status === 'pending_delivery').length },
    { label: 'Awaiting Approval', value: purchaseOrders.filter(po => po.status === 'pending_approval').length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Procurement</h1>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Raise PO
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="all">All</option>
          <option value="ordered">Ordered</option>
          <option value="pending_delivery">Pending Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="on_site">On Site</option>
        </select>
      </div>

      {/* POs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-400">
            <thead>
              <tr className="bg-gray-800/50 border-b border-gray-800">
                <th className="px-6 py-3 text-left font-semibold text-white">PO #</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Supplier</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Description</th>
                <th className="px-6 py-3 text-right font-semibold text-white">Value</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Project</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Order Date</th>
                <th className="px-6 py-3 text-left font-semibold text-white">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.map(po => (
                <tr key={po.number} className="border-b border-gray-800 hover:bg-gray-800/30">
                  <td className="px-6 py-4 font-mono text-white">{po.number}</td>
                  <td className="px-6 py-4 text-gray-300">{po.supplier}</td>
                  <td className="px-6 py-4 text-gray-300 text-xs max-w-xs">{po.description}</td>
                  <td className="px-6 py-4 text-right font-semibold text-white">£{po.value.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-300">{po.project.split(' ').slice(0, 2).join(' ')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(po.status)}`}>
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{new Date(po.orderDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-white">{new Date(po.deliveryDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
