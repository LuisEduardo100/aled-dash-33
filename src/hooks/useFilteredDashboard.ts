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
 * Filter leads by UF
 */
// ... utility functions ...

const filterByUf = <T extends { uf?: string }>(items: T[], uf: string | null): T[] => {
    if (!uf || uf === 'Todos') return items;
    return items.filter(item => (item.uf || 'N/A') === uf);
};

const filterByRegional = <T extends { regional?: string }>(items: T[], regional: string | null): T[] => {
    if (!regional || regional === 'Todos') return items;
    return items.filter(item => (item.regional || 'N/A') === regional);
};

const filterByFunnel = <T extends { id: string }>(items: T[], allowedIds: Set<string> | null): T[] => {
    if (!allowedIds) return items;
    return items.filter(item => allowedIds.has(item.id));
};

const filterStatusObjByFunnel = (statusObj: DealsByStatus, allowedIds: Set<string> | null): DealsByStatus => {
    return {
        ganhos: filterByFunnel(statusObj.ganhos, allowedIds),
        perdidos: filterByFunnel(statusObj.perdidos, allowedIds),
        andamento: filterByFunnel(statusObj.andamento, allowedIds),
    };
};

const filterLeadsByDate = (leads: SegmentedLead[] | undefined, filter: DateFilter, strict: boolean): SegmentedLead[] => {
    if (!leads) return [];
    if (!filter.startDate || !filter.endDate) return leads;
    return leads.filter(item => isDateInRange(item.data_criacao, filter));
};

const filterDealsByDate = (deals: SegmentedDeal[] | undefined, filter: DateFilter, strict: boolean): SegmentedDeal[] => {
    if (!deals) return [];
    if (!filter.startDate || !filter.endDate) return deals;

    return deals.filter(item => {
        // Use closing date for closed deals if available
        if (item.data_fechamento && (item.status_nome === 'Ganho' || item.status_nome === 'Perdido')) {
            return isDateInRange(item.data_fechamento, filter);
        }
        // Fallback to creation date
        return isDateInRange(item.data_criacao, filter);
    });
};

const calculateMetrics = (leads: { em_atendimento: SegmentedLead[], descartados: SegmentedLead[], convertidos: SegmentedLead[] }, deals: DealsByStatus): CalculatedMetrics => {
    const totalLeads = leads.em_atendimento.length + leads.descartados.length + leads.convertidos.length;

    const faturamentoTotal = deals.ganhos.reduce((acc, d) => acc + (d.valor || 0), 0);
    const pipelineTotal = deals.andamento.reduce((acc, d) => acc + (d.valor || 0), 0);
    const perdidosTotal = deals.perdidos.reduce((acc, d) => acc + (d.valor || 0), 0);

    const ticketMedio = deals.ganhos.length > 0 ? faturamentoTotal / deals.ganhos.length : 0;

    // Calculate source counts
    const allLeads = [...leads.em_atendimento, ...leads.descartados, ...leads.convertidos];
    const google = allLeads.filter(l => l.fonte && l.fonte.toLowerCase().includes('google')).length;
    const meta = allLeads.filter(l => l.fonte && (l.fonte.toLowerCase().includes('facebook') || l.fonte.toLowerCase().includes('instagram'))).length;
    const other = totalLeads - google - meta;

    return {
        totalLeads,
        emAtendimentoCount: leads.em_atendimento.length,
        descartadosCount: leads.descartados.length,
        convertidosCount: leads.convertidos.length,
        faturamentoTotal,
        pipelineTotal,
        perdidosTotal,
        ticketMedio,
        totalDealsGanhos: deals.ganhos.length,
        totalDealsPerdidos: deals.perdidos.length,
        totalDealsAndamento: deals.andamento.length,
        leadsGoogle: google,
        leadsMeta: meta,
        leadsOther: other
    };
};

// ... date filters ...

