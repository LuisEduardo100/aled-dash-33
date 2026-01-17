import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { DateFilter } from '@/types/dashboard';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { SalesPerformanceTable } from '@/components/dashboard/SalesPerformanceTable';

export default function SalesPerformancePage() {
    // Filter State
    const [dateFilter, setDateFilter] = useState<DateFilter>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
    });
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [ufFilter, setUfFilter] = useState('Todos');
    const [regionalFilter, setRegionalFilter] = useState('Todos');

    // Fetch Data
    const {
        deals,
        isLoading,
        error,
        refetch,
        availableSources,
        availableUfs,
        availableRegionals
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

    // Format Helpers
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(val);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

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
                        />
                   </div>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center h-[50vh]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {salesByRep.map((rep, index) => (
                                <Card key={rep.name} className={`border-l-4 ${index === 0 ? 'border-l-yellow-500' : index === 1 ? 'border-l-gray-400' : index === 2 ? 'border-l-orange-500' : 'border-l-transparent'}`}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-border">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {getInitials(rep.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-foreground truncate max-w-[150px]" title={rep.name}>{rep.name}</p>
                                            <p className="text-lg font-bold text-emerald-500">
                                                {formatCurrency(rep.totalValue)}
                                            </p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {rep.count} vendas
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {salesByRep.length === 0 && (
                                <div className="col-span-full text-center text-muted-foreground p-4">
                                    Nenhuma venda encontrada para o período selecionado.
                                </div>
                            )}
                        </div>

                        {/* Detailed Table (Now using complex component) */}
                        <SalesPerformanceTable deals={wonDeals} />
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
