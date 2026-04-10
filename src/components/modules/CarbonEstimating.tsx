/**
 * CarbonEstimating — UK Net Zero carbon footprint estimator for construction projects.
 * Uses carbonApi from services/api.ts.
 */
import { useState } from 'react';
import {
  Leaf, Calculator, Info, Factory, Truck,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { carbonApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { toast } from 'sonner';

type CarbonEstimate = {
  summary: {
    embodied_kgCO2e: number;
    operational_annual_kgCO2e: number;
    operational_60yr_kgCO2e: number;
    total_lifetime_kgCO2e: number;
    embodied_pct: number;
    operational_pct: number;
    kgCO2e_per_m2: number;
    rating: string;
  };
  material_breakdown: Array<{
    category: string; quantity: number; unit: string;
    factor: number; kgCO2e: number; desc: string;
  }>;
  transport_breakdown: Array<{
    transport_mode: string; distance_km: number;
    weight_tonnes: number; factor: number; kgCO2e: number;
  }>;
};

const PROJECT_TYPES = ['Office', 'Residential', 'Retail', 'Industrial', 'Education', 'Healthcare', 'Mixed Use'];
const CONSTRUCTION_TYPES = ['RC Frame', 'Steel Frame', 'Timber Frame', 'Masonry', 'Hybrid'];
const EPC_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const RATING_LABELS: Record<string, { label: string; colour: string; bg: string }> = {
  'A': { label: 'Excellent', colour: 'text-green-400', bg: 'bg-green-500/20' },
  'B': { label: 'Very Good', colour: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  'C': { label: 'Good', colour: 'text-lime-400', bg: 'bg-lime-500/20' },
  'D': { label: 'Average', colour: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  'E': { label: 'Below Average', colour: 'text-amber-400', bg: 'bg-amber-500/20' },
  'F': { label: 'Poor', colour: 'text-orange-400', bg: 'bg-orange-500/20' },
  'G': { label: 'Very Poor', colour: 'text-red-400', bg: 'bg-red-500/20' },
};

export function CarbonEstimating() {
  const [projectType, setProjectType] = useState('Residential');
  const [constructionType, setConstructionType] = useState('RC Frame');
  const [floorArea, setFloorArea] = useState('');
  const [programmeMonths, setProgrammeMonths] = useState('');
  const [epcRating, setEpcRating] = useState('B');
  const [occupancyHours, setOccupancyHours] = useState('12');
  const [result, setResult] = useState<CarbonEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [breakdownExpanded, setBreakdownExpanded] = useState(false);
  const [transportExpanded, setTransportExpanded] = useState(false);

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!floorArea) {
      toast.error('Floor area is required');
      return;
    }
    setLoading(true);
    try {
      const res = await carbonApi.estimate({
        area_m2: parseFloat(floorArea),
        programme_months: programmeMonths !== null && programmeMonths !== undefined ? parseInt(programmeMonths) : 12,
        epc_rating: epcRating,
        occupancy_hours: occupancyHours !== null && occupancyHours !== undefined ? parseInt(occupancyHours) : 12,
      });
      setResult(res);
      toast.success('Carbon estimate generated');
    } catch {
      toast.error('Failed to generate carbon estimate');
    } finally {
      setLoading(false);
    }
  }

  function fmtKg(n: number) {
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(2)} tCO2e`;
    return `${n.toFixed(2)} kgCO2e`;
  }

  function fmtPerM2(n: number) {
    return `${(n).toFixed(1)} kgCO2e/m²`;
  }

  const r = result?.summary;

  return (
    <>
      <ModuleBreadcrumbs currentModule="carbon-estimating" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Leaf size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Carbon Estimating</h1>
            <p className="text-sm text-gray-400">UK Net Zero carbon footprint for construction projects (RICS TM65)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={18} className="text-green-400" />
              <h2 className="text-lg font-semibold text-white">Project Parameters</h2>
            </div>
            <form onSubmit={handleEstimate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={e => setProjectType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Construction Type</label>
                  <select
                    value={constructionType}
                    onChange={e => setConstructionType(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {CONSTRUCTION_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Gross Internal Floor Area (m²) *</label>
                <input
                  type="number"
                  value={floorArea}
                  onChange={e => setFloorArea(e.target.value)}
                  placeholder="e.g. 2500"
                  min="10"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Programme (months)</label>
                  <input
                    type="number"
                    value={programmeMonths}
                    onChange={e => setProgrammeMonths(e.target.value)}
                    placeholder="e.g. 18"
                    min="1"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Occupancy Hours/day</label>
                  <input
                    type="number"
                    value={occupancyHours}
                    onChange={e => setOccupancyHours(e.target.value)}
                    placeholder="e.g. 12"
                    min="1" max="24"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Target EPC Rating</label>
                <select
                  value={epcRating}
                  onChange={e => setEpcRating(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {EPC_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300">
                  Estimates based on RICS TM65 methodology. Embodied carbon calculated from IStructE
                  Embodied Carbon Database factors. Operational carbon from SAP/CalculatedSAP methodology.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />}
                {loading ? 'Calculating...' : 'Generate Carbon Estimate'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {!result ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 flex flex-col items-center justify-center text-center">
                <Leaf size={48} className="text-gray-700 mb-3" />
                <p className="text-gray-500">Enter project parameters and click Generate to see carbon estimate</p>
              </div>
            ) : (
              <>
                {/* Rating */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Carbon Rating</p>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold ${RATING_LABELS[r?.rating ?? 'D']?.colour}`}>
                          {r?.rating ?? '—'}
                        </span>
                        <span className="text-lg text-gray-400">{RATING_LABELS[r?.rating ?? 'D']?.label}</span>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${RATING_LABELS[r?.rating ?? 'D']?.bg} ${RATING_LABELS[r?.rating ?? 'D']?.colour}`}>
                      {r?.rating ?? '—'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Embodied Carbon</p>
                      <p className="text-lg font-bold text-orange-400">{fmtKg(r?.embodied_kgCO2e ?? 0)}</p>
                      <p className="text-xs text-gray-500">{r?.embodied_pct ?? 0}% of total</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Operational (60yr)</p>
                      <p className="text-lg font-bold text-blue-400">{fmtKg(r?.operational_60yr_kgCO2e ?? 0)}</p>
                      <p className="text-xs text-gray-500">{r?.operational_pct ?? 0}% of total</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Total Lifetime</p>
                      <p className="text-lg font-bold text-white">{fmtKg(r?.total_lifetime_kgCO2e ?? 0)}</p>
                      <p className="text-xs text-gray-500">Over 60 years</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Per m² Intensity</p>
                      <p className="text-lg font-bold text-green-400">{fmtPerM2(r?.kgCO2e_per_m2 ?? 0)}</p>
                      <p className="text-xs text-gray-500">RICS benchmark: 1000</p>
                    </div>
                  </div>

                  {/* RICS Breakdown Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Embodied {r?.embodied_pct ?? 0}%</span>
                      <span>Operational {r?.operational_pct ?? 0}%</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-gray-700">
                      <div
                        className="bg-orange-500 transition-all"
                        style={{ width: `${r?.embodied_pct ?? 50}%` }}
                      />
                      <div
                        className="bg-blue-500 transition-all"
                        style={{ width: `${r?.operational_pct ?? 50}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-orange-400">Embodied</span>
                      <span className="text-blue-400">Operational</span>
                    </div>
                  </div>
                </div>

                {/* Embodied Carbon Breakdown */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setBreakdownExpanded(p => !p)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Factory size={16} className="text-orange-400" />
                      <span className="text-sm font-medium text-white">Embodied Carbon Breakdown</span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                        {result.material_breakdown?.length ?? 0} materials
                      </span>
                    </div>
                    {breakdownExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>
                  {breakdownExpanded && (
                    <div className="border-t border-gray-800">
                      {(!result.material_breakdown || result.material_breakdown.length === 0) ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No material breakdown available.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-800/50 border-b border-gray-800">
                            <tr>
                              {['Material', 'Quantity', 'Unit', 'Factor', 'kgCO2e'].map(h => (
                                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {result.material_breakdown.map((m, i) => (
                              <tr key={i} className="hover:bg-gray-800/30">
                                <td className="px-4 py-2.5 text-gray-300">{m.category}</td>
                                <td className="px-4 py-2.5 text-white">{m.quantity.toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-gray-400 text-xs">{m.unit}</td>
                                <td className="px-4 py-2.5 text-gray-400">{m.factor}</td>
                                <td className="px-4 py-2.5 text-orange-400 font-medium">{fmtKg(m.kgCO2e)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>

                {/* Transport Breakdown */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <button
                    onClick={() => setTransportExpanded(p => !p)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Truck size={16} className="text-blue-400" />
                      <span className="text-sm font-medium text-white">Transport Carbon</span>
                      <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                        {result.transport_breakdown?.length ?? 0} modes
                      </span>
                    </div>
                    {transportExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </button>
                  {transportExpanded && (
                    <div className="border-t border-gray-800">
                      {(!result.transport_breakdown || result.transport_breakdown.length === 0) ? (
                        <p className="p-4 text-sm text-gray-500 text-center">No transport data available.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-gray-800/50 border-b border-gray-800">
                            <tr>
                              {['Mode', 'Distance (km)', 'Weight (t)', 'Factor', 'kgCO2e'].map(h => (
                                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {result.transport_breakdown.map((t, i) => (
                              <tr key={i} className="hover:bg-gray-800/30">
                                <td className="px-4 py-2.5 text-gray-300">{t.transport_mode}</td>
                                <td className="px-4 py-2.5 text-white">{t.distance_km}</td>
                                <td className="px-4 py-2.5 text-gray-400">{t.weight_tonnes}t</td>
                                <td className="px-4 py-2.5 text-gray-400">{t.factor}</td>
                                <td className="px-4 py-2.5 text-blue-400 font-medium">{fmtKg(t.kgCO2e)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CarbonEstimating;
