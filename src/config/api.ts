// API Configuration - Replace with your n8n webhook URLs
export const API_CONFIG = {
  LEADS_ENDPOINT: import.meta.env.VITE_N8N_LEADS_URL || '/api/leads',
  DEALS_ENDPOINT: import.meta.env.VITE_N8N_DEALS_URL || '/api/deals',
  DASHBOARD_ENDPOINT: import.meta.env.VITE_DASHBOARD_API_URL || 'http://localhost:3000/api/dashboard',
  USE_MOCK_DATA: false, // Set to true for development with mock data
};

