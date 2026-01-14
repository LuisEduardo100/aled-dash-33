import { useState, useEffect, useMemo } from 'react';
import { CRMLead, CRMDeal, getDetailedSource, getDealCategory, isGoogleAds, isMetaAds, isIndicacao, getSourceAttribution } from '@/types/crm';
import { mockLeads, mockDeals } from '@/data/mockData';
import { API_CONFIG } from '@/config/api';

interface DateFilter {
  startDate: Date | null;
  endDate: Date | null;
}

interface DataFetchResult {
  leads: CRMLead[];
  deals: CRMDeal[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Fetch leads from API or mock
export const fetchLeads = async (): Promise<CRMLead[]> => {
  if (API_CONFIG.USE_MOCK_DATA) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockLeads;
  }
  
  const response = await fetch(API_CONFIG.LEADS_ENDPOINT);
  if (!response.ok) throw new Error('Failed to fetch leads');
  return response.json();
};

// Fetch deals from API or mock
export const fetchDeals = async (): Promise<CRMDeal[]> => {
  if (API_CONFIG.USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDeals;
  }
  
  const response = await fetch(API_CONFIG.DEALS_ENDPOINT);
  if (!response.ok) throw new Error('Failed to fetch deals');
  return response.json();
};

export const useDataFetch = (dateFilter?: DateFilter, sourceFilter?: string): DataFetchResult => {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [leadsData, dealsData] = await Promise.all([
        fetchLeads(),
        fetchDeals()
      ]);
      
      setLeads(leadsData);
      setDeals(dealsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter data by date range and source
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];
    
    // Date filter
    if (dateFilter?.startDate && dateFilter?.endDate) {
      filtered = filtered.filter(lead => {
        const leadDate = new Date(lead.date_create);
        return leadDate >= dateFilter.startDate! && leadDate <= dateFilter.endDate!;
      });
    }
    
    // Source filter
    if (sourceFilter && sourceFilter !== 'Todos') {
      filtered = filtered.filter(lead => {
        const detailedSource = getDetailedSource(lead.source_id);
        const attribution = getSourceAttribution(lead.source_id);
        return detailedSource === sourceFilter || attribution === sourceFilter ||
               lead.source_id.toLowerCase().includes(sourceFilter.toLowerCase());
      });
    }
    
    return filtered;
  }, [leads, dateFilter, sourceFilter]);

  const filteredDeals = useMemo(() => {
    let filtered = [...deals];
    
    // Date filter
    if (dateFilter?.startDate && dateFilter?.endDate) {
      filtered = filtered.filter(deal => {
        const dealDate = new Date(deal.date_create);
        return dealDate >= dateFilter.startDate! && dealDate <= dateFilter.endDate!;
      });
    }
    
    // Source filter
    if (sourceFilter && sourceFilter !== 'Todos') {
      filtered = filtered.filter(deal => {
        if (!deal.source_id) return false;
        const detailedSource = getDetailedSource(deal.source_id);
        const attribution = getSourceAttribution(deal.source_id);
        return detailedSource === sourceFilter || attribution === sourceFilter ||
               deal.source_id.toLowerCase().includes(sourceFilter.toLowerCase());
      });
    }
    
    return filtered;
  }, [deals, dateFilter, sourceFilter]);

  return {
    leads: filteredLeads,
    deals: filteredDeals,
    isLoading,
    error,
    refetch: loadData
  };
};

