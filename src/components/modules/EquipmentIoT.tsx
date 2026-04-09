/**
 * EquipmentIoT — Live telematics dashboard for plant & equipment.
 * Uses iotApi from services/api.ts.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Cpu, Fuel, Clock, MapPin, AlertTriangle, CheckCircle,
  Activity, Thermometer, Gauge, Wrench, RefreshCw, ChevronRight
} from 'lucide-react';
import { iotApi } from '../../services/api';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';
import { EmptyState } from '../ui/EmptyState';
import { toast } from 'sonner';

type IoTDevice = {
  id: string;
  equipment_id: string;
  equipment_name?: string;
  equipment_type?: string;
  device_serial: string;
  device_type: string;
  status: string;
  project_id?: string;
  last_seen_at?: string;
};

type TelemetryPoint = {
  recorded_at: string;
  latitude?: number;
  longitude?: number;
  data: Record<string, unknown>;
  alert?: Record<string, unknown>;
};

export function EquipmentIoT() {
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>([]);
  const [telemLoading, setTelemLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchDevices = useCallback(async () => {
    try {
      const res = await iotApi.getDevices({ limit: 100 });
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  async function loadDeviceTelemetry(device: IoTDevice) {
    setSelectedDevice(device);
    setTelemLoading(true);
    try {
      const res = await iotApi.getDevice(device.id, 7);
      setTelemetry(Array.isArray(res.telemetry) ? res.telemetry : []);
    } catch {
      setTelemetry([]);
    } finally {
      setTelemLoading(false);
    }
  }

  const filtered = devices.filter(d => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchType = typeFilter === 'all' || d.equipment_type === typeFilter;
    return matchStatus && matchType;
  });

  const statusColour = (s: string) => {
    switch (s) {
      case 'online': return 'bg-green-500/20 text-green-400';
      case 'offline': return 'bg-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-700/30 text-gray-400';
    }
  };

  const getLatestTelemetry = (_device: IoTDevice) => {
    return telemetry[telemetry.length - 1] ?? null;
  };

  const latest = selectedDevice ? getLatestTelemetry(selectedDevice) : null;
  const fuelLevel = latest?.data?.fuel_level ? Number(latest.data.fuel_level) : null;
  const engineHours = latest?.data?.engine_hours ? Number(latest.data.engine_hours) : null;
  const alert = latest?.alert;

  const equipTypes = [...new Set(devices.map(d => d.equipment_type).filter(Boolean))];

  return (
    <>
      <ModuleBreadcrumbs currentModule="equipment-iot" onNavigate={() => {}} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Cpu size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Equipment IoT</h1>
              <p className="text-sm text-gray-400">Live telematics for plant & equipment</p>
            </div>
          </div>
          <button
            onClick={fetchDevices}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Devices', value: devices.length, icon: Cpu, colour: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Online', value: devices.filter(d => d.status === 'online').length, icon: CheckCircle, colour: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Offline', value: devices.filter(d => d.status === 'offline').length, icon: AlertTriangle, colour: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Alerts', value: devices.filter(d => d.status === 'warning').length, icon: Activity, colour: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg}`}><kpi.icon size={18} className={kpi.colour} /></div>
                <div><p className="text-xs text-gray-500">{kpi.label}</p><p className="text-xl font-bold text-white">{kpi.value}</p></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device List */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 space-y-3">
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Status</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="warning">Warning</option>
                </select>
              </div>
              {equipTypes.length > 1 && (
                <div>
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="w-full text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Types</option>
                    {equipTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No devices found</div>
            ) : (
              <div className="divide-y divide-gray-800 max-h-[60vh] overflow-y-auto">
                {filtered.map(d => (
                  <button
                    key={d.id}
                    onClick={() => loadDeviceTelemetry(d)}
                    className={`w-full text-left p-4 hover:bg-gray-800/50 transition-colors ${selectedDevice?.id === d.id ? 'bg-gray-800/70 border-l-2 border-cyan-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{d.equipment_name || d.equipment_id}</p>
                        <p className="text-xs text-gray-500">{d.equipment_type || d.device_type}</p>
                        <p className="text-xs text-gray-600 font-mono">{d.device_serial}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour(d.status)}`}>
                          {d.status}
                        </span>
                        <ChevronRight size={14} className="text-gray-600" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Telemetry Detail Panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedDevice ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 flex flex-col items-center justify-center text-center">
                <Cpu size={48} className="text-gray-700 mb-3" />
                <p className="text-gray-500">Select a device from the list to view telemetry</p>
              </div>
            ) : telemLoading ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 flex items-center justify-center">
                <RefreshCw size={32} className="animate-spin text-cyan-400" />
              </div>
            ) : (
              <>
                {/* Device Header */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {selectedDevice.equipment_name || selectedDevice.equipment_id}
                      </h2>
                      <p className="text-sm text-gray-400">{selectedDevice.equipment_type} · {selectedDevice.device_serial}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColour(selectedDevice.status)}`}>
                      {selectedDevice.status}
                    </span>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                      <Fuel size={16} className={fuelLevel !== null ? (fuelLevel > 20 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'} />
                      <div>
                        <p className="text-xs text-gray-500">Fuel Level</p>
                        <p className="text-sm font-medium text-white">{fuelLevel !== null ? `${fuelLevel}%` : '—'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                      <Clock size={16} className="text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-500">Engine Hours</p>
                        <p className="text-sm font-medium text-white">{engineHours !== null ? `${engineHours.toFixed(1)}h` : '—'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                      <MapPin size={16} className="text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-500">Last Seen</p>
                        <p className="text-sm font-medium text-white">
                          {selectedDevice.last_seen_at
                            ? new Date(selectedDevice.last_seen_at).toLocaleString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Banner */}
                {alert && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-300">Equipment Alert</p>
                      <p className="text-xs text-red-400/80 mt-0.5">
                        {typeof alert === 'string' ? alert : JSON.stringify(alert)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Telemetry Timeline */}
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-white">Recent Telemetry (Last 7 Days)</h3>
                  </div>
                  {telemetry.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">No telemetry data available.</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-800/50 sticky top-0">
                          <tr>
                            {['Time', 'Fuel', 'Engine Hrs', 'Location', 'Alert'].map(h => (
                              <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {[...telemetry].reverse().slice(0, 50).map((t, i) => (
                            <tr key={i} className="hover:bg-gray-800/30">
                              <td className="px-4 py-2 text-gray-400 font-mono">
                                {new Date(t.recorded_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-white">
                                {t.data?.fuel_level ? `${Number(t.data.fuel_level)}%` : '—'}
                              </td>
                              <td className="px-4 py-2 text-white">
                                {t.data?.engine_hours ? `${Number(t.data.engine_hours).toFixed(1)}h` : '—'}
                              </td>
                              <td className="px-4 py-2 text-gray-400">
                                {t.latitude && t.longitude
                                  ? `${Number(t.latitude).toFixed(4)}, ${Number(t.longitude).toFixed(4)}`
                                  : '—'}
                              </td>
                              <td className="px-4 py-2">
                                {t.alert
                                  ? <AlertTriangle size={12} className="text-yellow-400" />
                                  : <CheckCircle size={12} className="text-green-400" />}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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

export default EquipmentIoT;
