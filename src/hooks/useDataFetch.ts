import { useState, useEffect, useMemo } from 'react';
import { CRMLead, CRMDeal, getSourceAttribution, getDealCategory } from '@/types/crm';
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

export const useDataFetch = (dateFilter?: DateFilter): DataFetchResult => {
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

  // Filter data by date range
  const filteredLeads = useMemo(() => {
    if (!dateFilter?.startDate || !dateFilter?.endDate) return leads;
    
    return leads.filter(lead => {
      const leadDate = new Date(lead.date_create);
      return leadDate >= dateFilter.startDate! && leadDate <= dateFilter.endDate!;
    });
  }, [leads, dateFilter]);

  const filteredDeals = useMemo(() => {
    if (!dateFilter?.startDate || !dateFilter?.endDate) return deals;
    
    return deals.filter(deal => {
      const dealDate = new Date(deal.date_create);
      return dealDate >= dateFilter.startDate! && dealDate <= dateFilter.endDate!;
    });
  }, [deals, dateFilter]);

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
    
    // Converted = leads that have a matching deal
    const convertedLeadIds = new Set(deals.filter(d => d.lead_id).map(d => d.lead_id));
    const converted = leads.filter(l => l.status_id === 'CONVERTED' || convertedLeadIds.has(l.id)).length;
    
    const conversionRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

    // Deal category breakdown
    const retailDeals = deals.filter(d => getDealCategory(d.category_id) === 'Varejo');
    const projectDeals = deals.filter(d => getDealCategory(d.category_id) === 'Projeto');

    // Source attribution
    const metaLeads = leads.filter(l => getSourceAttribution(l.source_id) === 'Meta Ads');
    const googleLeads = leads.filter(l => getSourceAttribution(l.source_id) === 'Google Ads');
    const organicLeads = leads.filter(l => getSourceAttribution(l.source_id) === 'Orgânico/Outros');

    return {
      totalLeads,
      inProgress,
      discarded,
      converted,
      conversionRate,
      retailDeals,
      projectDeals,
      metaLeads,
      googleLeads,
      organicLeads,
      newLeads: leads.filter(l => l.status_id === 'NEW').length,
    };
  }, [leads, deals]);
};
