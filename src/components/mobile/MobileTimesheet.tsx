import { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { offlineFetch } from '../../services/offlineFetch';
import { usePushNotifications } from '../../hooks/usePushNotifications';

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MobileTimesheet() {
  const [clockedIn,   setIn]      = useState(false);
  const [clockInTime, setInTime]  = useState<Date | null>(null);
  const [elapsed,     setElapsed] = useState('00:00:00');
  const [onBreak,     setBreak]   = useState(false);
  const [breaks,      setBreaks]  = useState(0);
  const [costCode,    setCode]    = useState('03.20 · Concrete works');
  const [gpsOk,       setGpsOk]  = useState<boolean | null>(null);

  usePushNotifications(clockedIn);

  useEffect(() => {
    if (!clockedIn || !clockInTime) return;
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - clockInTime.getTime()) / 1000);
      const h = String(Math.floor(secs / 3600)).padStart(2, '0');
      const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(id);
  }, [clockedIn, clockInTime]);

  const checkGPS = (): Promise<boolean> =>
    new Promise(resolve =>
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const SITE_LAT = 0; // TODO: pull from project context
          const SITE_LON = 0;
          const RADIUS_M = 200;

          // Skip radius check when no project coordinates are available
          if (SITE_LAT === 0 && SITE_LON === 0) {
            setGpsOk(true);
            resolve(true);
            return;
          }

          const dist = haversineMeters(pos.coords.latitude, pos.coords.longitude, SITE_LAT, SITE_LON);
          if (dist > RADIUS_M) {
            setGpsOk(false);
            const proceed = window.confirm(`You appear to be ${Math.round(dist)}m from site. Clock in anyway?`);
            resolve(proceed);
          } else {
            setGpsOk(true);
            resolve(true);
          }
        },
        () => { setGpsOk(false); resolve(false); },
        { timeout: 5000 }
      )
    );

  const handleClockIn = async () => {
    const ok = await checkGPS();
    if (!ok) return;
    const now = new Date();
    setIn(true); setInTime(now);
    await offlineFetch('/api/timesheets/clock-in', {
      method: 'POST',
      body: JSON.stringify({ clocked_in_at: now.toISOString(), cost_code: costCode }),
    });
    toast.success('Clocked in');
  };

  const handleClockOut = async () => {
    setIn(false); setInTime(null); setElapsed('00:00:00');
    await offlineFetch('/api/timesheets/clock-out', {
      method: 'POST',
      body: JSON.stringify({ clocked_out_at: new Date().toISOString(), breaks_count: breaks }),
    });
    toast.success('Clocked out');
  };

  const billableHours = clockInTime
    ? Math.max(0, (Date.now() - clockInTime.getTime()) / 3600000 - breaks * 0.25).toFixed(1)
    : '0.0';

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-bold text-slate-100">Timesheet</h2>

      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-5 text-center border border-indigo-700">
        <div className="text-indigo-300 text-[10px] uppercase tracking-widest mb-1">
          {clockedIn ? 'Time on site' : 'Ready to start'}
        </div>
        <div className="text-5xl font-bold text-indigo-100 font-mono tracking-wider my-3">{elapsed}</div>
        {clockedIn && <div className="text-indigo-400 text-sm">{costCode}</div>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-slate-400 text-xs">Breaks</div>
          <div className="text-white text-xl font-bold">{breaks} × 15m</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-slate-400 text-xs">Billable hrs</div>
          <div className="text-indigo-300 text-xl font-bold">{billableHours}h</div>
        </div>
      </div>

      {gpsOk !== null && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
          gpsOk ? 'bg-emerald-900/40 text-emerald-300' : 'bg-amber-900/40 text-amber-300'}`}>
          <MapPin size={12} />
          {gpsOk ? 'On site ✓' : 'Off-site (overridden)'}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl px-4 py-3">
        <div className="text-slate-400 text-xs mb-1">Cost code</div>
        <select value={costCode} onChange={e => setCode(e.target.value)}
          className="w-full bg-transparent text-slate-100 text-sm">
          <option>03.20 · Concrete works</option>
          <option>04.10 · Brickwork</option>
          <option>05.30 · Steel frame</option>
          <option>07.10 · Roofing</option>
        </select>
      </div>

      {clockedIn ? (
        <div className="space-y-2">
          <button type="button" onClick={() => { setBreak(b => !b); if (!onBreak) setBreaks(b => b + 1); }}
            className={`w-full rounded-2xl py-3 font-semibold text-sm ${onBreak ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {onBreak ? '▶ End Break' : '⏸ Take Break'}
          </button>
          <button type="button" onClick={() => void handleClockOut()}
            className="w-full bg-indigo-700 hover:bg-indigo-600 rounded-2xl py-3.5 text-white font-bold flex items-center justify-center gap-2">
            <Clock size={16} /> Clock Out
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => void handleClockIn()}
          className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-2xl py-4 text-white text-base font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Clock size={18} /> Clock In
        </button>
      )}
    </div>
  );
}
