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
    const scope = req.query.scope || 'trimestre_atual';
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
    const scope = req.query.scope || 'trimestre_atual';
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

// Helper to call an n8n webhook
const callN8nWebhook = async (url, label) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${label} webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return response.json();
};

// Sync Leads (triggers n8n leads workflow)
app.post('/api/sync', async (req, res) => {
  try {
    req.setTimeout(300000);
    console.log('Triggering Leads sync...');
    const data = await callN8nWebhook(process.env.N8N_SYNC_LEADS_URL, 'Leads');
    console.log('Leads sync completed:', data);
    res.json(data);
  } catch (error) {
    console.error('Sync Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync Deals (triggers n8n deals workflow)
app.post('/api/sync/deals', async (req, res) => {
  try {
    req.setTimeout(300000);
    console.log('Triggering Deals sync...');
    const data = await callN8nWebhook(process.env.N8N_SYNC_DEALS_URL, 'Deals');
    console.log('Deals sync completed:', data);
    res.json(data);
  } catch (error) {
    console.error('Sync Deals Error:', error);
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

// NEW: Vercel Native Cron Endpoint
// Called periodically by Vercel Cron as defined in vercel.json
app.get('/api/cron/sync', async (req, res) => {
    try {
        console.log('[Cron] Triggering Routine Sync Jobs...');

        // Extend timeout for Vercel execution limit if possible (Pro/Enterprise)
        req.setTimeout(300000); 

        const results = await Promise.allSettled([
            // Sync Leads
            callN8nWebhook(process.env.N8N_SYNC_LEADS_URL, 'Leads'),
            // Sync Deals
            callN8nWebhook(process.env.N8N_SYNC_DEALS_URL, 'Deals'),
            // Sync Created Deals (cached_created_deals table)
            createdDealService.syncDealsFromBitrix()
        ]);

        const dashboardResult = results[0];
        const createdDealsResult = results[1];

        res.json({
            success: true,
            message: 'Cron sync completed',
            details: {
                dashboard: dashboardResult.status === 'fulfilled' ? 'success' : dashboardResult.reason?.message || 'failed',
                createdDeals: createdDealsResult.status === 'fulfilled' ? 'success' : createdDealsResult.reason?.message || 'failed'
            }
        });
    } catch (error) {
        console.error('[Cron] Sync Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Export the app for Vercel Serverless
export default app;
