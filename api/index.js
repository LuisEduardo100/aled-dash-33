import express from 'express';
import cors from 'cors';
import * as dashboardService from './dashboardService.js';
import createdDealService from '../backend/createdDealService.js';

// Initialize Express
const app = express();

// Middleware
app.use(cors()); // Allow all origins for simplicity
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
    // Vercel serverless function timeout is limited (10s on free), 
    // setting connection timeout here doesn't override platform limit but good for code consistency
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

// ============================================================
// NEW: Created Deals Endpoints
// ============================================================

// Get cached created deals
app.get('/api/created-deals/raw', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 5000;
        const deals = await createdDealService.getCachedDeals(limit);
        res.json({ success: true, count: deals.length, deals: deals });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Manual Sync Trigger
app.post('/api/created-deals/sync', async (req, res) => {
    try {
        // Vercel timeout note: This might timeout on Vercel Pro/Free
        console.log('Triggering Created Deals Sync...');
        
        const result = await createdDealService.syncDealsFromBitrix();
        res.json(result);
    } catch (error) {
        console.error('Sync Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Export the app for Vercel Serverless
export default app;
