// API Configuration - Replace with your n8n webhook URLs
// Determina a URL base: 
// 1. Variável de ambiente VITE_API_BASE_URL (se definida)
// 2. Localhost:3000 se estiver em ambiente de desenvolvimento (npm run dev)
// 3. String vazia (caminho relativo) se estiver em produção (Vercel)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

export const API_CONFIG = {
  LEADS_ENDPOINT: import.meta.env.VITE_N8N_LEADS_URL || '/api/leads',
  DEALS_ENDPOINT: import.meta.env.VITE_N8N_DEALS_URL || '/api/deals',
  DASHBOARD_ENDPOINT: `${BASE_URL}/api/dashboard`,
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
};

