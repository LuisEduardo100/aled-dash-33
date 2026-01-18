import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { useDemandGoals } from '@/hooks/useDemandGoals';
import { useDemandMetrics } from '@/hooks/useDemandMetrics';
import { GoalsConfigSheet } from '@/components/demand/GoalsConfigSheet';
import { ExecutiveCards } from '@/components/demand/ExecutiveCards';
import { GoalGaugeChart } from '@/components/demand/GoalGaugeChart';
import { DailyProgressChart } from '@/components/demand/DailyProgressChart';
import { ChannelShareChart } from '@/components/demand/ChannelShareChart';
import { ChannelPerformanceTable } from '@/components/demand/ChannelPerformanceTable';
import { GoalComparisonChart } from '@/components/dashboard/GoalComparisonChart';
import { Loader2, BarChart4, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DemandGenerationPage: React.FC = () => {
    // Fetch ALL data by passing undefined date filters
    // This allows useDemandMetrics to have access to full history for its own filtering logic
    const { deals, isLoading, error, refetch, channelPerformance, novosLeadsMetrics } = useFilteredDashboard(
        { startDate: undefined, endDate: undefined }, // Open filter = all data
        null, // source
        null, // uf
        null  // regional
    );

    const { goals, updateGoals, resetToDefaults } = useDemandGoals();
    
    // Transform useFilteredDashboard's pre-segmented data to the structure useDemandMetrics expects
    const dealsData = React.useMemo(() => {
        if (!deals || !deals.por_status) {
            return { ganhos: [], perdidos: [], andamento: [] };
        }
        return {
            ganhos: deals.por_status.ganhos || [],
            perdidos: deals.por_status.perdidos || [],
            andamento: deals.por_status.andamento || []
        };
    }, [deals]);

    const metrics = useDemandMetrics(dealsData, goals);

    if (isLoading) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background">
                    <DashboardSidebar />
                    <main className="flex-1 p-6 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Carregando dados...</p>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        );
    }

    if (error) {
        return (
            <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background">
                    <DashboardSidebar />
                    <main className="flex-1 p-6 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-red-400 mb-4">Erro ao carregar dados</p>
                            <Button onClick={() => refetch()}>Tentar Novamente</Button>
                        </div>
                    </main>
                </div>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-background">
                <DashboardSidebar />
                <main className="flex-1 p-6 overflow-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <BarChart4 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Geração de Demanda</h1>
                                <p className="text-sm text-muted-foreground">
                                    Acompanhamento de metas mensais por canal
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => refetch()}
                                disabled={isLoading}
                                className="mr-2"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                            <GoalsConfigSheet 
                                goals={goals}
                                onSave={updateGoals}
                                onReset={resetToDefaults}
                            />
                        </div>
                    </div>

                    {/* Executive Summary Cards */}
                    <div className="mb-6">
                        <ExecutiveCards metrics={metrics} />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="lg:col-span-1">
                            <GoalGaugeChart metrics={metrics} />
                        </div>
                        <div className="lg:col-span-2">
                            <DailyProgressChart metrics={metrics} />
                        </div>
                    </div>

                    {/* NEW: Goal Comparison & Novos Leads Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <GoalComparisonChart data={(() => {
                            if (!channelPerformance) return [];
                            return channelPerformance.map(item => {
                                let key: any = '';
                                if (item.name === 'Google') key = 'google';
                                else if (item.name === 'Meta') key = 'meta';
                                else if (item.name === 'Indicação Profissional') key = 'indicacaoProfissional';
                                else if (item.name === 'LTV') key = 'ltv';
                                else if (item.name === 'Indicação Amigo') key = 'indicacaoAmigo';
                                else if (item.name === 'Novos Leads/Clientes') key = 'novosLeads';

                                if (key && goals) {
                                    return {
                                        ...item,
                                        revenueTarget: goals.faturamento[key] || item.revenueTarget,
                                        oppsTarget: goals.oportunidades[key] || item.oppsTarget
                                    };
                                }
                                return item;
                            });
                        })()} />
                        
                        {/* Novos Leads KPI Card */}
                         <div className="lg:col-span-1 space-y-4">
                            <div className="bg-card text-card-foreground rounded-xl border shadow-sm p-6">
                                <div className="flex flex-col space-y-1.5 p-0">
                                    <h3 className="font-semibold leading-none tracking-tight text-emerald-500">Novos Clientes (Ganhos)</h3>
                                    <p className="text-sm text-muted-foreground">Performance acumulada</p>
                                </div>
                                <div className="p-0 pt-4 content-center">
                                    <div className="text-3xl font-bold">
                                        {novosLeadsMetrics ? novosLeadsMetrics.count : 0}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Negócios fechados
                                    </p>
                                    <div className="mt-4 pt-4 border-t">
                                        <div className="text-2xl font-bold text-emerald-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(novosLeadsMetrics?.revenue || 0)}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Receita gerada
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Second Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                        <div className="lg:col-span-1">
                            <ChannelShareChart metrics={metrics} />
                        </div>
                        <div className="lg:col-span-2">
                            <ChannelPerformanceTable metrics={metrics} />
                        </div>
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
};

export default DemandGenerationPage;
