const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
if (!process.env.BITRIX_WEBHOOK_URL) {
    require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

// ============================================================
// 1. MAPEAMENTOS E DICIONÁRIOS
// ============================================================
const MAPA_FONTES = {
    "UC_JKGTUC": "Prospecção", "WEBFORM": "Google", "CALLBACK": "Instagram",
    "STORE": "Indicação Amigo", "RC_GENERATOR": "Indicação Profissional",
    "CALL": "CFA", "UC_H0VN85": "Youtube", "UC_F445HA": "Vitrine/Carro", 
    "UC_8OOM1P": "Encarte/Outdoor", "UC_GG87LP": "Eventos", "UC_HCJB1D": "Facebook",
    "UC_N35K7E": "Ativação Relac.", "REPEAT_SALE": "Corporativo", "UC_Y1DNMP": "Site",
    "Google": "Google", "Facebook": "Facebook", "Instagram": "Instagram", 
    "Indicação": "Indicação Amigo", "WEB": "Site",
    "UC_JNSE1L": "LTV", "UC_6F33AS": "Busca orgânica"
};

const MAPA_ESTADOS = {
    "18493": "AC", "18441": "AL", "18443": "AP", "18445": "AM", "18447": "BA", "18449": "CE", "18451": "DF", "18453": "ES", "18455": "GO", "18457": "MA", "18459": "MT", "18461": "MS", "18463": "MG", "18465": "PA", "18467": "PB", "18469": "PR", "18471": "PE", "18473": "PI", "18475": "RJ", "18477": "RN", "18479": "RS", "18481": "RO", "18483": "RR", "18485": "SC", "18487": "SP", "18489": "SE", "18491": "TO"
};

const MAPA_VENDEDORES = {
    "2870": "Atlas Ataike", "286": "Victor Jorge", "70": "Raquel Freitas",
    "364": "Paulo César", "254": "Samuel Souza", "190": "Mateus Martins",
    "2603": "Jucelino Júnior", "2647": "Nethison Rocha", "52": "Yuri Queiroz", 
    "166": "Matheus Freitas", "100": "Renato Campos", "2258": "Aderúcia Pereira", 
    "2884": "Jean Souza", "2860": "Janderson Guerra", "2872": "Clara Iven", "2767": "Isabela Silva",
    "2593": "Gabriela Lima", "2581": "Amanda Gomes", "2415": "Ana Flavia", "2888":"Vanessa Nascimento", "2876": "Juan Yuri"
};

const MAPA_MOTIVO_PERDA_DEAL = {
    "49438": "Preço ou Condição de Pagamento",
    "49440": "Fechou com Concorrente",
    "49442": "Mix de Produtos (Não Trabalhamos)",
    "49444": "Estoque ou Prazo de Entrega",
    "49446": "Sem Contato com Decisor",
    "49448": "Cliente Sumiu (Sem Retorno)",
    "49450": "Projeto Adiado / Desistência",
    "49452": "Demora no Nosso Atendimento"
};

const ESTADOS_NE = ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"];

const MAPA_CATEGORY_ID = {
  "8": "[Inside] Negociações SMB",
  "221": "[Lojas] Lumentech",
  "126": "Sala Técnica",
  "134": "[Orçamentos] Varejo",
  "306": "[Lojas] Barão",
  "304": "[Corporativo] Negociações"
};

// Funnels to fetch
const TARGET_FUNNELS = ["304", "8", "306"];

// IDs for Segment classification
const IDS_VAREJO = ["18175", "44163"]; 
const IDS_PROJETO = ["18177", "18561", "18935"]; 

// Keys Bitrix
const KEY_TIPO = "UF_CRM_1708526262705";
const KEY_ESTADO = "UF_CRM_1709557737403";
const KEY_CIDADE = "UF_CRM_1709557885970";
const KEY_LINK_KINBOX_DEAL = "UF_CRM_690B56170F2F9";
const KEY_TELEFONE_DEAL = "UF_CRM_1731350457664";
const KEY_ID_LEAD_ORIGEM = "UF_CRM_1763990651471";
const KEY_MOTIVO_PERDA_DEAL = "UF_CRM_1709985139188";

// ============================================================
// 2. HELPERS
// ============================================================
const tratarFonte = (src) => MAPA_FONTES[src] || src || "Direto";
const tratarVendedor = (id) => MAPA_VENDEDORES[id] || `ID ${id}`;

const normalizarIdBitrix = (valor) => {
    if (Array.isArray(valor)) return String(valor[0] || "");
    return String(valor || "");
};

// Adds 4 hours to compensate time zone
const normalizarDataFuso = (dataIso) => {
    if (!dataIso) return null;
    const d = new Date(dataIso);
    // d.setHours(d.getHours() + 4); // User logic requested this, keep consistent
    // Actually, storing in DB as TIMESTAMPTZ might be better as ISO without manual offset
    // BUT the user specifically asked for this logic from n8n.
    // However, for correct DB storage, usually we store UTC or true ISO. 
    // If we shift it here, we shift "truth".
    // Let's stick to true ISO for storage, but maybe the user wants the display logic?
    // The user said: "A lógica é você trazer tudo do bitrix, salvar os dados tratados"
    // So let's apply the treatment.
    d.setHours(d.getHours() + 4);
    return d.toISOString();
};

const definingRegional = (uf) => {
    if (!uf || uf === "N/I") return "N/I";
    if (uf === 'CE') return 'Regional CE';
    if (uf === 'PI') return 'Regional PI';
    if (uf === 'SP') return 'Regional SP';
    if (ESTADOS_NE.includes(uf)) return 'Regional NE';
    return 'Regional BR'; 
};

const tratarStatusDeal = (deal) => {
    const fechado = deal.CLOSED === 'Y';
    const stageId = String(deal.STAGE_ID || "").toUpperCase();
    
    if (stageId.includes("WON")) return "Ganho";
    if (stageId.includes("LOSE") || stageId.includes("LOST")) return "Perdido";
    if (fechado) return "Perdido"; 
    
    return "Em Andamento";
};

// ============================================================
// 3. API FETCHING
// ============================================================
async function fetchDealsFromBitrix() {
    const url = process.env.BITRIX_WEBHOOK_URL + "crm.deal.list";
    let allDeals = [];
    let start = 0;
    let hasMore = true;

    // Filter for our specific Categories
    // We might need to do multiple requests or one complex filter.
    // Bitrix API filter: { "CATEGORY_ID": [8, 304, 306] } usually works
    
    console.log(`Starting Bitrix Fetch for funnels: ${TARGET_FUNNELS.join(', ')}`);

    while (hasMore) {
        try {
            const body = {
                start: start,
                filter: {
                    "CATEGORY_ID": TARGET_FUNNELS
                },
                select: [
                    "ID", "TITLE", "OPPORTUNITY", "STAGE_ID", "CATEGORY_ID",
                    "DATE_CREATE", "CLOSEDATE", "CLOSED", "BEGINDATE",
                    "ASSIGNED_BY_ID", "CREATED_BY_ID", "SOURCE_ID",
                    KEY_TIPO, KEY_ESTADO, KEY_CIDADE, KEY_LINK_KINBOX_DEAL,
                    KEY_TELEFONE_DEAL, KEY_ID_LEAD_ORIGEM, KEY_MOTIVO_PERDA_DEAL
                ]
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Bitrix API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const deals = data.result || [];
            allDeals = allDeals.concat(deals);

            if (data.next) {
                start = data.next;
                // Safety delay to respect rate limits
                await new Promise(r => setTimeout(r, 200)); 
            } else {
                hasMore = false;
            }

            console.log(`Fetched ${allDeals.length} deals so far...`);

        } catch (error) {
            console.error("Error fetching Bitrix deals:", error);
            hasMore = false; 
            // In a robust system we might retry or partial fail
        }
    }

    return allDeals;
}

function processDeals(rawDeals) {
    return rawDeals.map(d => {
        const rawTipo = d[KEY_TIPO];
        const tipoId = normalizarIdBitrix(rawTipo);
        
        let segmento = "Outros";
        if (IDS_PROJETO.includes(tipoId)) segmento = "Projeto";
        else if (IDS_VAREJO.includes(tipoId)) segmento = "Varejo";

        const statusLegivel = tratarStatusDeal(d);
        const responsavel = tratarVendedor(d.ASSIGNED_BY_ID);
        
        const uf = MAPA_ESTADOS[d[KEY_ESTADO]] || "N/I";
        const regional = definingRegional(uf);

        const rawMotivo = normalizarIdBitrix(d[KEY_MOTIVO_PERDA_DEAL]);
        const motivoPerda = MAPA_MOTIVO_PERDA_DEAL[rawMotivo] || "N/I";

        const catId = String(d.CATEGORY_ID || "");
        const nomeCategoria = MAPA_CATEGORY_ID[catId] || catId;

        let dataReferenciaDeal;
        if (d.CLOSED === 'Y') {
            dataReferenciaDeal = d.CLOSEDATE || d.DATE_CREATE;
        } else {
            dataReferenciaDeal = d.DATE_CREATE;
        }

        return {
            id: d.ID,
            titulo: d.TITLE,
            valor: parseFloat(d.OPPORTUNITY) || 0,
            segmento: segmento,
            fonte: tratarFonte(d.SOURCE_ID),
            uf: uf,
            regional: regional,
            motivo_perda: motivoPerda,
            cidade: d[KEY_CIDADE] || "N/I",
            telefone: d[KEY_TELEFONE_DEAL] || "N/I",
            status_codigo: d.STAGE_ID,
            status_nome: statusLegivel,
            responsavel_nome: responsavel,
            criador_nome: tratarVendedor(d.CREATED_BY_ID),
            funil: nomeCategoria,
            funil_id: catId,
            is_novo: d.IS_NEW === 'Y',
            is_fechado: d.CLOSED === 'Y',
            is_ganho: statusLegivel === "Ganho",
            link_bitrix: `https://atacadaoled.bitrix24.com.br/crm/deal/details/${d.ID}/`,
            link_kinbox: d[KEY_LINK_KINBOX_DEAL] || "#",
            data_criacao: normalizarDataFuso(d.DATE_CREATE),
            data_fechamento: normalizarDataFuso(dataReferenciaDeal),
            id_lead: d[KEY_ID_LEAD_ORIGEM] || null
        };
    });
}

module.exports = {
    fetchDealsFromBitrix,
    processDeals
};
