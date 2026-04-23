/**
 * CortexBuild Ultimate — Mobile Timesheet
 * Lightweight clock-in/clock-out interface for mobile PWA.
 * Triggers push notification subscription on first clock-in.
 */
import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export function MobileTimesheet() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);

  // Register push subscription after user clocks in (high-intent moment)
  usePushNotifications(clockedIn);

  function handleClockIn() {
    setClockedIn(true);
    setClockInTime(new Date());
  }

  function handleClockOut() {
    setClockedIn(false);
    setClockInTime(null);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Clock className="mx-auto mb-2 text-blue-400" size={48} />
          <h1 className="text-2xl font-bold">Timesheet</h1>
          {clockedIn && clockInTime && (
            <p className="mt-1 text-sm text-gray-400">
              Clocked in at {clockInTime.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-gray-900 p-6 text-center">
          <p className="text-lg font-semibold mb-1">
            {clockedIn ? 'You are clocked in' : 'You are clocked out'}
          </p>
          <div
            className={`mt-1 h-3 w-3 rounded-full mx-auto ${
              clockedIn ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
            }`}
          />
        </div>

        {clockedIn ? (
          <button
            onClick={handleClockOut}
            className="w-full rounded-xl bg-red-600 py-4 text-lg font-bold hover:bg-red-700 active:scale-95 transition-transform"
          >
            Clock Out
          </button>
        ) : (
          <button
            onClick={handleClockIn}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Clock In
          </button>
        )}
      </div>
    </div>
  );
}
