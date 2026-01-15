import { useMemo } from 'react';
import {
    RawLead,
    RawDeal,
    DashboardMetrics,
    LeadMetrics,
    FinancialMetrics,
    SourceMetric,
    GeoMetric,
    TimelinePoint,
    SellerMetric,
    DateFilter,
} from '@/types/dashboard';

// ========== DATA SANITIZATION ==========
const deduplicateLeads = (items: RawLead[]): RawLead[] => {
    const map = new Map<string, RawLead>();
    items.forEach(item => {
        if (!map.has(item.id)) {
            map.set(item.id, item);
        }
    });
    return Array.from(map.values());
};

const deduplicateDeals = (items: RawDeal[]): RawDeal[] => {
    const map = new Map<string, RawDeal>();
    items.forEach(item => {
        if (!map.has(item.id)) {
            map.set(item.id, item);
        }
    });
    return Array.from(map.values());
};

// Normalize status for case-insensitive comparison
const normalizeStatus = (status: string | undefined): string => {
    return (status || '').trim().toUpperCase();
};

// Defensive boolean parsing for values that may come as strings
const toBoolean = (value: unknown): boolean =>
    value === true || String(value).toLowerCase() === 'true';

/**
 * Hook to calculate all dashboard metrics from raw Postgres data.
 * All calculations use useMemo for performance optimization.
 */
