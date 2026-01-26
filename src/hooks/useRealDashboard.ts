import { useMemo } from 'react';
import { useDashboardData } from './useDashboardData';
import { useDashboardMetrics } from './useDashboardMetrics';
import { DateFilter, RawLead, RawDeal } from '@/types/dashboard';
import { CRMLead, CRMDeal } from '@/types/crm';

/**
 * Bridge hook that fetches data from backend and provides metrics.
 * This hook maintains compatibility with the existing Dashboard.tsx structure
 * while using the new backend data.
 */
export const useRealDashboard = (
    dateFilter?: DateFilter,
    sourceFilter?: string
) => {
    const { leads: rawLeads, deals: rawDeals, isLoading, error, refetch } = useDashboardData(dateFilter);
    const dashboardMetrics = useDashboardMetrics(rawLeads, rawDeals, dateFilter, sourceFilter);

    // Defensive boolean parsing for values that may come as strings
    const toBoolean = (value: unknown): boolean =>
        value === true || String(value).toLowerCase() === 'true';

    // Convert RawLead to CRMLead format for backward compatibility with existing components
    const leads: CRMLead[] = useMemo(() => {
        return rawLeads.map(lead => ({
            id: lead.id,
            title: lead.nome,
            source_id: lead.fonte || '',
            status_id: lead.status,
            date_create: lead.data_criacao,
            kinbox_url: lead.link_kinbox || '',
            link_bitrix: lead.link_bitrix || '',
            discard_reason: lead.motivo_descarte,
            uf: lead.uf,
            phone: '', // Not available in raw data
        }));
    }, [rawLeads]);

    // Convert RawDeal to CRMDeal format for backward compatibility with existing components
    const deals: CRMDeal[] = useMemo(() => {
        return rawDeals.map(deal => ({
            id: deal.id,
            title: deal.titulo,
            opportunity: deal.valor,
            stage_id: deal.status,
            category_id: deal.segmento === 'Varejo' ? '8' : '134',
            date_create: deal.data_criacao,
            kinbox_url: deal.link_kinbox || '',
            link_bitrix: deal.link_bitrix || '',
            source_id: deal.fonte,
        }));
    }, [rawDeals]);

    // Provide metrics in the format expected by existing components
    const metrics = useMemo(() => {
        const dm = dashboardMetrics;

        // Get deals for different categories (using defensive boolean parsing)
        const wonDeals = rawDeals.filter(d => toBoolean(d.is_ganho));
        const lostDeals = rawDeals.filter(d => toBoolean(d.is_fechado) && !toBoolean(d.is_ganho));
        const pipelineDeals = rawDeals.filter(d => !toBoolean(d.is_ganho) && !toBoolean(d.is_fechado));
        const quotedDeals = rawDeals.filter(d => d.valor > 0);

        // Convert to CRMDeal format
        const convertToCRMDeals = (deals: RawDeal[]): CRMDeal[] => deals.map(d => ({
            id: d.id,
            title: d.titulo,
            opportunity: d.valor,
            stage_id: d.status,
            category_id: d.segmento === 'Varejo' ? '8' : '134',
            date_create: d.data_criacao,
            kinbox_url: d.link_kinbox || '',
            source_id: d.fonte,
        }));

        // Get Google Ads converted leads (using 'Google' in fonte)
        const googleConvertedLeads = rawLeads.filter(l =>
            l.status === 'CONVERTED' && l.fonte?.toLowerCase().includes('google')
        );
        const otherConvertedLeads = rawLeads.filter(l =>
            l.status === 'CONVERTED' && !l.fonte?.toLowerCase().includes('google')
        );

        // Google converted by segment (using deals)
        const googleConvertedVarejo = googleConvertedLeads.filter(l => {
            // Check if there's a won deal with Varejo segment
            return rawDeals.some(d => d.is_ganho && d.segmento === 'Varejo');
        });
        const googleConvertedProjeto = googleConvertedLeads.filter(l => {
            return rawDeals.some(d => d.is_ganho && d.segmento === 'Projeto');
        });

        // Convert leads to CRMLead format
        const convertToCRMLeads = (leads: RawLead[]): CRMLead[] => leads.map(l => ({
            id: l.id,
            title: l.nome,
            source_id: l.fonte || '',
            status_id: l.status,
            date_create: l.data_criacao,
            kinbox_url: l.link_kinbox || '',
            discard_reason: l.motivo_descarte,
            uf: l.uf,
            phone: '',
        }));

        return {
            // Lead metrics
            totalLeads: dm.leads.total,
            inProgress: dm.leads.inProcess.count + dm.leads.new.count, // NEW + IN_PROCESS = "Em Atendimento"
            inProgressPercent: ((dm.leads.inProcess.count + dm.leads.new.count) / dm.leads.total * 100 || 0).toFixed(1),
            discarded: dm.leads.junk.count,
            discardedPercent: dm.leads.junk.percentage.toString(),
            converted: dm.leads.converted.count,
            convertedPercent: dm.leads.converted.percentage.toString(),
            conversionRate: dm.leads.conversionRate,
            newLeads: dm.leads.new.count,

            // Quoted deals
            quoted: quotedDeals.length,
            quotedPercent: rawDeals.length > 0 ? ((quotedDeals.length / rawDeals.length) * 100).toFixed(1) : '0',
            quotedDeals: convertToCRMDeals(quotedDeals),

            // Financial metrics
            wonDeals: convertToCRMDeals(wonDeals),
            lostDeals: convertToCRMDeals(lostDeals),
            pipelineDeals: convertToCRMDeals(pipelineDeals),
            totalWonValue: dm.financials.revenue,
            totalLostValue: dm.financials.lost,
            totalPipelineValue: dm.financials.pipeline,
            averageTicket: dm.financials.ticketAvg,

            // Source attribution (for charts)
            metaLeads: leads.filter(l => l.source_id?.toLowerCase().includes('instagram') || l.source_id?.toLowerCase().includes('facebook')),
            googleLeads: leads.filter(l => l.source_id?.toLowerCase().includes('google')),
            organicLeads: leads.filter(l => !l.source_id?.toLowerCase().includes('google') && !l.source_id?.toLowerCase().includes('instagram') && !l.source_id?.toLowerCase().includes('facebook')),

            // Retail vs Project deals
            retailDeals: convertToCRMDeals(rawDeals.filter(d => d.segmento === 'Varejo')),
            projectDeals: convertToCRMDeals(rawDeals.filter(d => d.segmento === 'Projeto')),

            // Conversion analysis
            convertedLeads: convertToCRMLeads(rawLeads.filter(l => l.status === 'CONVERTED')),
            googleConvertedLeads: convertToCRMLeads(googleConvertedLeads),
            otherConvertedLeads: convertToCRMLeads(otherConvertedLeads),
            googleConvertedVarejo: convertToCRMLeads(googleConvertedVarejo),
            googleConvertedProjeto: convertToCRMLeads(googleConvertedProjeto),
        };
    }, [dashboardMetrics, rawLeads, rawDeals, leads]);

    // Geographic data in expected format
    const geoData = useMemo(() => {
        const stateData: Record<string, { total: number; sources: Record<string, number>; leads: CRMLead[] }> = {};

        // Get converted leads
        const convertedLeads = rawLeads.filter(l => l.status === 'CONVERTED');

        convertedLeads.forEach(lead => {
            const uf = lead.uf || 'N/D';
            if (!stateData[uf]) {
                stateData[uf] = { total: 0, sources: {}, leads: [] };
            }
            stateData[uf].total++;
            stateData[uf].leads.push({
                id: lead.id,
                title: lead.nome,
                source_id: lead.fonte || '',
                status_id: lead.status,
                date_create: lead.data_criacao,
                kinbox_url: lead.link_kinbox || '',
                discard_reason: lead.motivo_descarte,
                uf: lead.uf,
                phone: '',
            });

            const source = lead.fonte || 'Desconhecido';
            stateData[uf].sources[source] = (stateData[uf].sources[source] || 0) + 1;
        });

        return stateData;
    }, [rawLeads]);

    return {
        leads,
        deals,
        rawLeads,
        rawDeals,
        metrics,
        geoData,
        dashboardMetrics, // Full metrics for advanced use
        isLoading,
        error,
        refetch,
    };
};

export default useRealDashboard;
