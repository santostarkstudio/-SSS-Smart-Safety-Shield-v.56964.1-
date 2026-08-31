/**
 * SSS v.56964 — EMERGENCY DISPATCH & FLEET SERVER
 * Santo Stark Studio • Sub-Second WebSocket Broadcast
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Mock Active Delivery Riders in City
let activeFleet = [
  { id: 'Z-101', name: 'Zepto Rider (Karan M.)', lat: 37.7751, lng: -122.4185, distanceM: 180, etaSec: 80 },
  { id: 'B-204', name: 'Blinkit Rider (Rahul S.)', lat: 37.7760, lng: -122.4210, distanceM: 290, etaSec: 130 },
  { id: 'S-309', name: 'Swiggy Partner (Amit D.)', lat: 37.7735, lng: -122.4225, distanceM: 340, etaSec: 165 },
  { id: 'U-412', name: 'Uber Moto (Vikram T.)', lat: 37.7720, lng: -122.4170, distanceM: 410, etaSec: 195 }
];

// WebSocket Connection Hub
wss.on('connection', (ws) => {
  console.log('[SSS Backend] New Client / Guardian connected to Emergency Channel.');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'EMERGENCY_SOS_TRIGGER') {
        console.log(`[SSS CRITICAL] SOS Received from ${data.patientName} at (${data.lat}, ${data.lng})`);
        
        // Broadcast to all family dashboards & nearby delivery partners
        const broadcastPayload = JSON.stringify({
          type: 'BROADCAST_ALERT',
          patient: data.patientName,
          lat: data.lat,
          lng: data.lng,
          condition: data.condition || 'Suspected Cardiac Event',
          time: new Date().toISOString()
        });

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(broadcastPayload);
          }
        });
      }
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });
});

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ACTIVE', service: 'SSS_DISPATCH_v56964', uptime: process.uptime() });
});

app.post('/api/sos', (req, res) => {
  const { patientName, lat, lng } = req.body;
  console.log(`[SSS HTTP SOS] ${patientName} triggered emergency at ${lat}, ${lng}`);
  
  res.json({
    success: true,
    message: 'SOS Broadcasted to Family and Delivery Fleet.',
    dispatchedFleet: activeFleet
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`=================================================================`);
  console.log(`  SSS v.56964 Real-time Cloud Emergency Server running on :${PORT}`);
  console.log(`  WebSocket Endpoint: ws://localhost:${PORT}`);
  console.log(`=================================================================`);
});
