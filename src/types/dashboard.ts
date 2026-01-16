// Types for the new segmented payload from backend (n8n + Postgres)

// ========== LEAD OBJECT ==========
export interface SegmentedLead {
    id: string;
    nome: string;
    status_codigo: string; // "NEW", "IN_PROCESS", etc - for debug only
    // For source filtering
    fonte: string;
    regional?: string; // New: Regional filter (e.g., "Regional CE")
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
    regional?: string; // New: Regional filter
    uf?: string; // For map
    cidade?: string;
    status_nome: string; // "Ganho", "Perdido", "Em Andamento" - display directly
    motivo_perda?: string; // New: For Lost Deals analysis
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
    // ... existing lead/deal arrays ...
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
    metrics: CalculatedMetrics;
    availableSources: string[];
    availableUfs: string[];
    availableRegionals: string[]; // New: Available Regional options
    geoData: {
        leads: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>;
        converted: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>;
    };
    marketingData: {
        google: SegmentedLead[];
        meta: SegmentedLead[];
        indicacaoAmigo: SegmentedLead[];
        profissional: SegmentedLead[];
        ltv: SegmentedLead[];
        other: SegmentedLead[];
        googleVarejo: SegmentedDeal[];
        googleProjeto: SegmentedDeal[];
        metaVarejo: SegmentedDeal[];
        metaProjeto: SegmentedDeal[];
    };
    leadsTimeline: { date: string; count: number }[];
    convertedBreakdown: {
        varejo: number;
        projeto: number;
        varejoSources: { name: string; value: number }[];
        projetoSources: { name: string; value: number }[];
    };
    discardReasons: { name: string; value: number }[];
    dealLossReasons: { name: string; value: number }[]; // New: Reasons for lost deals
    monthlyGoal: MonthlyGoalMetrics; // New: Goal section data
}

export interface MonthlyGoalMetrics {
    current: number;
    target: number;
    progress: number;
    projection: number;
    pace: number;
    isGoalMet: boolean;
    workingDays: {
        elapsed: number;
        total: number;
        remaining: number;
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
