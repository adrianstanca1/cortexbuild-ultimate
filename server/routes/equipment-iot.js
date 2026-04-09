/**
 * Equipment IoT / Telematics Pipeline
 * Ingests GPS, fuel, utilisation, and sensor data from plant & equipment.
 *
 * Endpoints:
 *   GET  /equipment-iot/devices          — list tracked devices
 *   POST /equipment-iot/devices          — register a new device
 *   GET  /equipment-iot/devices/:id     — get device telemetry
 *   POST /equipment-iot/telemetry        — ingest telemetry batch
 *   GET  /equipment-iot/projects/:id     — equipment utilisation for a project
 */
const express = require('express');
const crypto  = require('crypto');
const pool    = require('../db');
const authMw  = require('../middleware/auth');

const router = express.Router();
router.use(authMw);

// ─── Helpers ───────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Routes ───────────────────────────────────────────────────────────────

/** GET /equipment-iot/devices — list all tracked devices for the org */
router.get('/devices', async (req, res) => {
  try {
    const { project_id, status, limit = '100' } = req.query;
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const isSuper = req.user?.role === 'super_admin';
    const limitNum = Math.min(500, parseInt(limit, 10));

    let query, params;
    if (isSuper) {
      query = `SELECT ed.*, e.name as equipment_name, e.type as equipment_type
               FROM equipment_devices ed
               LEFT JOIN equipment e ON e.id = ed.equipment_id
               WHERE 1=1`;
      params = [];
    } else {
      query = `SELECT ed.*, e.name as equipment_name, e.type as equipment_type
               FROM equipment_devices ed
               LEFT JOIN equipment e ON e.id = ed.equipment_id
               WHERE (ed.organization_id = $1 OR (ed.organization_id IS NULL AND ed.company_id = $2))`;
      params = [orgId, companyId];
    }

    if (project_id) { query += ` AND ed.project_id = $${params.length + 1}`; params.push(project_id); }
    if (status)     { query += ` AND ed.status = $${params.length + 1}`; params.push(status); }
    query += ` ORDER BY ed.last_seen_at DESC LIMIT $${params.length + 1}`;
    params.push(limitNum);

    const { rows } = await pool.query(query, params);
    res.json({ data: rows });
  } catch (err) {
    console.error('[IoT devices]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** POST /equipment-iot/devices — register a telematics device on equipment */
router.post('/devices', async (req, res) => {
  try {
    const { equipment_id, device_serial, device_type, project_id, installation_date } = req.body;
    if (!equipment_id || !device_serial || !device_type) {
      return res.status(400).json({ message: 'equipment_id, device_serial, and device_type are required' });
    }

    const VALID_TYPES = new Set(['gps', 'fuel_sensor', 'hourmeter', 'multi_sensor', 'vibration', 'temperature']);
    if (!VALID_TYPES.has(device_type)) {
      return res.status(400).json({ message: `device_type must be one of: ${[...VALID_TYPES].join(', ')}` });
    }

    const api_key = crypto.randomBytes(24).toString('base64url');
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;

    const { rows } = await pool.query(
      `INSERT INTO equipment_devices (equipment_id, device_serial, device_type, project_id, api_key, installation_date, organization_id, company_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, equipment_id, device_serial, device_type, project_id, status, api_key`,
      [equipment_id, device_serial, device_type, project_id || null, api_key, installation_date || null, orgId, companyId]
    );

    res.status(201).json({ data: rows[0], api_key });
  } catch (err) {
    console.error('[IoT device POST]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** GET /equipment-iot/devices/:id — get device info and latest telemetry */
router.get('/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = '7' } = req.query;
    const daysNum = Math.min(90, parseInt(days, 10) || 7);
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const isSuper = req.user?.role === 'super_admin';

    let devQuery, devParams;
    if (isSuper) {
      devQuery = `SELECT ed.*, e.name as equipment_name FROM equipment_devices ed LEFT JOIN equipment e ON e.id = ed.equipment_id WHERE ed.id = $1`;
      devParams = [id];
    } else {
      devQuery = `SELECT ed.*, e.name as equipment_name FROM equipment_devices ed LEFT JOIN equipment e ON e.id = ed.equipment_id
                  WHERE ed.id = $1 AND (ed.organization_id = $2 OR (ed.organization_id IS NULL AND ed.company_id = $3))`;
      devParams = [id, orgId, companyId];
    }

    const { rows: devices } = await pool.query(devQuery, devParams);
    if (!devices.length) return res.status(404).json({ message: 'Device not found' });

    // Get recent telemetry
    const { rows: telemetry } = await pool.query(
      `SELECT * FROM equipment_telemetry WHERE device_id = $1 AND recorded_at >= NOW() - INTERVAL '${daysNum} days'
       ORDER BY recorded_at DESC LIMIT 1000`,
      [id]
    );

    res.json({ data: devices[0], telemetry, days: daysNum });
  } catch (err) {
    console.error('[IoT device GET]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** POST /equipment-iot/telemetry — ingest a batch of telemetry readings
 *  This endpoint accepts data from GPS trackers, fuel sensors, hourmeters, etc.
 *  It is NOT authenticated via JWT — instead it uses a device-level API key
 *  in the X-Device-API-Key header for IoT device authentication.
 */
router.post('/telemetry', async (req, res) => {
  try {
    // Device-level auth via API key
    const apiKey = req.get('X-Device-API-Key');
    if (!apiKey) return res.status(401).json({ message: 'X-Device-API-Key header required' });

    const { rows: devices } = await pool.query(
      `SELECT id, equipment_id FROM equipment_devices WHERE api_key = $1 AND status = 'active' LIMIT 1`,
      [apiKey]
    );
    if (!devices.length) return res.status(401).json({ message: 'Invalid or inactive device API key' });

    const deviceId = devices[0].id;
    const { readings = [] } = req.body;

    if (!Array.isArray(readings) || !readings.length) {
      return res.status(400).json({ message: 'readings array is required' });
    }

    // Batch insert telemetry readings
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const r of readings) {
      values.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
      params.push(deviceId, r.recorded_at || new Date().toISOString(), r.latitude || null, r.longitude || null, r.data || {}, r.alert || null);
    }

    const { rows } = await pool.query(
      `INSERT INTO equipment_telemetry (device_id, recorded_at, latitude, longitude, data, alert)
       VALUES ${values.join(', ')}
       RETURNING id, device_id, recorded_at`,
      params
    );

    // Update device last_seen_at
    await pool.query(
      `UPDATE equipment_devices SET last_seen_at = NOW() WHERE id = $1`,
      [deviceId]
    );

    // Check for alerts and log them
    for (const r of readings) {
      if (r.alert) {
        try {
          const { logAudit } = require('./audit-helper');
          logAudit({ auth: { id: 'system' }, action: 'alert', entityType: 'equipment_telemetry',
                     newData: { device_id: deviceId, alert: r.alert, recorded_at: r.recorded_at } });
        } catch (_) {}
      }
    }

    res.json({ ingested: rows.length, ids: rows.map(r => r.id) });
  } catch (err) {
    console.error('[IoT telemetry POST]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/** GET /equipment-iot/projects/:id — equipment utilisation summary for a project */
router.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = '30' } = req.query;
    const daysNum = Math.min(180, parseInt(days, 10) || 30);
    const orgId   = req.user?.organization_id;
    const companyId = req.user?.company_id;
    const isSuper = req.user?.role === 'super_admin';

    // Get all devices on this project with equipment info
    let devQuery;
    let devParams;
    if (isSuper) {
      devQuery = `SELECT ed.*, e.name as equipment_name, e.type as equipment_type, e.daily_rate
                  FROM equipment_devices ed LEFT JOIN equipment e ON e.id = ed.equipment_id
                  WHERE ed.project_id = $1`;
      devParams = [id];
    } else {
      devQuery = `SELECT ed.*, e.name as equipment_name, e.type as equipment_type, e.daily_rate
                  FROM equipment_devices ed LEFT JOIN equipment e ON e.id = ed.equipment_id
                  WHERE ed.project_id = $1
                    AND (ed.organization_id = $2 OR (ed.organization_id IS NULL AND ed.company_id = $3))`;
      devParams = [id, orgId, companyId];
    }

    const { rows: devices } = await pool.query(devQuery, devParams);

    // Get telemetry for all devices
    const deviceIds = devices.map(d => d.id);
    if (!deviceIds.length) return res.json({ data: [], summary: { total_devices: 0 } });

    const { rows: telemetry } = await pool.query(
      `SELECT et.* FROM equipment_telemetry et
       WHERE et.device_id = ANY($1) AND et.recorded_at >= NOW() - INTERVAL '${daysNum} days'`,
      [deviceIds]
    );

    // Compute utilisation metrics per device
    const byDevice = {};
    for (const dev of devices) {
      const devTelemetry = telemetry.filter(t => String(t.device_id) === String(dev.id));
      const readings = devTelemetry.length;
      const firstReading = devTelemetry[devTelemetry.length - 1]?.recorded_at;
      const lastReading = devTelemetry[0]?.recorded_at;

      // Calculate distance travelled from GPS
      let distanceKm = 0;
      const gpsReadings = devTelemetry.filter(t => t.latitude && t.longitude);
      for (let i = 1; i < gpsReadings.length; i++) {
        distanceKm += haversineKm(
          gpsReadings[i - 1].latitude, gpsReadings[i - 1].longitude,
          gpsReadings[i].latitude, gpsReadings[i].longitude
        );
      }

      byDevice[dev.id] = {
        device_id: dev.id,
        equipment_name: dev.equipment_name,
        equipment_type: dev.equipment_type,
        daily_rate: dev.daily_rate,
        status: dev.status,
        readings,
        distance_km: Math.round(distanceKm * 10) / 10,
        first_reading: firstReading,
        last_reading: lastReading,
        estimated_hire_days: Math.ceil(readings / (1440 / 5)), // Assuming 5-min intervals
        estimated_cost: Math.ceil(readings / (1440 / 5)) * (parseFloat(dev.daily_rate) || 0),
      };
    }

    const summary = {
      total_devices: devices.length,
      active_devices: devices.filter(d => d.status === 'active').length,
      total_distance_km: Object.values(byDevice).reduce((s, d) => s + d.distance_km, 0),
      estimated_hire_days_total: Object.values(byDevice).reduce((s, d) => s + d.estimated_hire_days, 0),
      estimated_cost_total: Object.values(byDevice).reduce((s, d) => s + d.estimated_cost, 0),
    };

    res.json({ data: Object.values(byDevice), summary, days: daysNum });
  } catch (err) {
    console.error('[IoT project GET]', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
