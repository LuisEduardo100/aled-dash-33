import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    SegmentedPayload,
    SegmentedLead,
    SegmentedDeal,
    DealsByStatus,
    DateFilter,
    FilteredDashboardData,
    CalculatedMetrics,
} from '@/types/dashboard';
import { API_CONFIG } from '@/config/api';

// ========== UTILITY FUNCTIONS ==========

/**
 * Deduplicate array by id to prevent duplicate rows in UI
 */
const deduplicateById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Map<string, T>();
    items.forEach(item => {
        if (!seen.has(item.id)) {
            seen.set(item.id, item);
        }
    });
    return Array.from(seen.values());
};

/**
 * Check if a date string falls within the filter range
 */
const isDateInRange = (dateStr: string | undefined, filter: DateFilter): boolean => {
    // If no filter range is set, show everything
    if (!filter.startDate || !filter.endDate) return true;

    // If filter is set but item has no date, exclude it (strict mode to avoid "inflated" data)
    if (!dateStr) return false;

    const date = new Date(dateStr);
    return date >= filter.startDate && date <= filter.endDate;
};

/**
 * Filter leads by source
 */
const filterBySource = <T extends { fonte: string }>(items: T[], source: string | null): T[] => {
    if (!source || source === 'Todos') return items;
    return items.filter(item => item.fonte === source);
};

/**
 * Filter leads by date using the correct field
 */
const filterLeadsByDate = (
    leads: SegmentedLead[],
    dateFilter: DateFilter,
    useReferenceDate: boolean // true for descartados/convertidos, false for em_atendimento
): SegmentedLead[] => {
    if (!dateFilter.startDate || !dateFilter.endDate) return leads;
    return leads.filter(lead => {
        const dateField = useReferenceDate ? lead.data_referencia : lead.data_criacao;
        return isDateInRange(dateField, dateFilter);
    });
};

/**
 * Filter deals by date using the correct field
 */
const filterDealsByDate = (
    deals: SegmentedDeal[],
    dateFilter: DateFilter,
    useFechamentoDate: boolean // true for ganhos/perdidos, false for andamento
): SegmentedDeal[] => {
    if (!dateFilter.startDate || !dateFilter.endDate) return deals;
    return deals.filter(deal => {
        const dateField = useFechamentoDate ? deal.data_fechamento : deal.data_criacao;
        return isDateInRange(dateField, dateFilter);
    });
};

/**
 * Filter DealsByStatus object (with defensive null checks)
 */
const filterDealsByStatus = (
    deals: DealsByStatus | undefined,
    dateFilter: DateFilter,
    sourceFilter: string | null
): DealsByStatus => {
    const emptyResult = { ganhos: [], perdidos: [], andamento: [] };
    if (!deals) return emptyResult;

    return {
        ganhos: filterBySource(
            filterDealsByDate(deals.ganhos || [], dateFilter, true),
            sourceFilter
        ),
        perdidos: filterBySource(
            filterDealsByDate(deals.perdidos || [], dateFilter, true),
            sourceFilter
        ),
        andamento: filterBySource(
            filterDealsByDate(deals.andamento || [], dateFilter, false),
            sourceFilter
        ),
    };
};

/**
 * Extract all unique sources from the payload (with defensive null checks)
 */
const extractUniqueSources = (payload: SegmentedPayload): string[] => {
    const sources = new Set<string>();

    // From leads (with null checks)
    const allLeads = [
        ...(payload.leads?.em_atendimento || []),
        ...(payload.leads?.descartados || []),
        ...(payload.leads?.convertidos || [])
    ];
    allLeads.forEach(lead => {
        if (lead?.fonte) sources.add(lead.fonte);
    });

    // From deals (with null checks)
    const allDeals = [
        ...(payload.deals?.por_status?.ganhos || []),
        ...(payload.deals?.por_status?.perdidos || []),
        ...(payload.deals?.por_status?.andamento || []),
    ];
    allDeals.forEach(deal => {
        if (deal?.fonte) sources.add(deal.fonte);
    });

    return ['Todos', ...Array.from(sources).sort()];
};

/**
 * Calculate metrics from filtered arrays (with defensive null checks)
 */