// Metrics calculation hook
export const useMetrics = (leads: CRMLead[], deals: CRMDeal[]) => {
  return useMemo(() => {
    const totalLeads = leads.length;
    const inProgress = leads.filter(l => l.status_id === 'IN_PROCESS').length;
    const discarded = leads.filter(l => l.status_id === 'JUNK' || l.discard_reason).length;
    const discardedLeads = leads.filter(l => l.status_id === 'JUNK' || l.discard_reason);
    const newLeads = leads.filter(l => l.status_id === 'NEW').length;
    
    // Converted = leads that have a matching deal or status CONVERTED
    const convertedLeadIds = new Set(deals.filter(d => d.lead_id).map(d => d.lead_id));
    const converted = leads.filter(l => l.status_id === 'CONVERTED' || convertedLeadIds.has(l.id)).length;
    const convertedLeads = leads.filter(l => l.status_id === 'CONVERTED' || convertedLeadIds.has(l.id));
    
    const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

    // Orçados = deals com opportunity > 0
    const quotedDeals = deals.filter(d => d.opportunity > 0);
    const quoted = quotedDeals.length;

    // Deal category breakdown
    const retailDeals = deals.filter(d => getDealCategory(d.category_id) === 'Varejo');
    const projectDeals = deals.filter(d => getDealCategory(d.category_id) === 'Projeto');

    // Source attribution for leads
    const metaLeads = leads.filter(l => isMetaAds(l.source_id));
    const googleLeads = leads.filter(l => isGoogleAds(l.source_id));
    const indicacoesLeads = leads.filter(l => isIndicacao(l.source_id));

    // Financial metrics
    const wonDeals = deals.filter(d => d.stage_id.includes('WON'));
    const lostDeals = deals.filter(d => d.stage_id.includes('LOSE'));
    const pipelineDeals = deals.filter(d => !d.stage_id.includes('WON') && !d.stage_id.includes('LOSE'));
    
    const totalWonValue = wonDeals.reduce((acc, d) => acc + d.opportunity, 0);
    const totalLostValue = lostDeals.reduce((acc, d) => acc + d.opportunity, 0);
    const totalPipelineValue = pipelineDeals.reduce((acc, d) => acc + d.opportunity, 0);
    const averageTicket = wonDeals.length > 0 ? totalWonValue / wonDeals.length : 0;

    // Advanced conversion analysis by source
    const createSourceData = (sourceLeads: CRMLead[]) => {
      const sourceConverted = sourceLeads.filter(l => l.status_id === 'CONVERTED' || convertedLeadIds.has(l.id));
      const varejo = sourceConverted.filter(l => {
        const deal = deals.find(d => d.lead_id === l.id);
        return deal && getDealCategory(deal.category_id) === 'Varejo';
      });
      const projeto = sourceConverted.filter(l => {
        const deal = deals.find(d => d.lead_id === l.id);
        return deal && getDealCategory(deal.category_id) === 'Projeto';
      });
      return {
        leads: sourceLeads,
        converted: sourceConverted,
        varejo,
        projeto,
        conversionRate: sourceLeads.length > 0 ? (sourceConverted.length / sourceLeads.length) * 100 : 0,
      };
    };

    const googleData = createSourceData(googleLeads);
    const metaData = createSourceData(metaLeads);
    const indicacoesData = createSourceData(indicacoesLeads);

    // Percentages
    const inProgressPercent = totalLeads > 0 ? ((inProgress / totalLeads) * 100).toFixed(1) : '0';
    const discardedPercent = totalLeads > 0 ? ((discarded / totalLeads) * 100).toFixed(1) : '0';
    const convertedPercent = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0';
    const quotedPercent = deals.length > 0 ? ((quoted / deals.length) * 100).toFixed(1) : '0';

    return {
      totalLeads,
      inProgress,
      inProgressPercent,
      discarded,
      discardedPercent,
      discardedLeads,
      converted,
      convertedPercent,
      convertedLeads,
      conversionRate,
      quoted,
      quotedPercent,
      quotedDeals,
      newLeads,
      retailDeals,
      projectDeals,
      metaLeads,
      googleLeads,
      indicacoesLeads,
      // Financial
      wonDeals,
      lostDeals,
      pipelineDeals,
      totalWonValue,
      totalLostValue,
      totalPipelineValue,
      averageTicket,
      // Advanced conversion analysis
      googleData,
      metaData,
      indicacoesData,
    };
  }, [leads, deals]);
};

// Geographic distribution hook
export const useGeographicData = (leads: CRMLead[], deals: CRMDeal[]) => {
  return useMemo(() => {
    // Get converted leads
    const convertedLeadIds = new Set(deals.filter(d => d.lead_id).map(d => d.lead_id));
    const convertedLeads = leads.filter(l => l.status_id === 'CONVERTED' || convertedLeadIds.has(l.id));
    
    // Group by state
    const stateData: Record<string, { total: number; sources: Record<string, number>; leads: CRMLead[] }> = {};
    
    convertedLeads.forEach(lead => {
      const uf = lead.uf || 'N/D';
      if (!stateData[uf]) {
        stateData[uf] = { total: 0, sources: {}, leads: [] };
      }
      stateData[uf].total++;
      stateData[uf].leads.push(lead);
      
      const source = getSourceAttribution(lead.source_id);
      stateData[uf].sources[source] = (stateData[uf].sources[source] || 0) + 1;
    });
    
    return stateData;
  }, [leads, deals]);
};