const filterDealsByStatus = (
    deals: DealsByStatus | undefined,
    dateFilter: DateFilter,
    sourceFilter: string | null,
    ufFilter: string | null,
    regionalFilter: string | null // NEW
): DealsByStatus => {
    const emptyResult = { ganhos: [], perdidos: [], andamento: [] };
    if (!deals) return emptyResult;

    return {
        ganhos: filterByRegional(filterByUf(filterBySource(
            filterDealsByDate(deals.ganhos || [], dateFilter, true),
            sourceFilter
        ), ufFilter), regionalFilter),
        perdidos: filterByRegional(filterByUf(filterBySource(
            filterDealsByDate(deals.perdidos || [], dateFilter, true),
            sourceFilter
        ), ufFilter), regionalFilter),
        andamento: filterByRegional(filterByUf(filterBySource(
            filterDealsByDate(deals.andamento || [], dateFilter, false),
            sourceFilter
        ), ufFilter), regionalFilter),
    };
};

// Start of Monthly Goal Logic
import { getDaysInMonth, isSunday, isSaturday, startOfMonth, endOfMonth, eachDayOfInterval, differenceInBusinessDays, isAfter, isSameMonth } from 'date-fns';

const calculateGoalMetrics = (payload: SegmentedPayload) => {
    const META_TOTAL = 200;
    const now = new Date();

    // 1. Filter TARGET DEALS (Scope: Current Month)
    // We utilize DEALS because Leads (pre-conversion) do not consistently have segment info.
    // We look at 'Projeto' segment deals.
    const projectDeals = payload.deals?.por_segmento?.projeto;

    if (!projectDeals) {
        return {
            current: 0,
            target: META_TOTAL,
            progress: 0,
            projection: 0,
            pace: 0,
            isGoalMet: false,
            workingDays: { elapsed: 0, total: 1, remaining: 1 }
        };
    }

    const allProjectDeals = [
        ...(projectDeals.ganhos || []),
        ...(projectDeals.perdidos || []),
        ...(projectDeals.andamento || [])
    ];

    // Filter by Source (Google/Meta) AND Date (Current Month Creation)
    const validSources = ['google ads', 'meta ads', 'facebook ads', 'instagram ads', 'google', 'instagram', 'facebook'];

    const relevantDeals = deduplicateById(allProjectDeals).filter(d => {
        // Source Check
        const source = (d.fonte || '').toLowerCase();
        const isSourceValid = validSources.some(s => source.includes(s));

        // Date Check (Safety: Ensure it is actually from this month if payload has more)
        const created = new Date(d.data_criacao);
        const isCurrentMonth = isSameMonth(created, now);

        return isSourceValid && isCurrentMonth;
    });

    const currentCount = relevantDeals.length;

    // 2. Calculate Working Days (Mon-Fri)
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const daysInMonth = eachDayOfInterval({ start, end });

    const isWorkingDay = (d: Date) => !isSunday(d) && !isSaturday(d);

    // Count total working days in month (excluding Sat/Sun)
    const totalWorkingDays = daysInMonth.filter(isWorkingDay).length;

    // Count elapsed working days (up to today)
    const elapsedWorkingDays = daysInMonth.filter(d => isWorkingDay(d) && !isAfter(d, now)).length;

    // Count remaining working days
    const remainingWorkingDays = totalWorkingDays - elapsedWorkingDays;

    // 3. Formulas
    const progress = Math.min(100, (currentCount / META_TOTAL) * 100);

    // Run Rate (Projection): (Current / Elapsed) * Total
    const projection = elapsedWorkingDays > 0
        ? Math.round((currentCount / elapsedWorkingDays) * totalWorkingDays)
        : 0;

    // Daily Pace (Required): (Target - Current) / Remaining
    const leadsNeeded = Math.max(0, META_TOTAL - currentCount);
    const pace = remainingWorkingDays > 0
        ? Math.ceil(leadsNeeded / remainingWorkingDays)
        : leadsNeeded;

    return {
        current: currentCount,
        target: META_TOTAL,
        progress,
        projection,
        pace,
        isGoalMet: currentCount >= META_TOTAL,
        workingDays: { elapsed: elapsedWorkingDays, total: totalWorkingDays, remaining: remainingWorkingDays }
    };
};

