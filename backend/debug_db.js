const db = require('./db');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const now = await db.query('SELECT NOW()');
    console.log('Connection successful. Server time:', now.rows[0].now);

    console.log('Checking dashboard_leads_lovable table...');
    const count = await db.query('SELECT COUNT(*) FROM dashboard_leads_lovable');
    console.log('Total rows:', count.rows[0].count);

    console.log('Checking for scope "mes_atual"...');
    const result = await db.query('SELECT * FROM dashboard_leads_lovable WHERE scope = $1', ['mes_atual']);
    
    if (result.rows.length === 0) {
      console.log('No data found for scope "mes_atual". listing all scopes:');
      const scopes = await db.query('SELECT scope FROM dashboard_leads_lovable');
      console.log('Available scopes:', scopes.rows.map(r => r.scope));
    } else {
      console.log('Data found for "mes_atual". Payload structure keys:');
      const payload = result.rows[0].payload;
      console.log(JSON.stringify(Object.keys(payload), null, 2));
      
      if (payload.leads) {
          console.log('leads keys:', Object.keys(payload.leads));
          if (Array.isArray(payload.leads)) {
              console.log('leads is an Array (Old Format). Length:', payload.leads.length);
          } else {
              console.log('leads is an Object (New Format).');
          }
      }
      
      if (payload.deals) {
          console.log('deals keys:', Object.keys(payload.deals));
      }
    }

  } catch (err) {
    console.error('Database error:', err);
  } finally {
    process.exit();
  }
}

testConnection();
