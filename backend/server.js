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

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