const getEmptyPayload = (): SegmentedPayload => ({
    leads: { em_atendimento: [], descartados: [], convertidos: [] },
    deals: {
        por_segmento: {
            varejo: { ganhos: [], perdidos: [], andamento: [] },
            projeto: { ganhos: [], perdidos: [], andamento: [] },
            outros: { ganhos: [], perdidos: [], andamento: [] },
        },
        por_status: { ganhos: [], perdidos: [], andamento: [] },
    },
});

const extractUniqueSources = (payload: SegmentedPayload): string[] => {
    const sources = new Set<string>();
    const gather = (list: any[]) => list?.forEach(i => { if (i.fonte) sources.add(i.fonte); });

    gather(payload.leads?.em_atendimento);
    gather(payload.leads?.descartados);
    gather(payload.leads?.convertidos);

    gather(payload.deals?.por_status?.ganhos);
    gather(payload.deals?.por_status?.perdidos);
    gather(payload.deals?.por_status?.andamento);

    return ['Todos', ...Array.from(sources).sort()];
};

const extractUniqueUfs = (payload: SegmentedPayload): string[] => {
    const ufs = new Set<string>();
    const gather = (list: any[]) => list?.forEach(i => { if (i.uf) ufs.add(i.uf); });

    gather(payload.leads?.em_atendimento);
    gather(payload.leads?.descartados);
    gather(payload.leads?.convertidos);

    gather(payload.deals?.por_status?.ganhos);
    gather(payload.deals?.por_status?.perdidos);
    gather(payload.deals?.por_status?.andamento);

    return ['Todos', ...Array.from(ufs).sort()];
};

const extractUniqueRegionals = (payload: SegmentedPayload): string[] => {
    const regionals = new Set<string>();
    const gather = (list: any[]) => list?.forEach(i => { if (i.regional) regionals.add(i.regional); });

    gather(payload.leads?.em_atendimento);
    gather(payload.leads?.descartados);
    gather(payload.leads?.convertidos);

    gather(payload.deals?.por_status?.ganhos);
    gather(payload.deals?.por_status?.perdidos);
    gather(payload.deals?.por_status?.andamento);

    return ['Todos', ...Array.from(regionals).sort()];
}

const extractUniqueFunnels = (payload: SegmentedPayload): string[] => {
    const funnels = new Set<string>();
    const gather = (list: any[]) => list?.forEach(i => { if (i.funil) funnels.add(i.funil); });

    // Gather from por_status which should contain all deals
    if (payload.deals?.por_status) {
        gather(payload.deals.por_status.ganhos);
        gather(payload.deals.por_status.perdidos);
        gather(payload.deals.por_status.andamento);
    }

    return ['Todos', ...Array.from(funnels).sort()];
};

// ... calculateMetrics ...