const calculateMetrics = (
    leads: SegmentedPayload['leads'],
    dealsByStatus: DealsByStatus
): CalculatedMetrics => {
    const emAtendimento = leads?.em_atendimento || [];
    const descartados = leads?.descartados || [];
    const convertidos = leads?.convertidos || [];
    const ganhos = dealsByStatus?.ganhos || [];
    const perdidos = dealsByStatus?.perdidos || [];
    const andamento = dealsByStatus?.andamento || [];

    const allLeads = [...emAtendimento, ...descartados, ...convertidos];

    // Calculate faturamento (sum of ganhos)
    const faturamentoTotal = ganhos.reduce((sum, d) => sum + (d.valor || 0), 0);
    const pipelineTotal = andamento.reduce((sum, d) => sum + (d.valor || 0), 0);
    const perdidosTotal = perdidos.reduce((sum, d) => sum + (d.valor || 0), 0);

    // Ticket médio
    const ticketMedio = ganhos.length > 0
        ? faturamentoTotal / ganhos.length
        : 0;

    // Source attribution
    const leadsGoogle = allLeads.filter(l =>
        l.fonte?.toLowerCase().includes('google')
    ).length;
    const leadsMeta = allLeads.filter(l =>
        l.fonte?.toLowerCase().includes('instagram') ||
        l.fonte?.toLowerCase().includes('facebook') ||
        l.fonte?.toLowerCase().includes('meta')
    ).length;
    const leadsOther = allLeads.length - leadsGoogle - leadsMeta;

    return {
        totalLeads: allLeads.length,
        emAtendimentoCount: emAtendimento.length,
        descartadosCount: descartados.length,
        convertidosCount: convertidos.length,
        faturamentoTotal,
        pipelineTotal,
        perdidosTotal,
        ticketMedio,
        totalDealsGanhos: ganhos.length,
        totalDealsPerdidos: perdidos.length,
        totalDealsAndamento: andamento.length,
        leadsGoogle,
        leadsMeta,
        leadsOther,
    };
};

// ========== EMPTY STATE ==========
const getEmptyPayload = (): SegmentedPayload => ({
    leads: {
        em_atendimento: [],
        descartados: [],
        convertidos: [],
    },
    deals: {
        por_segmento: {
            varejo: { ganhos: [], perdidos: [], andamento: [] },
            projeto: { ganhos: [], perdidos: [], andamento: [] },
            outros: { ganhos: [], perdidos: [], andamento: [] },
        },
        por_status: { ganhos: [], perdidos: [], andamento: [] },
    },
});

