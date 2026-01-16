import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { AdvancedLeadsTable } from '@/components/dashboard/AdvancedLeadsTable';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { DateFilter } from '@/types/dashboard';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function AdvancedLeadsPage() {
    // Filter state
    const [dateFilter, setDateFilter] = useState<DateFilter>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
    });
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [ufFilter, setUfFilter] = useState('Todos');

    // Use the new filtered dashboard hook
    const {
        leads,
        deals,
        availableSources,
        availableUfs,
        isLoading,
        error,
        refetch
    } = useFilteredDashboard(dateFilter, sourceFilter === 'Todos' ? null : sourceFilter, ufFilter === 'Todos' ? null : ufFilter);

    // Dark mode
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <DashboardLayout>
            {/* Filter Bar */}
            <div className="px-6 pt-6">
                <FilterBar
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                    sourceFilter={sourceFilter}
                    onSourceFilterChange={setSourceFilter}
                    availableSources={availableSources}
                    ufFilter={ufFilter}
                    onUfFilterChange={setUfFilter}
                    availableUfs={availableUfs}
                    onRefresh={refetch}
                    isLoading={isLoading}
                />
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {error ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-destructive text-lg">Erro ao carregar dados</p>
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                    </div>
                ) : (
                    <AdvancedLeadsTable leads={leads} deals={deals} />
                )}
            </div>
        </DashboardLayout>
    );
}