// ========== MAIN HOOK ==========
export const useFilteredDashboard = (
    dateFilter: DateFilter,
    sourceFilter: string | null = null,
    ufFilter: string | null = null,
    regionalFilter: string | null = null,
    funnelFilter: string | null = null // NEW
) => {
    // ... fetchData logic (same) ...

    const [rawPayload, setRawPayload] = useState<SegmentedPayload>(getEmptyPayload());
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false); // New state for sync
    const [error, setError] = useState<string | null>(null);

    // Fetch data from backend
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let data;
            
            if (API_CONFIG.USE_MOCK_DATA) {
                console.log('Using Mock Data for Dashboard');
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Import mock data dynamically or use imported
                const { mockLeads, mockDeals } = await import('@/data/mockData');
                
                // Segment Mock Deals logic
                const mockGanhos = mockDeals.filter(d => d.stage_id?.includes('WON'));
                const mockPerdidos = mockDeals.filter(d => d.stage_id?.includes('LOSE') || d.stage_id?.includes('LOST'));
                const mockAndamento = mockDeals.filter(d => !d.stage_id?.includes('WON') && !d.stage_id?.includes('LOSE') && !d.stage_id?.includes('LOST'));

                data = {
                    payload: {
                        leads: mockLeads, // Array, will be handled by "if Array" logic below
                        deals: {
                            por_status: {
                                ganhos: mockGanhos,
                                perdidos: mockPerdidos,
                                andamento: mockAndamento
                            },
                            // Optional: replicate segment structure if needed, but por_status is primary for totals
                            por_segmento: {
                                varejo: {
                                    ganhos: mockGanhos.filter(d => d.category_id === '8'),
                                    perdidos: mockPerdidos.filter(d => d.category_id === '8'),
                                    andamento: mockAndamento.filter(d => d.category_id === '8')
                                },
                                projeto: {
                                    ganhos: mockGanhos.filter(d => d.category_id === '126' || d.category_id === '134'),
                                    perdidos: mockPerdidos.filter(d => d.category_id === '126' || d.category_id === '134'),
                                    andamento: mockAndamento.filter(d => d.category_id === '126' || d.category_id === '134')
                                },
                                outros: {
                                    ganhos: [], perdidos: [], andamento: []
                                }
                            }
                        }
                    }
                };
            } else {
                const url = `${API_CONFIG.DASHBOARD_ENDPOINT}/raw`;
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status}`);
                }

                data = await response.json();
            }

            // Extract payload from response and safely initialize structure
            const emptyDealStatus = { ganhos: [], perdidos: [], andamento: [] };

            // Start with empty structure
            const payload: SegmentedPayload = getEmptyPayload();

            // Safely merge incoming data
            const incomingPayload = data.payload || data;

            // ... (keeping existing logic for leads/deals extraction same as viewed) ...
            // Re-pasting the extraction logic to ensure continuity

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

    // Trigger Sync via Backend Proxy
    const syncData = useCallback(async () => {
        setIsSyncing(true);
        // Don't clear current data/error, just show syncing state
        try {
            // Using a relative path which will be proxied or hit the same domain server
            // Adjust base URL if API_CONFIG.BASE_URL is different from where /api/sync lives
            // Assuming API_CONFIG.DASHBOARD_ENDPOINT is like 'http://localhost:3000/api/dashboard'
            // We want 'http://localhost:3000/api/sync'
            // Let's construct it safely or hardcode relative '/api/sync' if on same origin

            const baseUrl = API_CONFIG.DASHBOARD_ENDPOINT.replace('/dashboard', '');
            const url = `${baseUrl}/sync`;

            const response = await fetch(url, { method: 'POST' });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.details || `Sync failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('Sync success:', result);

            // After sync success, refetch data
            await fetchData();

        } catch (err) {
            console.error('Sync error:', err);
            // Optionally set a toast or temporary error, but maybe not block the dashboard
            alert('Erro ao sincronizar dados: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
        } finally {
            setIsSyncing(false);
        }
    }, [fetchData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Apply filters and calculate metrics
    const filteredData: FilteredDashboardData = useMemo(() => {
        // Calculate allowed IDs for Funnel Filter
        let allowedDealIds: Set<string> | null = null;
        if (funnelFilter && funnelFilter !== 'Todos') {
            allowedDealIds = new Set<string>();
            
            const gatherIds = (list: SegmentedDeal[]) => list.forEach(d => {
                // Loose comparison to catch whitespace or case issues
                if (d.funil && d.funil.trim() === funnelFilter.trim()) {
                    allowedDealIds!.add(d.id);
                }
            });

            if (rawPayload.deals?.por_status) {
                gatherIds(rawPayload.deals.por_status.ganhos);
                gatherIds(rawPayload.deals.por_status.perdidos);
                gatherIds(rawPayload.deals.por_status.andamento);
            }
        }
        
        // Filter leads

        const filteredLeads = {
            em_atendimento: filterByRegional(filterByUf(filterBySource(
                filterLeadsByDate(rawPayload.leads.em_atendimento, dateFilter, false),
                sourceFilter
            ), ufFilter), regionalFilter),
            descartados: filterByRegional(filterByUf(filterBySource(
                filterLeadsByDate(rawPayload.leads.descartados, dateFilter, true),
                sourceFilter
            ), ufFilter), regionalFilter),
            convertidos: filterByRegional(filterByUf(filterBySource(
                filterLeadsByDate(rawPayload.leads.convertidos, dateFilter, true),
                sourceFilter
            ), ufFilter), regionalFilter),
        };

        // Filter deals by status
        const filteredDealsByStatus = filterDealsByStatus(
            rawPayload.deals.por_status,
            dateFilter,
            sourceFilter,
            ufFilter,
            regionalFilter
        );

        // Apply Funnel Filter to Status Deals
        const filteredDealsByStatusFiltered = {
            ganhos: filterByFunnel(filteredDealsByStatus.ganhos, allowedDealIds),
            perdidos: filterByFunnel(filteredDealsByStatus.perdidos, allowedDealIds),
            andamento: filterByFunnel(filteredDealsByStatus.andamento, allowedDealIds),
        };

        // Filter deals by segment
        const filteredDealsBySegmento = {
            varejo: filterStatusObjByFunnel(filterDealsByStatus(
                rawPayload.deals.por_segmento?.varejo || { ganhos: [], perdidos: [], andamento: [] },
                dateFilter,
                sourceFilter,
                ufFilter,
                regionalFilter
            ), allowedDealIds),
            projeto: filterStatusObjByFunnel(filterDealsByStatus(
                rawPayload.deals.por_segmento?.projeto || { ganhos: [], perdidos: [], andamento: [] },
                dateFilter,
                sourceFilter,
                ufFilter,
                regionalFilter
            ), allowedDealIds),
            outros: filterStatusObjByFunnel(filterDealsByStatus(
                rawPayload.deals.por_segmento?.outros || { ganhos: [], perdidos: [], andamento: [] },
                dateFilter,
                sourceFilter,
                ufFilter,
                regionalFilter
            ), allowedDealIds),
        };

        // Calculate metrics from filtered data
        const metrics = calculateMetrics(filteredLeads, filteredDealsByStatusFiltered);

        // ... geoData calc (same) ...
        // Calculate Geo Data for Map
        const geoData = {
            leads: {} as Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>,
            converted: {} as Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>
        };

        const allConvertedLeads = filteredLeads.convertidos;
        const allLeads = [
            ...filteredLeads.em_atendimento,
            ...filteredLeads.descartados,
            ...filteredLeads.convertidos
        ];

        // Helper to populate geoData
        const populateGeoData = (list: SegmentedLead[], target: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>) => {
            list.forEach(lead => {
                const uf = lead.uf || 'N/A';
                if (!target[uf]) {
                    target[uf] = { total: 0, sources: {}, leads: [] };
                }
                target[uf].total++;
                target[uf].leads.push(lead);

                const source = lead.fonte || 'Desconhecido';
                target[uf].sources[source] = (target[uf].sources[source] || 0) + 1;
            });
        };

        populateGeoData(allLeads, geoData.leads);
        populateGeoData(allConvertedLeads, geoData.converted);

        // Calculate Marketing Data (same) ...
        // Calculate Marketing Data for Conversion Analysis (Expanded)
        const normalizeSource = (s: string | undefined) => (s || '').toLowerCase();

        const googleLeads = allConvertedLeads.filter(l => normalizeSource(l.fonte).includes('google'));
        const metaLeads = allConvertedLeads.filter(l =>
            normalizeSource(l.fonte).includes('meta') ||
            normalizeSource(l.fonte).includes('facebook') ||
            normalizeSource(l.fonte).includes('instagram')
        );
        const indicacaoAmigoLeads = allConvertedLeads.filter(l => normalizeSource(l.fonte).includes('indicação amigo'));
        const profissionalLeads = allConvertedLeads.filter(l => normalizeSource(l.fonte).includes('profissional'));
        const ltvLeads = allConvertedLeads.filter(l => normalizeSource(l.fonte).includes('ltv'));

        // "Other" now excludes the specific ones above
        const otherLeads = allConvertedLeads.filter(l => {
            const s = normalizeSource(l.fonte);
            return !s.includes('google') &&
                !s.includes('meta') &&
                !s.includes('facebook') &&
                !s.includes('instagram') &&
                !s.includes('indicação amigo') &&
                !s.includes('profissional') &&
                !s.includes('ltv');
        });

        const googleVarejo = [
            ...filteredDealsBySegmento.varejo.ganhos,
            ...filteredDealsBySegmento.varejo.perdidos,
            ...filteredDealsBySegmento.varejo.andamento
        ].filter(d => normalizeSource(d.fonte).includes('google'));

        const googleProjeto = [
            ...filteredDealsBySegmento.projeto.ganhos,
            ...filteredDealsBySegmento.projeto.perdidos,
            ...filteredDealsBySegmento.projeto.andamento
        ].filter(d => normalizeSource(d.fonte).includes('google'));

        const metaVarejo = [
            ...filteredDealsBySegmento.varejo.ganhos,
            ...filteredDealsBySegmento.varejo.perdidos,
            ...filteredDealsBySegmento.varejo.andamento
        ].filter(d => {
            const s = normalizeSource(d.fonte);
            return s.includes('meta') || s.includes('facebook') || s.includes('instagram');
        });

        const metaProjeto = [
            ...filteredDealsBySegmento.projeto.ganhos,
            ...filteredDealsBySegmento.projeto.perdidos,
            ...filteredDealsBySegmento.projeto.andamento
        ].filter(d => {
            const s = normalizeSource(d.fonte);
            return s.includes('meta') || s.includes('facebook') || s.includes('instagram');
        });

        // New Metrics ...
        // 1. Leads Timeline
        const timelineMap = new Map<string, number>();
        allLeads.forEach(lead => {
            if (lead.data_criacao) {
                const date = lead.data_criacao.split('T')[0];
                timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
            }
        });
        const leadsTimeline = Array.from(timelineMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // 2. Converted Breakdown
        const getAllDeals = (statusObj: DealsByStatus) => [
            ...statusObj.ganhos,
            ...statusObj.perdidos,
            ...statusObj.andamento
        ];

        const allVarejoDeals = getAllDeals(filteredDealsBySegmento.varejo);
        const allProjetoDeals = getAllDeals(filteredDealsBySegmento.projeto);

        const getSourcesDistributionDeals = (deals: typeof allVarejoDeals) => {
            const sources: Record<string, number> = {};
            deals.forEach(d => {
                const s = d.fonte || 'Desconhecido';
                sources[s] = (sources[s] || 0) + 1;
            });
            return Object.entries(sources)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        };

        const convertedBreakdown = {
            varejo: allVarejoDeals.length,
            projeto: allProjetoDeals.length,
            varejoSources: getSourcesDistributionDeals(allVarejoDeals),
            projetoSources: getSourcesDistributionDeals(allProjetoDeals)
        };

        // 3. Discard Reasons (Using leads.descartados)
        const discardReasonsMap: Record<string, number> = {};
        filteredLeads.descartados.forEach(l => {
            const reason = l.motivo_descarte || 'Não informado';
            discardReasonsMap[reason] = (discardReasonsMap[reason] || 0) + 1;
        });
        const discardReasons = Object.entries(discardReasonsMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // 4. Deal Loss Reasons (Using deals.por_status.perdidos) NEW
        const lossReasonsMap: Record<string, number> = {};
        filteredDealsByStatusFiltered.perdidos.forEach(d => {
            const reason = d.motivo_perda || 'Não informado';
            lossReasonsMap[reason] = (lossReasonsMap[reason] || 0) + 1;
        });
        const dealLossReasons = Object.entries(lossReasonsMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Get available options
        const availableSources = extractUniqueSources(rawPayload);
        const availableUfs = extractUniqueUfs(rawPayload);
        const availableRegionals = extractUniqueRegionals(rawPayload);
        const availableFunnels = extractUniqueFunnels(rawPayload);

        // Calculate Monthly Goal (always use rawPayload for current month context)
        const monthlyGoal = calculateGoalMetrics(rawPayload);

        // Helper for parsing currency values
        const parseValue = (val: string | number | undefined | null): number => {
            if (val === undefined || val === null) return 0;
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
                const clean = val.replace(/[^\d,\.-]/g, '').replace(/\./g, '').replace(',', '.');
                return parseFloat(clean) || 0;
            }
            return 0;
        };

        return {
            leads: filteredLeads,
            deals: {
                por_segmento: filteredDealsBySegmento,
                por_status: filteredDealsByStatusFiltered,
            },
            metrics,
            availableSources,
            availableUfs,
            availableRegionals, // NEW
            availableFunnels, // NEW
            geoData,
            marketingData: {
                google: googleLeads,
                meta: metaLeads,
                indicacaoAmigo: indicacaoAmigoLeads,
                profissional: profissionalLeads,
                ltv: ltvLeads,
                other: otherLeads,
                googleVarejo,
                googleProjeto,
                metaVarejo,
                metaProjeto
            },
            leadsTimeline,
            convertedBreakdown,
            discardReasons,
            dealLossReasons, // NEW
            monthlyGoal, // NEW

            // NEW: Channel Performance Data (Combo Chart)
            channelPerformance: (() => {
                const results = [
                    { name: 'Google', revenue: 0, opportunities: 0, revenueTarget: 0, oppsTarget: 0 }, // Targets 0 for now
                    { name: 'Meta', revenue: 0, opportunities: 0, revenueTarget: 0, oppsTarget: 0 },
                    { name: 'Indicação Profissional', revenue: 0, opportunities: 0, revenueTarget: 0, oppsTarget: 0 },
                    { name: 'LTV', revenue: 0, opportunities: 0, revenueTarget: 0, oppsTarget: 0 },
                    { name: 'Indicação Amigo', revenue: 0, opportunities: 0, revenueTarget: 0, oppsTarget: 0 },
                    { name: 'Novos Leads/Clientes', revenue: 0, opportunities: 0, revenueTarget: 770000, oppsTarget: 3850000 }
                ];

                const normalize = (s: string) => (s || '').toLowerCase();
                
                const allDeals = [
                    ...filteredDealsByStatusFiltered.ganhos,
                    ...filteredDealsByStatusFiltered.perdidos,
                    ...filteredDealsByStatusFiltered.andamento
                ];

                allDeals.forEach(d => {
                    const val = parseValue(d.valor);
                    const src = normalize(d.fonte);
                    
                    // Helper to add to channel
                    const addTo = (name: string) => {
                        const item = results.find(r => r.name === name);
                        if (item) {
                            item.opportunities += val;
                            if (d.status_nome?.toLowerCase().includes('ganho') || d.status_nome?.toLowerCase().includes('won')) {
                                item.revenue += val;
                            }
                        }
                    };

                    // Access Control / Mapping
                    if (src.includes('google')) addTo('Google');
                    else if (src.includes('meta') || src.includes('facebook') || src.includes('instagram')) addTo('Meta');
                    else if (src.includes('profissional')) addTo('Indicação Profissional');
                    else if (src.includes('ltv')) addTo('LTV');
                    else if (src.includes('indicação amigo') || src.includes('indicacao amigo')) addTo('Indicação Amigo');
                    
                    // Novos Leads Check
                    if (d.is_novo) {
                        addTo('Novos Leads/Clientes');
                    }
                });

                return results;
            })(),

            // NEW: Novos Leads Metrics (Single Card usage)
            novosLeadsMetrics: (() => {
                const newDeals = [
                    ...filteredDealsByStatusFiltered.ganhos,
                    ...filteredDealsByStatusFiltered.perdidos,
                    ...filteredDealsByStatusFiltered.andamento
                ].filter(d => d.is_novo);

                const revenue = newDeals
                    .filter(d => d.status_nome?.toLowerCase().includes('ganho') || d.status_nome?.toLowerCase().includes('won'))
                    .reduce((acc, d) => acc + parseValue(d.valor), 0);
                
                return {
                    count: newDeals.length,
                    revenue
                };
            })()
        };
    }, [rawPayload, dateFilter, sourceFilter, ufFilter, regionalFilter, funnelFilter]);

    return {
        ...filteredData,
        isLoading,
        isSyncing, // New
        error,
        refetch: syncData, // Override default refetch with sync logic
    };
};

export default useFilteredDashboard;
