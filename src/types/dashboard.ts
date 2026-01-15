// Types for the new segmented payload from backend (n8n + Postgres)

// ========== LEAD OBJECT ==========
export interface SegmentedLead {
    id: string;
    nome: string;
    status_codigo: string; // "NEW", "IN_PROCESS", etc - for debug only
    fonte: string; // For source filtering
    motivo_descarte?: string; // Display in Descartados table
    telefone?: string;
    responsavel_nome: string; // Pre-treated, display directly
    criador_nome: string;
    link_bitrix: string;
    link_kinbox?: string;
    uf?: string;
    data_criacao: string; // For Em Atendimento filter
    data_referencia: string; // For Descartados/Convertidos filter
}

// ========== DEAL OBJECT ==========
export interface SegmentedDeal {
    id: string;
    titulo: string;
    valor: number; // For revenue/pipeline calculation
    segmento: 'Varejo' | 'Projeto' | 'Outros' | string;
    fonte: string; // For source filtering
    uf?: string; // For map
    cidade?: string;
    status_nome: string; // "Ganho", "Perdido", "Em Andamento" - display directly
    responsavel_nome: string; // Pre-treated, display directly
    criador_nome: string;
    is_novo: boolean;
    link_bitrix: string;
    link_kinbox?: string;
    data_criacao: string; // For Pipeline/Andamento filter
    data_fechamento?: string; // For Ganhos/Perdidos filter
}

// ========== DEALS BY STATUS ==========
export interface DealsByStatus {
    ganhos: SegmentedDeal[];
    perdidos: SegmentedDeal[];
    andamento: SegmentedDeal[];
}

// ========== SEGMENTED PAYLOAD (Main Structure) ==========
export interface SegmentedPayload {
    leads: {
        em_atendimento: SegmentedLead[];
        descartados: SegmentedLead[];
        convertidos: SegmentedLead[];
    };
    deals: {
        por_segmento: {
            varejo: DealsByStatus;
            projeto: DealsByStatus;
            outros: DealsByStatus;
        };
        por_status: DealsByStatus;
    };
    // NOTE: 'summary' object from backend is ignored - we calculate locally
}

// ========== DATE FILTER ==========
export interface DateFilter {
    startDate: Date | null;
    endDate: Date | null;
}

// ========== CALCULATED METRICS (computed from filtered arrays) ==========
export interface CalculatedMetrics {
    // Lead counts
    totalLeads: number;
    emAtendimentoCount: number;
    descartadosCount: number;
    convertidosCount: number;

    // Financial metrics (from deals.por_status)
    faturamentoTotal: number; // Sum of ganhos.valor
    pipelineTotal: number; // Sum of andamento.valor
    perdidosTotal: number; // Sum of perdidos.valor
    ticketMedio: number; // faturamentoTotal / ganhos.length

    // Deal counts
    totalDealsGanhos: number;
    totalDealsPerdidos: number;
    totalDealsAndamento: number;

    // Source attribution counts
    leadsGoogle: number;
    leadsMeta: number;
    leadsOther: number;
}

// ========== FILTERED DASHBOARD DATA ==========
export interface FilteredDashboardData {
    // Filtered lead arrays
    leads: {
        em_atendimento: SegmentedLead[];
        descartados: SegmentedLead[];
        convertidos: SegmentedLead[];
    };
    // Filtered deal arrays
    deals: {
        por_segmento: {
            varejo: DealsByStatus;
            projeto: DealsByStatus;
            outros: DealsByStatus;
        };
        por_status: DealsByStatus;
    };
    // Calculated metrics from filtered data
    metrics: CalculatedMetrics;
    // Available sources for filter dropdown
    availableSources: string[];
    // Geo Data for Map
    geoData: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>;
    // Marketing Data for Conversion Analysis
    marketingData: {
        google: SegmentedLead[];
        meta: SegmentedLead[];
        other: SegmentedLead[];
        googleVarejo: SegmentedLead[];
        googleProjeto: SegmentedLead[];
    };
}

// ========== LEGACY TYPES (kept for backward compatibility) ==========
// These can be removed once migration is complete

export interface RawLead {
    id: string;
    nome: string;
    status: 'NEW' | 'IN_PROCESS' | 'JUNK' | 'CONVERTED';
    fonte: string;
    motivo_descarte?: string;
    responsavel_id: string;
    criador_id: string;
    link_bitrix: string;
    link_kinbox: string;
    uf?: string;
    data_criacao: string;
    data_modificacao?: string;
    data_referencia_dashboard: string;
}

export interface RawDeal {
    id: string;
    titulo: string;
    valor: number;
    segmento?: string;
    fonte: string;
    uf: string;
    cidade?: string;
    status: string;
    responsavel_id: string;
    criador_id: string;
    is_novo: boolean;
    is_fechado: boolean;
    is_ganho: boolean;
    link_bitrix: string;
    link_kinbox?: string;
    data_criacao: string;
    data_fechamento?: string;
}

export interface DashboardPayload {
    leads: RawLead[];
    deals: RawDeal[];
}
