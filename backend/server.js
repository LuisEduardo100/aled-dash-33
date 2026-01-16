require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dashboardService = require('./dashboardService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow all origins for simplicity, configure as needed for production
app.use(express.json());

// Routes
app.get('/api/dashboard', async (req, res) => {
  try {
    const scope = req.query.scope || 'mes_atual';
    const data = await dashboardService.getDashboardData(scope);
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Raw data endpoint for frontend processing
app.get('/api/dashboard/raw', async (req, res) => {
  try {
    const scope = req.query.scope || 'mes_atual';
    const data = await dashboardService.getRawData(scope);
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GeoJSON endpoint
app.get('/api/dashboard/geojson', async (req, res) => {
    try {
        const data = await dashboardService.getGeoJson();
        res.json(data);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Proxy for Bitrix Sync Webhook (N8N)
app.post('/api/sync', async (req, res) => {
  try {
    req.setTimeout(300000); 
    
    console.log('Triggering Bitrix sync...');

    const response = await fetch('https://webhookrota.aled1.com/webhook/sync-bitrix-postgres', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text(); 
      throw new Error(`Webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Sync completed:', data);
    res.json(data);
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
