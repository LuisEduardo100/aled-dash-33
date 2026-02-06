const db = require('./db');
const bitrixService = require('./bitrixService');

const syncDealsFromBitrix = async () => {
    console.log('[Sync] Starting Sync: Created Deals from Bitrix...');
    try {
        const rawDeals = await bitrixService.fetchDealsFromBitrix();
        const processedDeals = bitrixService.processDeals(rawDeals);

        console.log(`[Sync] Processing ${processedDeals.length} deals to DB...`);

        // Use transaction for safety
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Bulk Insert / Upsert
            // For 50+ items, doing one by one is slow but acceptable for background hourly tasks.
            // Or we can construct a bulk query. 
            // Given the complexity of upsert, let's do a prepared statement loop which is safer/easier to read.

            const queryText = `
                INSERT INTO cached_created_deals (
                    id, titulo, valor, segmento, fonte, uf, regional, motivo_perda,
                    cidade, telefone, status_codigo, status_nome, responsavel_nome,
                    criador_nome, funil, funil_id, is_novo, is_fechado, is_ganho,
                    link_bitrix, link_kinbox, data_criacao, data_fechamento, id_lead,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8,
                    $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19,
                    $20, $21, $22, $23, $24,
                    NOW()
                )
                ON CONFLICT (id) DO UPDATE SET
                    titulo = EXCLUDED.titulo,
                    valor = EXCLUDED.valor,
                    segmento = EXCLUDED.segmento,
                    fonte = EXCLUDED.fonte,
                    uf = EXCLUDED.uf,
                    regional = EXCLUDED.regional,
                    motivo_perda = EXCLUDED.motivo_perda,
                    cidade = EXCLUDED.cidade,
                    telefone = EXCLUDED.telefone,
                    status_codigo = EXCLUDED.status_codigo,
                    status_nome = EXCLUDED.status_nome,
                    responsavel_nome = EXCLUDED.responsavel_nome,
                    criador_nome = EXCLUDED.criador_nome,
                    funil = EXCLUDED.funil,
                    funil_id = EXCLUDED.funil_id,
                    is_novo = EXCLUDED.is_novo,
                    is_fechado = EXCLUDED.is_fechado,
                    is_ganho = EXCLUDED.is_ganho,
                    link_bitrix = EXCLUDED.link_bitrix,
                    link_kinbox = EXCLUDED.link_kinbox,
                    data_criacao = EXCLUDED.data_criacao,
                    data_fechamento = EXCLUDED.data_fechamento,
                    id_lead = EXCLUDED.id_lead,
                    updated_at = NOW();
            `;

            for (const deal of processedDeals) {
                await client.query(queryText, [
                    deal.id, deal.titulo, deal.valor, deal.segmento, deal.fonte, deal.uf, deal.regional, deal.motivo_perda,
                    deal.cidade, deal.telefone, deal.status_codigo, deal.status_nome, deal.responsavel_nome,
                    deal.criador_nome, deal.funil, deal.funil_id, deal.is_novo, deal.is_fechado, deal.is_ganho,
                    deal.link_bitrix, deal.link_kinbox, deal.data_criacao, deal.data_fechamento, deal.id_lead
                ]);
            }

            await client.query('COMMIT');
            console.log('[Sync] Success! Database updated.');
            return { success: true, count: processedDeals.length };

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('[Sync] Error:', error);
        return { success: false, error: error.message };
    }
};

const getCachedDeals = async (limit = 5000) => {
    try {
        const res = await db.query(
            `SELECT * FROM cached_created_deals ORDER BY data_criacao DESC LIMIT $1`, 
            [limit]
        );
        return res.rows;
    } catch (error) {
        console.error('Error fetching cached deals:', error);
        throw error;
    }
};

module.exports = {
    syncDealsFromBitrix,
    getCachedDeals
};
