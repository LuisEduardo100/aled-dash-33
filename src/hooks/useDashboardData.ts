import { useState, useEffect, useCallback } from 'react';
import { RawLead, RawDeal, DateFilter } from '@/types/dashboard';
import { API_CONFIG } from '@/config/api';

interface DashboardDataResult {
    leads: RawLead[];
    deals: RawDeal[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Hook to fetch raw dashboard data from the backend API.
 * Returns leads and deals arrays ready for processing by useDashboardMetrics.
 */
export const useDashboardData = (
    dateFilter?: DateFilter,
    scope: string = 'mes_atual'
): DashboardDataResult => {
    const [leads, setLeads] = useState<RawLead[]>([]);
    const [deals, setDeals] = useState<RawDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (isAutoRefresh = false) => {
        if (!isAutoRefresh) setIsLoading(true);
        // Don't clear error on auto-refresh to avoid flickering if it fails silently
        if (!isAutoRefresh) setError(null);

        try {
            // Build query string with filters
            const params = new URLSearchParams({ scope });

            if (dateFilter?.startDate) {
                params.append('startDate', dateFilter.startDate.toISOString().split('T')[0]);
            }
            if (dateFilter?.endDate) {
                params.append('endDate', dateFilter.endDate.toISOString().split('T')[0]);
            }

            const url = `${API_CONFIG.DASHBOARD_ENDPOINT}/raw?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();

            // The backend returns pre-calculated data, but we want raw data
            // If backend returns payload directly, use it; otherwise extract from response
            if (data.payload) {
                setLeads(data.payload.leads || []);
                setDeals(data.payload.deals || []);
            } else if (data.leads && data.deals) {
                // Direct format
                setLeads(data.leads);
                setDeals(data.deals);
            } else {
                // Fallback: the current API returns aggregated data
                // For now, we'll need to fetch raw data separately or adjust backend
                console.warn('API did not return raw leads/deals. Using empty arrays.');
                setLeads([]);
                setDeals([]);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            if (!isAutoRefresh) setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            if (!isAutoRefresh) setIsLoading(false);
        }
    }, [scope, dateFilter]);

    useEffect(() => {
        fetchData();

        // Auto-refresh every 1 hour (3600000 ms)
        const intervalId = setInterval(() => {
            console.log('Auto-refreshing dashboard data...');
            fetchData(true);
        }, 3600000);

        return () => clearInterval(intervalId);
    }, [fetchData]);

    return {
        leads,
        deals,
        isLoading,
        error,
        refetch: () => fetchData(false),
    };
};


export default useDashboardData;
