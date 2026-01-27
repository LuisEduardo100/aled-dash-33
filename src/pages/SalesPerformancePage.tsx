import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { DateFilter } from '@/types/dashboard';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, Tv } from 'lucide-react';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { SalesPerformanceTable } from '@/components/dashboard/SalesPerformanceTable';
import { TVDashboardView } from '@/components/dashboard/TVDashboardView';
import { SellerDashboardCard } from '@/components/dashboard/SellerDashboardCard';
import { Button } from '@/components/ui/button';


export default function SalesPerformancePage() {
    // Filter State
    const [dateFilter, setDateFilter] = useState<DateFilter>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
    });
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [ufFilter, setUfFilter] = useState('Todos');
    const [regionalFilter, setRegionalFilter] = useState('Todos');

    // TV Mode State
    const [isTVMode, setIsTVMode] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // Fetch Data
    const {
        deals,
        isLoading,
        error,
        refetch,
        availableSources,
        availableUfs,
        availableRegionals,
        isSyncing
    } = useFilteredDashboard(
        dateFilter,
        sourceFilter === 'Todos' ? null : sourceFilter,
        ufFilter === 'Todos' ? null : ufFilter,
        regionalFilter === 'Todos' ? null : regionalFilter
    );

    // Filter Won Deals (Status = Ganho)
    const wonDeals = useMemo(() => {
        if (!deals || !deals.por_status || !deals.por_status.ganhos) return [];
        return deals.por_status.ganhos;
    }, [deals]);

    // Aggregate by Salesperson
    const salesByRep = useMemo(() => {
        const stats: Record<string, { totalValue: number; count: number }> = {};

        wonDeals.forEach(deal => {
            const name = deal.responsavel_nome || 'N/A';
            if (!stats[name]) {
                stats[name] = { totalValue: 0, count: 0 };
            }
            stats[name].totalValue += deal.valor;
            stats[name].count += 1;
        });

        // Convert to array and sort by Total Value descending
        return Object.entries(stats)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.totalValue - a.totalValue);
    }, [wonDeals]);

    // Handle refresh with timestamp update
    const handleRefresh = () => {
        refetch();
        setLastUpdated(new Date());
    };

    // Render TV Mode
    if (isTVMode) {
        return (
            <TVDashboardView
                sellers={salesByRep}
                onClose={() => setIsTVMode(false)}
                onRefresh={handleRefresh}
                isRefreshing={isLoading || isSyncing}
                lastUpdated={lastUpdated}
            />
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex-1 flex items-center justify-center p-6 text-red-400">
                    Erro ao carregar dados: {error}
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 flex-1 overflow-auto">
                {/* Header & Filter */}
                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row gap-4 justify-end items-start md:items-center">
                    <div className="w-full">
                        <FilterBar
                            dateFilter={dateFilter}
                            onDateFilterChange={setDateFilter}
                            sourceFilter={sourceFilter}
                            onSourceFilterChange={setSourceFilter}
                            ufFilter={ufFilter}
                            onUfFilterChange={setUfFilter}
                            regionalFilter={regionalFilter}
                            onRegionalFilterChange={setRegionalFilter}
                            isLoading={isLoading}
                            onRefresh={refetch}
                            availableSources={availableSources || []}
                            availableUfs={availableUfs || []}
                            availableRegionals={availableRegionals || []}
                            isSyncing={isSyncing}
                        />
                    </div>
                    {/* TV Mode Button */}
                    <Button
                        variant="outline"
                        onClick={() => setIsTVMode(true)}
                        className="flex items-center gap-2 whitespace-nowrap"
                    >
                        <Tv className="w-4 h-4" />
                        <span className="hidden md:inline">Modo TV</span>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center h-[50vh]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Seller Dashboard Cards with full metrics */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                            {salesByRep.map((rep, index) => (
                                <SellerDashboardCard
                                    key={rep.name}
                                    name={rep.name}
                                    totalValue={rep.totalValue}
                                    dealCount={rep.count}
                                    isTopPerformer={index === 0}
                                    rank={index + 1}
                                />
                            ))}
                            {salesByRep.length === 0 && (
                                <div className="col-span-full text-center text-muted-foreground p-4">
                                    Nenhuma venda encontrada para o período selecionado.
                                </div>
                            )}
                        </div>

                        {/* Detailed Table */}
                        <SalesPerformanceTable deals={wonDeals} />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
