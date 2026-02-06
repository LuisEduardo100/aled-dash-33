import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateFilter, SegmentedDeal } from '@/types/dashboard';
import { API_CONFIG } from '@/config/api';
import { subMonths } from 'date-fns';

export interface CreatedDealsMetrics {
    total: number;
    varejo: number;
    projeto: number;
    outros: number;
    valorTotal: number;
    valorVarejo: number;
    valorProjeto: number;
}

export const useCreatedDeals = (
    dateFilter: DateFilter,
    sourceFilter: string | null = null,
    ufFilter: string | null = null,
    regionalFilter: string | null = null,
    segmentFilter: string | null = null
) => {
    const [rawDeals, setRawDeals] = useState<SegmentedDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Using relative URL which proxies to backend
            const response = await fetch('/api/created-deals/raw?limit=10000');
            if (!response.ok) throw new Error('Failed to fetch deals');

            const data = await response.json();
            if (data.success && Array.isArray(data.deals)) {
                setRawDeals(data.deals);
            } else {
                setRawDeals([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Falha ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Manual Sync
    const syncData = useCallback(async () => {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/created-deals/sync', { method: 'POST' });
            if (!response.ok) throw new Error('Sync failed');
            await fetchData();
        } catch (err) {
            console.error('Sync error:', err);
            alert('Erro ao sincronizar');
        } finally {
            setIsSyncing(false);
        }
    }, [fetchData]);

    // Source Mapping (Client-side fallback)
    const MAPA_FONTES: Record<string, string> = {
        "UC_JKGTUC": "Prospecção", "WEBFORM": "Google", "CALLBACK": "Instagram",
        "STORE": "Indicação Amigo", "RC_GENERATOR": "Indicação Profissional",
        "CALL": "CFA", "UC_H0VN85": "Youtube", "UC_F445HA": "Vitrine/Carro",
        "UC_8OOM1P": "Encarte/Outdoor", "UC_GG87LP": "Eventos", "UC_HCJB1D": "Facebook",
        "UC_N35K7E": "Ativação Relac.", "REPEAT_SALE": "Corporativo", "UC_Y1DNMP": "Site",
        "Google": "Google", "Facebook": "Facebook", "Instagram": "Instagram",
        "Indicação": "Indicação Amigo", "WEB": "Site",
        "UC_JNSE1L": "LTV", "UC_6F33AS": "Busca orgânica"
    };

    const tratarFonte = (src: string) => MAPA_FONTES[src] || src || "Direto";

    // Filtering Logic
    const filteredData = useMemo(() => {
        if (!rawDeals.length) return {
            deals: [],
            varejo: [],
            projeto: [],
            metrics: { total: 0, varejo: 0, projeto: 0, outros: 0, valorTotal: 0, valorVarejo: 0, valorProjeto: 0 },
            metricsPrevious: { total: 0, varejo: 0, projeto: 0, valorTotal: 0 },
            wonLost: { won: 0, lost: 0 },
            timeline: [],
            sources: []
        };

        const startDate = dateFilter.startDate;
        const endDate = dateFilter.endDate;

        // Calculate Previous Period (Month-over-Month comparison)
        let prevStartDate: Date | null = null;
        let prevEndDate: Date | null = null;

        if (startDate && endDate) {
            prevStartDate = subMonths(startDate, 1);
            prevEndDate = subMonths(endDate, 1);
        }

        // Filter Function
        const filterDeal = (deal: SegmentedDeal, start: Date | null, end: Date | null) => {
            // 1. Date Filter (Creation Date)
            if (deal.data_criacao && start && end) {
                const date = new Date(deal.data_criacao);
                if (date < start || date > end) return false;
            }

            // 2. Source Filter
            if (sourceFilter && sourceFilter !== 'Todos') {
                const rawSource = deal.fonte || '';
                const mappedSource = tratarFonte(rawSource);
                const s = mappedSource.toLowerCase();

                if (sourceFilter === 'Meta') {
                    if (!s.includes('facebook') && !s.includes('instagram') && !s.includes('meta')) return false;
                } else {
                    if (mappedSource !== sourceFilter) return false;
                }
            }

            // 3. UF Filter
            if (ufFilter && ufFilter !== 'Todos') {
                if ((deal.uf || 'N/A') !== ufFilter) return false;
            }

            // 4. Regional Filter
            if (regionalFilter && regionalFilter !== 'Todos') {
                if ((deal.regional || 'N/A') !== regionalFilter) return false;
            }

            // 5. Segment Filter
            if (segmentFilter && segmentFilter !== 'Todos') {
                const seg = deal.segmento || 'Outros';
                if (seg !== segmentFilter) return false;
            }

            return true;
        };

        const currentPeriodDeals = rawDeals.filter(d => filterDeal(d, startDate, endDate));
        const previousPeriodDeals = rawDeals.filter(d => filterDeal(d, prevStartDate, prevEndDate));

        // Segmentation Current
        const varejo = currentPeriodDeals.filter(d => d.segmento === 'Varejo');
        const projeto = currentPeriodDeals.filter(d => d.segmento === 'Projeto');
        const outros = currentPeriodDeals.filter(d => d.segmento !== 'Varejo' && d.segmento !== 'Projeto');

        // Segmentation Previous
        const varejoPrev = previousPeriodDeals.filter(d => d.segmento === 'Varejo');
        const projetoPrev = previousPeriodDeals.filter(d => d.segmento === 'Projeto');

        // Won/Lost (Current Period - Project only)
        const won = projeto.filter(d => d.is_ganho).length;
        const lost = projeto.filter(d => d.status_nome === 'Perdido').length;
        const wonLost = { won, lost };

        // Metrics Current
        const metrics: CreatedDealsMetrics = {
            total: currentPeriodDeals.length,
            varejo: varejo.length,
            projeto: projeto.length,
            outros: outros.length,
            valorTotal: currentPeriodDeals.reduce((acc, d) => acc + (Number(d.valor) || 0), 0),
            valorVarejo: varejo.reduce((acc, d) => acc + (Number(d.valor) || 0), 0),
            valorProjeto: projeto.reduce((acc, d) => acc + (Number(d.valor) || 0), 0),
        };

        // Metrics Previous
        const metricsPrevious = {
            total: previousPeriodDeals.length,
            varejo: varejoPrev.length,
            projeto: projetoPrev.length,
            valorTotal: previousPeriodDeals.reduce((acc, d) => acc + (Number(d.valor) || 0), 0),
        };

        // Timeline Data
        const timelineMap = new Map<string, { total: number; varejo: number; projeto: number }>();
        currentPeriodDeals.forEach(d => {
            if (!d.data_criacao) return;
            const date = d.data_criacao.split('T')[0];
            if (!timelineMap.has(date)) timelineMap.set(date, { total: 0, varejo: 0, projeto: 0 });

            const entry = timelineMap.get(date)!;
            entry.total++;
            if (d.segmento === 'Varejo') entry.varejo++;
            if (d.segmento === 'Projeto') entry.projeto++;
        });

        const timeline = Array.from(timelineMap.entries())
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Source Data
        const sourceMap = new Map<string, number>();
        currentPeriodDeals.forEach(d => {
            const s = tratarFonte(d.fonte || 'Desconhecido');
            sourceMap.set(s, (sourceMap.get(s) || 0) + 1);
        });
        const sources = Array.from(sourceMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return {
            deals: currentPeriodDeals,
            varejo,
            projeto,
            metrics,
            metricsPrevious,
            wonLost,
            timeline,
            sourcesChart: sources
        };
    }, [rawDeals, dateFilter, sourceFilter, ufFilter, regionalFilter, segmentFilter]);

    // Available Filters Calculation (from RAW data)
    const availableFilters = useMemo(() => {
        const sources = new Set<string>();
        const ufs = new Set<string>();
        const regionals = new Set<string>();

        rawDeals.forEach(d => {
            if (d.fonte) sources.add(tratarFonte(d.fonte));
            if (d.uf) ufs.add(d.uf);
            if (d.regional) regionals.add(d.regional);
        });

        // Add Meta if applicable
        const sourceList = Array.from(sources).sort();
        if (sourceList.some(s => s.toLowerCase().includes('facebook') || s.toLowerCase().includes('instagram'))) {
            sourceList.unshift('Meta');
        }
        sourceList.unshift('Todos');

        return {
            sources: sourceList,
            ufs: ['Todos', ...Array.from(ufs).sort()],
            regionals: ['Todos', ...Array.from(regionals).sort()]
        };
    }, [rawDeals]);

    return {
        ...filteredData,
        ...availableFilters,
        isLoading,
        isSyncing,
        error,
        refetch: fetchData,
        syncData
    };
};