export const useDashboardMetrics = (
    leads: RawLead[],
    deals: RawDeal[],
    dateFilter?: DateFilter,
    sourceFilter?: string
): DashboardMetrics => {

    // ========== STEP 1: DEDUPLICATE DATA ==========
    const uniqueLeads = useMemo(() => {
        const deduplicated = deduplicateLeads(leads);
        console.log('📊 Total Raw Leads:', leads.length, '| Unique Leads:', deduplicated.length);
        return deduplicated;
    }, [leads]);

    const uniqueDeals = useMemo(() => {
        const deduplicated = deduplicateDeals(deals);
        console.log('📊 Total Raw Deals:', deals.length, '| Unique Deals:', deduplicated.length);
        return deduplicated;
    }, [deals]);

    // Filter leads by date range (context-aware: JUNK uses data_modificacao)
    const filteredLeads = useMemo(() => {
        if (!dateFilter?.startDate || !dateFilter?.endDate) return uniqueLeads;

        return uniqueLeads.filter(lead => {
            const status = normalizeStatus(lead.status);
            // JUNK leads: filter by modification date (when they were discarded)
            // Other leads: filter by creation date
            const relevantDateField = status === 'JUNK'
                ? (lead.data_modificacao || lead.data_referencia_dashboard || lead.data_criacao)
                : (lead.data_referencia_dashboard || lead.data_criacao);
            const leadDate = new Date(relevantDateField);
            return leadDate >= dateFilter.startDate! && leadDate <= dateFilter.endDate!;
        });
    }, [uniqueLeads, dateFilter]);

    // Filter deals by date range (won/lost use data_fechamento, pipeline has no date restriction)
    const filteredDeals = useMemo(() => {
        if (!dateFilter?.startDate || !dateFilter?.endDate) return uniqueDeals;

        return uniqueDeals.filter(deal => {
            const isWon = toBoolean(deal.is_ganho);
            const isClosed = toBoolean(deal.is_fechado);

            // Pipeline deals (not closed): include all regardless of date
            if (!isClosed) return true;

            // Won/Lost deals: filter by data_fechamento
            const dealDate = new Date(deal.data_fechamento || deal.data_criacao);
            return dealDate >= dateFilter.startDate! && dealDate <= dateFilter.endDate!;
        });
    }, [uniqueDeals, dateFilter]);

    // Apply source filter if provided
    const sourceFilteredLeads = useMemo(() => {
        if (!sourceFilter || sourceFilter === 'Todos') return filteredLeads;
        return filteredLeads.filter(lead =>
            lead.fonte?.toLowerCase().includes(sourceFilter.toLowerCase())
        );
    }, [filteredLeads, sourceFilter]);

    // ========== A. LEAD METRICS ==========
    const leadMetrics: LeadMetrics = useMemo(() => {
        const total = sourceFilteredLeads.length;

        // Use normalized status for case-insensitive comparison
        const newLeads = sourceFilteredLeads.filter(l => normalizeStatus(l.status) === 'NEW');
        const inProcessLeads = sourceFilteredLeads.filter(l => normalizeStatus(l.status) === 'IN_PROCESS');
        const junkLeads = sourceFilteredLeads.filter(l => normalizeStatus(l.status) === 'JUNK');
        const convertedLeads = sourceFilteredLeads.filter(l => normalizeStatus(l.status) === 'CONVERTED');

        const calcPercentage = (count: number) => total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;

        return {
            total,
            totalItems: sourceFilteredLeads,
            new: {
                count: newLeads.length,
                percentage: calcPercentage(newLeads.length),
                items: newLeads,
            },
            inProcess: {
                count: inProcessLeads.length,
                percentage: calcPercentage(inProcessLeads.length),
                items: inProcessLeads,
            },
            junk: {
                count: junkLeads.length,
                percentage: calcPercentage(junkLeads.length),
                items: junkLeads,
            },
            converted: {
                count: convertedLeads.length,
                percentage: calcPercentage(convertedLeads.length),
                items: convertedLeads,
            },
            conversionRate: calcPercentage(convertedLeads.length),
        };
    }, [sourceFilteredLeads]);

    // ========== B. FINANCIAL METRICS ==========
    const financialMetrics: FinancialMetrics = useMemo(() => {
        const revenueDeals = filteredDeals.filter(d => toBoolean(d.is_ganho));
        const pipelineDeals = filteredDeals.filter(d => !toBoolean(d.is_ganho) && !toBoolean(d.is_fechado));
        const lostDeals = filteredDeals.filter(d => toBoolean(d.is_fechado) && !toBoolean(d.is_ganho));

        const revenue = revenueDeals.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
        const pipeline = pipelineDeals.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
        const lost = lostDeals.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
        const wonCount = revenueDeals.length;
        const ticketAvg = wonCount > 0 ? revenue / wonCount : 0;

        return {
            revenue,
            revenueDeals,
            pipeline,
            pipelineDeals,
            lost,
            lostDeals,
            ticketAvg,
            wonCount,
        };
    }, [filteredDeals]);

    // ========== C. SOURCES (with conversion rate) ==========
    const sourceMetrics: SourceMetric[] = useMemo(() => {
        const sourceMap: Record<string, { leads: RawLead[]; converted: number }> = {};

        sourceFilteredLeads.forEach(lead => {
            const fonte = lead.fonte || 'Desconhecido';
            if (!sourceMap[fonte]) {
                sourceMap[fonte] = { leads: [], converted: 0 };
            }
            sourceMap[fonte].leads.push(lead);
            if (lead.status === 'CONVERTED') {
                sourceMap[fonte].converted++;
            }
        });

        return Object.entries(sourceMap)
            .map(([name, data]) => ({
                name,
                leads: data.leads.length,
                leadItems: data.leads,
                converted: data.converted,
                conversionRate: data.leads.length > 0
                    ? Number(((data.converted / data.leads.length) * 100).toFixed(1))
                    : 0,
            }))
            .sort((a, b) => b.leads - a.leads);
    }, [sourceFilteredLeads]);

    // ========== D. GEO CHART (by UF) ==========
    const geoMetrics: GeoMetric[] = useMemo(() => {
        const geoMap: Record<string, { leads: RawLead[]; sales: RawDeal[]; revenue: number }> = {};

        // Count leads by UF
        sourceFilteredLeads.forEach(lead => {
            const uf = lead.uf || 'N/D';
            if (!geoMap[uf]) {
                geoMap[uf] = { leads: [], sales: [], revenue: 0 };
            }
            geoMap[uf].leads.push(lead);
        });

        // Count won deals by UF
        filteredDeals.filter(d => toBoolean(d.is_ganho)).forEach(deal => {
            const uf = deal.uf || 'N/D';
            if (!geoMap[uf]) {
                geoMap[uf] = { leads: [], sales: [], revenue: 0 };
            }
            geoMap[uf].sales.push(deal);
            geoMap[uf].revenue += Number(deal.valor) || 0;
        });

        return Object.entries(geoMap)
            .map(([uf, data]) => ({
                uf,
                leads: data.leads.length,
                leadItems: data.leads,
                sales: data.sales.length,
                salesItems: data.sales,
                revenue: data.revenue,
            }))
            .sort((a, b) => b.sales - a.sales);
    }, [sourceFilteredLeads, filteredDeals]);

    // ========== E. TIMELINE (daily) ==========
    const timelineMetrics: TimelinePoint[] = useMemo(() => {
        const timelineMap: Record<string, { leads: number; sales: number }> = {};

        // Group leads by day
        sourceFilteredLeads.forEach(lead => {
            const dateStr = (lead.data_referencia_dashboard || lead.data_criacao)?.split('T')[0];
            if (!dateStr) return;
            if (!timelineMap[dateStr]) {
                timelineMap[dateStr] = { leads: 0, sales: 0 };
            }
            timelineMap[dateStr].leads++;
        });

        // Group won deals by day
        filteredDeals.filter(d => toBoolean(d.is_ganho)).forEach(deal => {
            const dateStr = deal.data_fechamento?.split('T')[0];
            if (!dateStr) return;
            if (!timelineMap[dateStr]) {
                timelineMap[dateStr] = { leads: 0, sales: 0 };
            }
            timelineMap[dateStr].sales++;
        });

        return Object.entries(timelineMap)
            .map(([date, data]) => ({
                date,
                leads: data.leads,
                sales: data.sales,
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [sourceFilteredLeads, filteredDeals]);

    // ========== F. SELLER PERFORMANCE ==========
    const sellerMetrics: SellerMetric[] = useMemo(() => {
        const sellerMap: Record<string, { leads: RawLead[]; deals: RawDeal[]; totalVendido: number }> = {};

        // Group leads by responsavel_id
        sourceFilteredLeads.forEach(lead => {
            const id = lead.responsavel_id;
            if (!id) return;
            if (!sellerMap[id]) {
                sellerMap[id] = { leads: [], deals: [], totalVendido: 0 };
            }
            sellerMap[id].leads.push(lead);
        });

        // Group won deals by responsavel_id
        filteredDeals.filter(d => toBoolean(d.is_ganho)).forEach(deal => {
            const id = deal.responsavel_id;
            if (!id) return;
            if (!sellerMap[id]) {
                sellerMap[id] = { leads: [], deals: [], totalVendido: 0 };
            }
            sellerMap[id].deals.push(deal);
            sellerMap[id].totalVendido += Number(deal.valor) || 0;
        });

        return Object.entries(sellerMap)
            .map(([id, data]) => ({
                id,
                leadsAtribuidos: data.leads.length,
                leadsItems: data.leads,
                dealsGanhos: data.deals.length,
                dealsItems: data.deals,
                totalVendido: data.totalVendido,
                taxaConversao: data.leads.length > 0
                    ? Number(((data.deals.length / data.leads.length) * 100).toFixed(1))
                    : 0,
            }))
            .sort((a, b) => b.totalVendido - a.totalVendido);
    }, [sourceFilteredLeads, filteredDeals]);

    return {
        leads: leadMetrics,
        financials: financialMetrics,
        sources: sourceMetrics,
        geo: geoMetrics,
        timeline: timelineMetrics,
        sellers: sellerMetrics,
    };
};

export default useDashboardMetrics;
