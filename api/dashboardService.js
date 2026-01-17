const db = require('./db');

const getDashboardData = async (scope = 'mes_atual') => {
  try {
    const result = await db.query(
      'SELECT payload FROM dashboard_leads_lovable WHERE scope = $1 LIMIT 1',
      [scope]
    );

    if (result.rows.length === 0) {
      return getEmptyFallback();
    }

    const { leads, deals } = result.rows[0].payload;
    
    // Safety check if payload is malformed
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeDeals = Array.isArray(deals) ? deals : [];

    return {
      kpis: {
        leads: calculateLeadKPIs(safeLeads),
        financials: calculateFinancialKPIs(safeDeals),
      },
      performance_by_seller: calculateSellerPerformance(safeLeads, safeDeals),
      charts: formatChartData(safeLeads, safeDeals),
    };

  } catch (error) {
    console.error('Error in getDashboardData:', error);
    throw error;
  }
};

// Return raw data for frontend processing
const getRawData = async (scope = 'mes_atual') => {
  try {
    console.log(`Querying raw data for scope: ${scope}`);
    let result = await db.query(
      'SELECT payload FROM dashboard_leads_lovable WHERE scope = $1 LIMIT 1',
      [scope]
    );

    if (result.rows.length === 0) {
      console.warn(`No data found for scope '${scope}'. Attempting fallback to LATEST row.`);
      // Fallback: Get the most recent row (assuming there's valid data in the table)
      // We assume the table has an auto-incrementing 'id' or 'created_at' column.
      // Since we don't know the exact schema, we'll try 'ORDER BY id DESC' (common convention).
      // If 'id' doesn't exist, this might fail, so we wrap in try/catch or use a safer assumption?
      // User said "SELECT * ... deu certo". The table likely has an ID.
      try {
          result = await db.query('SELECT payload, scope FROM dashboard_leads_lovable ORDER BY id DESC LIMIT 1');
      } catch (e) {
          console.warn('Fallback ORDER BY id failed, trying simple LIMIT 1', e);
          result = await db.query('SELECT payload, scope FROM dashboard_leads_lovable LIMIT 1');
      }
      
      if (result.rows.length === 0) {
        console.warn('Fallback failed: Table is empty.');
        return { leads: [], deals: [] };
      }
      console.log(`Fallback successful. Using data from scope: '${result.rows[0].scope || 'unknown'}' (Latest entry)`);
    }

    const { leads, deals } = result.rows[0].payload;
    
    // Safety check if payload structure matches expectations
    // If payload is the direct object { leads: ..., deals: ... }
    if (!leads && !deals && result.rows[0].payload.payload) {
        // Handle nested payload case { payload: { leads, deals } }
        return result.rows[0].payload.payload;
    }

    return {
      leads: Array.isArray(leads) ? leads : (result.rows[0].payload.leads || []),
      deals: Array.isArray(deals) ? deals : (result.rows[0].payload.deals || []),
    };

  } catch (error) {
    console.error('Error in getRawData:', error);
    throw error;
  }
};

const getEmptyFallback = () => ({
  kpis: {
    leads: { total: 0, breakdown: {}, conversion_rate: 0 },
    financials: { revenue: 0, pipeline: 0, lost: 0, ticket_avg: 0 },
  },
  performance_by_seller: [],
  charts: { map: [], sources: [], timeline: [] },
  charts: { map: [], sources: [], timeline: [] }, // Kept duplicate key from original to match logic
});

