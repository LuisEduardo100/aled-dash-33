// API Configuration - Replace with your n8n webhook URLs
export const API_CONFIG = {
  LEADS_ENDPOINT: import.meta.env.VITE_N8N_LEADS_URL || '/api/leads',
  DEALS_ENDPOINT: import.meta.env.VITE_N8N_DEALS_URL || '/api/deals',
  USE_MOCK_DATA: true, // Set to false when connecting to real API
};
