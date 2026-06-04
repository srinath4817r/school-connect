const https = require('https');

// Replace with your actual Render API health endpoint
const TARGET_URL = 'https://school-connect-api.onrender.com/api/health'; 
const INTERVAL = 5 * 60 * 1000; // 5 minutes

console.log(`Starting Render Keep-Alive bot. Pinging ${TARGET_URL} every 5 minutes...`);

function ping() {
  https.get(TARGET_URL, (res) => {
    console.log(`[${new Date().toLocaleTimeString()}] Ping successful. Status Code: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] Ping failed: ${err.message}`);
  });
}

// Ping immediately on startup
ping();

// Schedule periodic pings
setInterval(ping, INTERVAL);