// Fetch GeoJSON from external source
const getGeoJson = async () => {
    try {
        const response = await fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson');
        if (!response.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching GeoJSON:', error);
        throw error;
    }
};

// A. KPIs Gerais de Leads
const calculateLeadKPIs = (leads) => {
  const total = leads.length;
  const breakdown = {
    NEW: { count: 0, percentage: 0 },
    IN_PROCESS: { count: 0, percentage: 0 },
    JUNK: { count: 0, percentage: 0 },
    CONVERTED: { count: 0, percentage: 0 },
  };

  let convertedCount = 0;

  leads.forEach(lead => {
    // Increment status count if it exists in our map, else ignore or handle unknown
    if (breakdown[lead.status]) {
      breakdown[lead.status].count++;
    }
    if (lead.status === 'CONVERTED') {
      convertedCount++;
    }
  });

  // Calculate percentages
  Object.keys(breakdown).forEach(status => {
    if (total > 0) {
      breakdown[status].percentage = ((breakdown[status].count / total) * 100).toFixed(1);
    }
  });

  const conversion_rate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : 0;

  return {
    total,
    breakdown,
    conversion_rate: Number(conversion_rate),
  };
};

// B. Indicadores Financeiros
const calculateFinancialKPIs = (deals) => {
  let revenue = 0;
  let pipeline = 0;
  let lost = 0;
  let wonCount = 0;

  deals.forEach(deal => {
    const val = Number(deal.valor) || 0;

    if (deal.is_ganho) {
      revenue += val;
      wonCount++;
    } else if (!deal.is_fechado) {
      pipeline += val;
    } else if (deal.is_fechado && !deal.is_ganho) {
      lost += val;
    }
  });

  const ticket_avg = wonCount > 0 ? (revenue / wonCount) : 0;

  return {
    revenue,
    pipeline,
    lost,
    ticket_avg,
  };
};

// C. Performance por Vendedor
const calculateSellerPerformance = (leads, deals) => {
  const sellerStats = {};

  // Initialize stats for known IDs from both lists to cover edge cases
  [...leads, ...deals].forEach(item => {
    if (item.responsavel_id && !sellerStats[item.responsavel_id]) {
      sellerStats[item.responsavel_id] = {
        ids: item.responsavel_id,
        total_vendido: 0,
        leads_atribuidos: 0,
        deals_ganhos: 0
      };
    }
  });

  leads.forEach(lead => {
    if (lead.responsavel_id && sellerStats[lead.responsavel_id]) {
      sellerStats[lead.responsavel_id].leads_atribuidos++;
    }
  });

  deals.forEach(deal => {
    if (deal.responsavel_id && sellerStats[deal.responsavel_id]) {
        if (deal.is_ganho) {
            sellerStats[deal.responsavel_id].total_vendido += Number(deal.valor) || 0;
            sellerStats[deal.responsavel_id].deals_ganhos++;
        }
    }
  });

  return Object.values(sellerStats).map(stat => ({
    id: stat.ids,
    total_vendido: stat.total_vendido,
    leads_atribuidos: stat.leads_atribuidos,
    taxa_conversao: stat.leads_atribuidos > 0 
      ? ((stat.deals_ganhos / stat.leads_atribuidos) * 100).toFixed(1) 
      : 0
  }));
};

// D. Dados Formatados para Gráficos
const formatChartData = (leads, deals) => {
  // Mapa Geográfico (Baseado em Deals ou Leads? Requisito diz apenas "Quantidade de vendas" no exemplo value: 10)
  // Assumindo DEALS ganhos para o mapa conforme exemplo "Quantidade de vendas".
  // Mas se for leads, basta trocar. O exemplo diz "value: Quantidade de vendas".
  const mapData = {};
  deals.forEach(deal => {
    if (deal.is_ganho && deal.uf) {
      mapData[deal.uf] = (mapData[deal.uf] || 0) + 1;
    }
  });
  const mapChart = Object.keys(mapData).map(uf => ({ name: uf, value: mapData[uf] }));

  // Gráfico de Barras (Fontes de Leads - Todas as fontes ou só convertidos? Geralmente total de leads)
  const sourceData = {};
  leads.forEach(lead => {
    if (lead.fonte) {
      sourceData[lead.fonte] = (sourceData[lead.fonte] || 0) + 1;
    }
  });
  // Ordenar maior para menor
  const sourceChart = Object.keys(sourceData)
    .map(source => ({ name: source, value: sourceData[source] }))
    .sort((a, b) => b.value - a.value);

  // Timeline (Leads criados vs Vendas fechadas)
  // Agrupar por data (YYYY-MM-DD)
  const timelineMap = {};

  const addToTimeline = (dateStr, type) => {
    if (!dateStr) return;
    const date = dateStr.split('T')[0]; // Simple ISO date extraction
    if (!timelineMap[date]) {
      timelineMap[date] = { date, leads: 0, sales: 0 };
    }
    timelineMap[date][type]++;
  };

  leads.forEach(lead => addToTimeline(lead.data_criacao, 'leads'));
  deals.forEach(deal => {
      if (deal.is_ganho) { // "Quantidade de vendas fechadas" usually implies WON deals
         addToTimeline(deal.data_fechamento, 'sales')
      }
  });

  // Convert to sorted array
  const timelineChart = Object.values(timelineMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    map: mapChart,
    sources: sourceChart,
    timeline: timelineChart
  };
};

module.exports = { getDashboardData, getRawData, getGeoJson };
