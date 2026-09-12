/**
 * SSS v.56964 — REAL-TIME EMERGENCY DISPATCH & GUARDIAN FLEET CLOUD SERVER
 * Santo Stark Studio • Sub-Second Telemetry & Autonomous Response Engine
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const INCIDENTS_FILE = path.join(__dirname, 'incidents.json');

// Ensure incidents storage exists
function loadIncidents() {
  try {
    if (fs.existsSync(INCIDENTS_FILE)) {
      return JSON.parse(fs.readFileSync(INCIDENTS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('[SSS DB] Error reading incidents.json:', e);
  }
  return [];
}

function saveIncident(incident) {
  try {
    const list = loadIncidents();
    list.unshift(incident);
    // Keep last 100 incidents
    if (list.length > 100) list.length = 100;
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('[SSS DB] Error saving incident:', e);
  }
}

// Current active emergency state
let currentEmergency = null;
let fleetSimulationInterval = null;

// Dynamic active delivery fleet
let activeFleet = [
  { id: 'Z-101', name: 'Zepto Rider (Karan M.)', lat: 37.7751, lng: -122.4185, distanceM: 180, etaSec: 80, color: '#00e676', vehicle: 'Ather 450X EV' },
  { id: 'B-204', name: 'Blinkit Rider (Rahul S.)', lat: 37.7760, lng: -122.4210, distanceM: 290, etaSec: 130, color: '#ffb300', vehicle: 'Honda Activa 6G' },
  { id: 'S-309', name: 'Swiggy Partner (Amit D.)', lat: 37.7735, lng: -122.4225, distanceM: 340, etaSec: 165, color: '#ff2a4b', vehicle: 'TVS Jupiter' },
  { id: 'U-412', name: 'Uber Moto (Vikram T.)', lat: 37.7720, lng: -122.4170, distanceM: 410, etaSec: 195, color: '#00e5ff', vehicle: 'Bajaj Pulsar' }
];

// Broadcast message to all connected WebSocket clients
function broadcast(payload) {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Start moving fleet towards victim when emergency is active
function startFleetConvergence(targetLat, targetLng) {
  if (fleetSimulationInterval) clearInterval(fleetSimulationInterval);

  fleetSimulationInterval = setInterval(() => {
    if (!currentEmergency) {
      clearInterval(fleetSimulationInterval);
      fleetSimulationInterval = null;
      return;
    }

    activeFleet.forEach((rider) => {
      // Step slightly towards target
      const step = 0.00015;
      const dLat = targetLat - rider.lat;
      const dLng = targetLng - rider.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      if (dist > 0.0001) {
        rider.lat += (dLat / dist) * step;
        rider.lng += (dLng / dist) * step;
        rider.distanceM = Math.max(15, Math.round(rider.distanceM - 12));
        rider.etaSec = Math.max(10, Math.round(rider.distanceM / 2.5));
      }
    });

    broadcast({
      type: 'FLEET_POSITION_UPDATE',
      fleet: activeFleet
    });
  }, 2000);
}

// WebSocket Connection Management
wss.on('connection', (ws) => {
  console.log(`[SSS WS] New client connected. Active connections: ${wss.clients.size}`);

  // Send current state to newly connected client
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    currentEmergency,
    fleet: activeFleet,
    recentIncidents: loadIncidents().slice(0, 5)
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'EMERGENCY_SOS_TRIGGER') {
        const incidentId = `SSS-INC-${Date.now().toString().slice(-6)}`;
        currentEmergency = {
          incidentId,
          patientName: data.patientName || 'Santosha D (Santos Stark)',
          condition: data.condition || 'Coronary Artery Disease (CAD)',
          bloodGroup: data.bloodGroup || 'O+',
          lat: data.lat || 37.7749,
          lng: data.lng || -122.4194,
          heartRate: data.heartRate || 72,
          spo2: data.spo2 || 98,
          triggerReason: data.triggerReason || 'MANUAL_1_TAP_BUTTON',
          timestamp: new Date().toISOString(),
          status: 'ACTIVE'
        };

        saveIncident(currentEmergency);

        console.log(`\n🚨 ========================================================`);
        console.log(`[SSS CRITICAL SOS ACTIVATED] ID: ${incidentId}`);
        console.log(`Patient: ${currentEmergency.patientName} | Blood: ${currentEmergency.bloodGroup}`);
        console.log(`Location: ${currentEmergency.lat.toFixed(5)}, ${currentEmergency.lng.toFixed(5)}`);
        console.log(`Vitals: HR ${currentEmergency.heartRate} BPM | SpO2 ${currentEmergency.spo2}%`);
        console.log(`Trigger: ${currentEmergency.triggerReason}`);
        console.log(`Outbound SMS -> Sarah (+1 555-0199): "🚨 SSS ALERT: Santosha D triggered emergency!"`);
        console.log(`Outbound SMS -> Dr. Mehta (+1 800-SSS-CARE): "🏥 PATIENT TELEMETRY TRANSMITTED"`);
        console.log(`========================================================\n`);

        startFleetConvergence(currentEmergency.lat, currentEmergency.lng);

        broadcast({
          type: 'BROADCAST_ALERT',
          emergency: currentEmergency,
          fleet: activeFleet
        });
      }

      if (data.type === 'EMERGENCY_CANCEL') {
        if (currentEmergency) {
          console.log(`[SSS RESOLVED] Emergency ${currentEmergency.incidentId} CANCELLED by user.`);
          currentEmergency.status = 'CANCELLED_SAFE';
          currentEmergency.resolvedAt = new Date().toISOString();
          saveIncident(currentEmergency);
          currentEmergency = null;
        }
        if (fleetSimulationInterval) {
          clearInterval(fleetSimulationInterval);
          fleetSimulationInterval = null;
        }
        broadcast({
          type: 'BROADCAST_CANCELLED',
          message: 'Emergency was cancelled by patient. Status SAFE.'
        });
      }

      if (data.type === 'TELEMETRY_UPDATE') {
        if (currentEmergency) {
          currentEmergency.heartRate = data.heartRate || currentEmergency.heartRate;
          currentEmergency.spo2 = data.spo2 || currentEmergency.spo2;
          broadcast({
            type: 'LIVE_VITALS',
            heartRate: currentEmergency.heartRate,
            spo2: currentEmergency.spo2
          });
        }
      }

      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', time: Date.now() }));
      }
    } catch (err) {
      console.error('[SSS WS] Message parse error:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[SSS WS] Client disconnected. Remaining: ${wss.clients.size}`);
  });
});

// =============================================================================
// REST API ENDPOINTS
// =============================================================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ACTIVE',
    service: 'SSS_DISPATCH_CLOUD_v56964',
    uptime: Math.round(process.uptime()),
    connectedClients: wss.clients.size,
    isEmergencyActive: !!currentEmergency,
    timestamp: new Date().toISOString()
  });
});

// Trigger SOS
app.post('/api/sos', (req, res) => {
  const { patientName, condition, bloodGroup, lat, lng, heartRate, spo2, triggerReason } = req.body;
  const incidentId = `SSS-INC-${Date.now().toString().slice(-6)}`;

  currentEmergency = {
    incidentId,
    patientName: patientName || 'Santosha D (Santos Stark)',
    condition: condition || 'Coronary Artery Disease (CAD)',
    bloodGroup: bloodGroup || 'O+',
    lat: lat || 37.7749,
    lng: lng || -122.4194,
    heartRate: heartRate || 72,
    spo2: spo2 || 98,
    triggerReason: triggerReason || 'HTTP_REST_TRIGGER',
    timestamp: new Date().toISOString(),
    status: 'ACTIVE'
  };

  saveIncident(currentEmergency);
  startFleetConvergence(currentEmergency.lat, currentEmergency.lng);

  broadcast({
    type: 'BROADCAST_ALERT',
    emergency: currentEmergency,
    fleet: activeFleet
  });

  res.json({
    success: true,
    message: 'Distress Beacon Accepted! Broadcasted to Family & Fleet.',
    incidentId,
    emergency: currentEmergency,
    dispatchedFleet: activeFleet
  });
});

// Cancel SOS
app.post('/api/sos/cancel', (req, res) => {
  if (currentEmergency) {
    currentEmergency.status = 'CANCELLED_SAFE';
    currentEmergency.resolvedAt = new Date().toISOString();
    saveIncident(currentEmergency);
    currentEmergency = null;
  }
  if (fleetSimulationInterval) {
    clearInterval(fleetSimulationInterval);
    fleetSimulationInterval = null;
  }
  broadcast({
    type: 'BROADCAST_CANCELLED',
    message: 'Emergency was cancelled by patient. Status SAFE.'
  });

  res.json({
    success: true,
    message: 'Emergency status cleared. System returned to SAFE standby.'
  });
});

// Get Active Fleet
app.get('/api/fleet', (req, res) => {
  res.json({ fleet: activeFleet });
});

// Get Incidents History
app.get('/api/incidents', (req, res) => {
  res.json({ incidents: loadIncidents() });
});

// =============================================================================
// FAMILY GUARDIAN & DISPATCH WEB DASHBOARD (GET / or GET /guardian)
// =============================================================================
app.get(['/', '/guardian'], (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSS Guardian & Cloud Dispatch Portal | Santo Stark Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --bg: #07090e;
      --card: rgba(16, 20, 29, 0.95);
      --red: #ff2a4b;
      --green: #00e676;
      --cyan: #00e5ff;
      --gold: #ffb300;
      --text: #f0f4f8;
      --muted: #8a99ad;
      --border: rgba(255, 255, 255, 0.1);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 20px; }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 24px; background: var(--card); border: 1px solid var(--border);
      border-radius: 16px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { font-size: 28px; }
    .brand-title h1 { font-family: 'Orbitron', sans-serif; font-size: 18px; color: var(--red); letter-spacing: 1px; }
    .brand-title p { font-size: 11px; color: var(--muted); }
    .cloud-pill {
      background: rgba(0, 230, 118, 0.15); border: 1px solid var(--green);
      color: var(--green); font-size: 11px; font-weight: 800; padding: 6px 14px;
      border-radius: 20px; display: flex; align-items: center; gap: 6px;
    }
    .cloud-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.3); } }
    
    /* Emergency Banner */
    .emergency-banner {
      display: none; background: linear-gradient(135deg, rgba(255, 42, 75, 0.25), rgba(183, 0, 31, 0.4));
      border: 2px solid var(--red); border-radius: 16px; padding: 20px; margin-bottom: 20px;
      box-shadow: 0 0 30px rgba(255, 42, 75, 0.5); animation: alertPulse 1.2s infinite;
    }
    .emergency-banner.active { display: block; }
    @keyframes alertPulse { 0%, 100% { box-shadow: 0 0 20px rgba(255, 42, 75, 0.4); } 50% { box-shadow: 0 0 40px rgba(255, 42, 75, 0.8); } }
    .eb-title { font-family: 'Orbitron', sans-serif; font-size: 18px; color: var(--red); font-weight: 900; margin-bottom: 6px; }
    .eb-desc { font-size: 14px; color: #fff; line-height: 1.5; margin-bottom: 14px; }
    .eb-actions { display: flex; gap: 12px; }
    .eb-btn {
      padding: 10px 18px; border-radius: 10px; font-weight: 800; font-size: 12px;
      border: none; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    }
    .eb-btn-call { background: var(--red); color: #fff; }
    .eb-btn-ack { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }

    /* Grid Layout */
    .dashboard-grid { display: grid; grid-template-columns: 360px 1fr 340px; gap: 20px; }
    @media (max-width: 1100px) { .dashboard-grid { grid-template-columns: 1fr; } }
    
    .card {
      background: var(--card); border: 1px solid var(--border); border-radius: 16px;
      padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .card-title {
      font-family: 'Orbitron', sans-serif; font-size: 13px; color: var(--cyan);
      margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;
    }
    
    /* Patient Profile */
    .profile-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px; }
    .profile-row strong { color: var(--muted); }
    .profile-badge { background: var(--red); color: #fff; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; }

    /* Vitals */
    .vitals-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
    .vital-box { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 12px; text-align: center; }
    .vital-val { font-family: 'Orbitron', sans-serif; font-size: 24px; font-weight: 900; color: var(--red); }
    .vital-lbl { font-size: 10px; color: var(--muted); font-weight: 700; margin-top: 4px; }

    /* Map Frame */
    #map { width: 100%; height: 420px; border-radius: 14px; border: 1px solid rgba(0,229,255,0.3); }

    /* Fleet List */
    .fleet-item {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; padding: 10px 14px; margin-bottom: 8px; display: flex;
      justify-content: space-between; align-items: center; font-size: 12px;
    }
    .fleet-name { font-weight: 700; color: #fff; }
    .fleet-sub { font-size: 10px; color: var(--muted); margin-top: 2px; }
    .fleet-eta { font-family: 'JetBrains Mono', monospace; font-weight: 800; color: var(--green); font-size: 11px; }

    /* Log Stream */
    .log-stream { max-height: 220px; overflow-y: auto; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
    .log-row { padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); color: var(--muted); }
    .log-row.alert { color: var(--red); font-weight: 700; }
    .log-row.ok { color: var(--green); }
  </style>
</head>
<body>

  <header class="header">
    <div class="brand">
      <div class="brand-logo">🛡️</div>
      <div class="brand-title">
        <h1>SSS GUARDIAN & CLOUD DISPATCH</h1>
        <p>Santo Stark Studio • Real-Time Emergency Telemetry Server (Port 8080)</p>
      </div>
    </div>
    <div class="cloud-pill" id="cloudStatus">
      <div class="cloud-dot"></div>
      <span>CONNECTED (WEBSOCKET LIVE)</span>
    </div>
  </header>

  <div class="emergency-banner" id="emergencyBanner">
    <div class="eb-title">🚨 CRITICAL PATIENT MEDICAL EMERGENCY ACTIVE!</div>
    <div class="eb-desc" id="emergencyDesc">
      Distress signal received from <strong>Santosha D</strong>. Autonomous acoustic siren and nearby delivery fleet mobilized.
    </div>
    <div class="eb-actions">
      <a class="eb-btn eb-btn-call" href="tel:911">📞 Call 911 / EMS</a>
      <a class="eb-btn eb-btn-call" href="tel:+15550199">📞 Call Patient Phone</a>
      <button class="eb-btn eb-btn-ack" onclick="cancelEmergencyFromGuardian()">✓ Clear / Safe Mode</button>
    </div>
  </div>

  <div class="dashboard-grid">
    
    <!-- Left Column: Patient Profile & Vitals -->
    <div>
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-title">
          <span>👤 MONITORED PATIENT</span>
          <span class="profile-badge">O+ POSITIVE</span>
        </div>
        <div class="profile-row"><strong>Name:</strong> <span>Santosha D (Santos Stark)</span></div>
        <div class="profile-row"><strong>Age / Sex:</strong> <span>58 Yrs / Male</span></div>
        <div class="profile-row"><strong>Condition:</strong> <span>Coronary Artery Disease</span></div>
        <div class="profile-row"><strong>Guardian (ICE):</strong> <span>Sarah (+1 555-0199)</span></div>
        <div class="profile-row"><strong>Cardiologist:</strong> <span>Dr. R. Mehta (+1 800-SSS-CARE)</span></div>

        <div class="vitals-cards">
          <div class="vital-box">
            <div class="vital-val" id="dispHR">72</div>
            <div class="vital-lbl">HEART RATE (BPM)</div>
          </div>
          <div class="vital-box">
            <div class="vital-val" id="dispSpo2" style="color: var(--cyan);">98%</div>
            <div class="vital-lbl">BLOOD OXYGEN</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>📜 DISPATCH EVENT LOG</span>
          <span style="font-size: 10px; color: var(--muted);" id="logCount">Live</span>
        </div>
        <div class="log-stream" id="logStream">
          <div class="log-row ok">[READY] SSS Cloud Dispatch Server active on port 8080.</div>
        </div>
      </div>
    </div>

    <!-- Center Column: Live GPS & Fleet Converge Map -->
    <div class="card">
      <div class="card-title">
        <span>🗺️ LIVE PATIENT GPS & GIG-ECONOMY FLEET RADAR</span>
        <span style="font-size: 11px; color: var(--green);" id="radarStatus">Scanning 400m</span>
      </div>
      <div id="map"></div>
    </div>

    <!-- Right Column: Dispatched Fleet & Simulated SMS -->
    <div>
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-title">
          <span>🛵 RESPONDING GIG FLEET</span>
          <span style="font-size: 10px; color: var(--gold);">4 RIDERS</span>
        </div>
        <div id="fleetList">
          <!-- Populated dynamically -->
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>⚡ SIMULATE DISPATCH TEST</span>
        </div>
        <p style="font-size: 11px; color: var(--muted); margin-bottom: 12px; line-height: 1.4;">
          Test the full emergency sequence from this guardian portal:
        </p>
        <button onclick="triggerSimulatedSos()" style="width: 100%; padding: 12px; background: var(--red); color: #fff; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; margin-bottom: 8px;">
          🚨 TRIGGER TEST SOS (HTTP / WS)
        </button>
        <button onclick="cancelEmergencyFromGuardian()" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; font-weight: 700; cursor: pointer;">
          ✓ CANCEL EMERGENCY
        </button>
      </div>
    </div>

  </div>

  <script>
    const patientLat = 37.7749;
    const patientLng = -122.4194;

    // Initialize Map
    const map = L.map('map').setView([patientLat, patientLng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map);

    const victimMarker = L.marker([patientLat, patientLng], {
      icon: L.divIcon({
        className: 'custom-pin',
        html: '<div style="background:#ff2a4b; color:#fff; width:26px; height:26px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 15px #ff2a4b; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:11px;">YOU</div>',
        iconSize: [28, 28], iconAnchor: [14, 14]
      })
    }).addTo(map).bindPopup('<strong>📍 Santosha D (Patient)</strong><br>Monitored via SSS Shield');

    let fleetMarkers = {};

    function addLog(text, isAlert = false) {
      const stream = document.getElementById('logStream');
      const time = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      div.className = 'log-row' + (isAlert ? ' alert' : '');
      div.textContent = \`[\${time}] \${text}\`;
      stream.prepend(div);
    }

    function renderFleet(fleet) {
      const container = document.getElementById('fleetList');
      container.innerHTML = fleet.map(r => \`
        <div class="fleet-item">
          <div>
            <div class="fleet-name">\${r.name}</div>
            <div class="fleet-sub">🛵 \${r.vehicle} • \${r.distanceM}m away</div>
          </div>
          <div class="fleet-eta">\${r.etaSec}s ETA</div>
        </div>
      \`).join('');

      // Update Map Markers
      fleet.forEach(r => {
        if (!fleetMarkers[r.id]) {
          fleetMarkers[r.id] = L.marker([r.lat, r.lng], {
            icon: L.divIcon({
              html: \`<div style="background:\${r.color}; color:#000; width:22px; height:22px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px \${r.color}; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:900;">🛵</div>\`,
              iconSize: [24, 24], iconAnchor: [12, 12]
            })
          }).addTo(map).bindPopup(\`<strong>\${r.name}</strong><br>ETA: \${r.etaSec}s\`);
        } else {
          fleetMarkers[r.id].setLatLng([r.lat, r.lng]);
        }
      });
    }

    // Connect to WebSocket
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${wsProto}//\${window.location.host}\`;
    let ws;

    function connectWs() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        addLog('Connected to SSS Real-Time Emergency Hub.', false);
        document.getElementById('cloudStatus').innerHTML = '<div class="cloud-dot"></div><span>CONNECTED (WEBSOCKET LIVE)</span>';
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);

          if (msg.type === 'INIT_STATE') {
            if (msg.fleet) renderFleet(msg.fleet);
            if (msg.currentEmergency) activateEmergencyUI(msg.currentEmergency);
          }

          if (msg.type === 'BROADCAST_ALERT') {
            activateEmergencyUI(msg.emergency);
            if (msg.fleet) renderFleet(msg.fleet);
            addLog(\`🚨 SOS RECEIVED from \${msg.emergency.patientName} at (\${msg.emergency.lat.toFixed(4)}, \${msg.emergency.lng.toFixed(4)})!\`, true);
            addLog(\`📱 SMS Dispatched to Guardian Sarah (+1 555-0199) and Dr. Mehta.\`, true);
          }

          if (msg.type === 'BROADCAST_CANCELLED') {
            deactivateEmergencyUI();
            addLog('✓ Emergency Cancelled / Standby resumed.', false);
          }

          if (msg.type === 'FLEET_POSITION_UPDATE') {
            renderFleet(msg.fleet);
          }

          if (msg.type === 'LIVE_VITALS') {
            document.getElementById('dispHR').textContent = msg.heartRate;
            document.getElementById('dispSpo2').textContent = msg.spo2 + '%';
          }
        } catch (err) {
          console.error('WS Parse Error:', err);
        }
      };

      ws.onclose = () => {
        document.getElementById('cloudStatus').innerHTML = '<span style="color:#ff2a4b;">DISCONNECTED (RECONNECTING...)</span>';
        setTimeout(connectWs, 3000);
      };
    }

    function activateEmergencyUI(em) {
      const banner = document.getElementById('emergencyBanner');
      banner.classList.add('active');
      document.getElementById('emergencyDesc').innerHTML = \`
        🚨 <strong>CRITICAL SOS ALERT:</strong> \${em.patientName} triggered emergency at <strong>\${new Date(em.timestamp).toLocaleTimeString()}</strong>!<br>
        📍 Coordinates: \${em.lat.toFixed(5)}, \${em.lng.toFixed(5)} • Condition: \${em.condition} • Vitals: \${em.heartRate} BPM, \${em.spo2}% SpO2
      \`;
      document.getElementById('dispHR').textContent = em.heartRate;
      document.getElementById('dispSpo2').textContent = em.spo2 + '%';
      victimMarker.setLatLng([em.lat, em.lng]).openPopup();
      map.setView([em.lat, em.lng], 16);
    }

    function deactivateEmergencyUI() {
      document.getElementById('emergencyBanner').classList.remove('active');
    }

    function triggerSimulatedSos() {
      fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: 'Santosha D (Santos Stark)',
          condition: 'Coronary Artery Disease (CAD)',
          lat: 37.7749,
          lng: -122.4194,
          heartRate: 72,
          spo2: 98,
          triggerReason: 'GUARDIAN_PORTAL_TEST'
        })
      });
    }

    function cancelEmergencyFromGuardian() {
      fetch('/api/sos/cancel', { method: 'POST' });
    }

    connectWs();
  </script>
</body>
</html>`;
  res.send(html);
});

// Start Server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  SSS v.56964 Real-time Cloud Emergency Server running on :${PORT}`);
  console.log(`  Guardian Dashboard: http://localhost:${PORT}`);
  console.log(`  WebSocket Endpoint: ws://localhost:${PORT}`);
  console.log(`  REST API Health:    http://localhost:${PORT}/api/health`);
  console.log(`=================================================================`);
});