// ========== MAIN HOOK ==========
export const useFilteredDashboard = (
    dateFilter: DateFilter,
    sourceFilter: string | null = null
) => {
    const [rawPayload, setRawPayload] = useState<SegmentedPayload>(getEmptyPayload());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data from backend
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const url = `${API_CONFIG.DASHBOARD_ENDPOINT}/raw`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // Extract payload from response and safely initialize structure
            const emptyDeals = { ganhos: [], perdidos: [], andamento: [] };

            // Start with empty structure
            const payload: SegmentedPayload = getEmptyPayload();

            // Safely merge incoming data
            const incomingPayload = data.payload || data;

            // Leads - handle both old flat array format and new segmented format
            if (incomingPayload.leads) {
                if (Array.isArray(incomingPayload.leads)) {
                    // Old format: flat array - put all in em_atendimento for now
                    payload.leads.em_atendimento = deduplicateById(incomingPayload.leads || []);
                } else {
                    // New format: segmented
                    payload.leads.em_atendimento = deduplicateById(incomingPayload.leads.em_atendimento || []);
                    payload.leads.descartados = deduplicateById(incomingPayload.leads.descartados || []);
                    payload.leads.convertidos = deduplicateById(incomingPayload.leads.convertidos || []);
                }
            }

            // Deals - handle both old flat array format and new segmented format
            if (incomingPayload.deals) {
                if (Array.isArray(incomingPayload.deals)) {
                    // Old format: flat array - put all in por_status.andamento for now
                    payload.deals.por_status.andamento = deduplicateById(incomingPayload.deals || []);
                } else {
                    // New format: segmented
                    if (incomingPayload.deals.por_status) {
                        const rawGanhos = incomingPayload.deals.por_status.ganhos as SegmentedDeal[] || [];
                        const rawPerdidos = incomingPayload.deals.por_status.perdidos as SegmentedDeal[] || [];
                        const rawAndamento = incomingPayload.deals.por_status.andamento as SegmentedDeal[] || [];

                        payload.deals.por_status.ganhos = deduplicateById(rawGanhos);
                        payload.deals.por_status.perdidos = deduplicateById(rawPerdidos);
                        payload.deals.por_status.andamento = deduplicateById(rawAndamento).filter(d => {
                            // Strict safety check for Main Pipeline
                            const status = d.status_nome?.toLowerCase() || '';
                            return !status.includes('ganho') &&
                                !status.includes('won') &&
                                !status.includes('perdido') &&
                                !status.includes('lost') &&
                                !status.includes('concluí');
                        });
                    }

                    if (incomingPayload.deals.por_segmento) {
                        const segments = ['varejo', 'projeto', 'outros'] as const;
                        segments.forEach(seg => {
                            if (incomingPayload.deals.por_segmento[seg]) {
                                const segGanhos = incomingPayload.deals.por_segmento[seg].ganhos as SegmentedDeal[] || [];
                                const segPerdidos = incomingPayload.deals.por_segmento[seg].perdidos as SegmentedDeal[] || [];
                                const segAndamento = incomingPayload.deals.por_segmento[seg].andamento as SegmentedDeal[] || [];

                                payload.deals.por_segmento[seg] = {
                                    ganhos: deduplicateById(segGanhos),
                                    perdidos: deduplicateById(segPerdidos),
                                    andamento: deduplicateById(segAndamento).filter(d => {
                                        // Strict safety check: Ensure no Won/Lost deals are in Andamento
                                        const status = d.status_nome?.toLowerCase() || '';
                                        return !status.includes('ganho') &&
                                            !status.includes('won') &&
                                            !status.includes('perdido') &&
                                            !status.includes('lost') &&
                                            !status.includes('concluí');
                                    }),
                                };
                            }
                        });
                    }
                }
            }

            setRawPayload(payload);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Apply filters and calculate metrics
    const filteredData: FilteredDashboardData = useMemo(() => {
        // Filter leads
        const filteredLeads = {
            em_atendimento: filterBySource(
                filterLeadsByDate(rawPayload.leads.em_atendimento, dateFilter, false),
                sourceFilter
            ),
            descartados: filterBySource(
                filterLeadsByDate(rawPayload.leads.descartados, dateFilter, true),
                sourceFilter
            ),
            convertidos: filterBySource(
                filterLeadsByDate(rawPayload.leads.convertidos, dateFilter, true),
                sourceFilter
            ),
        };

        // Filter deals by status
        const filteredDealsByStatus = filterDealsByStatus(
            rawPayload.deals.por_status,
            dateFilter,
            sourceFilter
        );

        // Filter deals by segment
        const filteredDealsBySegmento = {
            varejo: filterDealsByStatus(
                rawPayload.deals.por_segmento?.varejo || { ganhos: [], perdidos: [], andamento: [] },
                dateFilter,
                sourceFilter
            ),
            projeto: filterDealsByStatus(
                rawPayload.deals.por_segmento?.projeto || { ganhos: [], perdidos: [], andamento: [] },
                dateFilter,
                sourceFilter
            ),
            outros: filterDealsByStatus(
                rawPayload.deals.por_segmento?.outros || { ganhos: [], perdidos: [], andamento: [] },
                dateFilter,
                sourceFilter
            ),
        };

        // Calculate metrics from filtered data
        const metrics = calculateMetrics(filteredLeads, filteredDealsByStatus);

        // Calculate Geo Data for Map
        const geoData: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }> = {};
        const allConvertedLeads = filteredLeads.convertidos;

        allConvertedLeads.forEach(lead => {
            const uf = lead.uf || 'N/A';
            if (!geoData[uf]) {
                geoData[uf] = { total: 0, sources: {}, leads: [] };
            }
            geoData[uf].total++;
            geoData[uf].leads.push(lead); // Now pushing SegmentedLead

            const source = lead.fonte || 'Desconhecido';
            geoData[uf].sources[source] = (geoData[uf].sources[source] || 0) + 1;
        });

        // Calculate Marketing Data for Conversion Analysis
        const googleLeads = allConvertedLeads.filter(l => l.fonte?.toLowerCase().includes('google'));
        const metaLeads = allConvertedLeads.filter(l =>
            l.fonte?.toLowerCase().includes('instagram') ||
            l.fonte?.toLowerCase().includes('facebook') ||
            l.fonte?.toLowerCase().includes('meta')
        );
        const otherLeads = allConvertedLeads.filter(l =>
            !l.fonte?.toLowerCase().includes('google') &&
            !l.fonte?.toLowerCase().includes('instagram') &&
            !l.fonte?.toLowerCase().includes('facebook') &&
            !l.fonte?.toLowerCase().includes('meta')
        );

        // Google breakdown by resulting deal segment (approximate matching)
        // Since leads don't have segment directly, we might need to cross-reference with deals keying by ID or similar
        // BUT current structure has SegmentedPayload separate. 
        // For now, allow empty arrays or basic approximation if lead has 'segmento' prop? 
        // The prompt said "ignore grouping logic". 
        // We'll filter Google leads by some logic if available, or just pass all.
        // Actually, let's just pass empty for specific segment breakdown if we can't link them easily yet.
        // Wait, SegmentedLead doesn't have 'segmento'. 
        // We will assume all for now to avoid errors.
        const googleVarejo = googleLeads;
        const googleProjeto = [];

        // Get available sources from raw (unfiltered) payload
        const availableSources = extractUniqueSources(rawPayload);
        const sourceArrays = availableSources; // Assuming sourceArrays is just a rename or copy of availableSources

        return {
            leads: filteredLeads,
            deals: {
                por_segmento: filteredDealsBySegmento,
                por_status: filteredDealsByStatus,
            },
            metrics,
            availableSources,
            geoData,
            marketingData: {
                google: googleLeads,
                meta: metaLeads,
                other: otherLeads,
                googleVarejo,
                googleProjeto
            }
        };
    }, [rawPayload, dateFilter, sourceFilter]);

    return {
        ...filteredData,
        isLoading,
        error,
        refetch: fetchData,
    };
};

export default useFilteredDashboard;
