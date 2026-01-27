import { useState, useMemo, useEffect } from 'react';
import { DollarSign, Target, XCircle, Store, Briefcase, TrendingUp, Users, ArrowRight, Wallet, HelpCircle, CheckCircle2, Clock, AlertCircle, Loader2, User, Tag, ExternalLink, ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { DrillDownModal } from '@/components/dashboard/DrillDownModal';
import { MonthlyGoalSection } from '@/components/dashboard/MonthlyGoalSection';
import { DealsTimelineChart } from '@/components/dashboard/DealsTimelineChart';
import { RevenueBySourceChart } from '@/components/dashboard/RevenueBySourceChart';
import { DealsBrazilHeatMap } from '@/components/dashboard/DealsBrazilHeatMap';
import { SegmentAnalysisChart } from '@/components/dashboard/SegmentAnalysisChart';
import { SegmentPerformanceChart } from '@/components/dashboard/SegmentPerformanceChart';
import { DealLossReasonChart } from '@/components/dashboard/DealLossReasonChart';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { SegmentedDeal, DealsByStatus, DateFilter } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeadToCloseTimeChart } from '@/components/dashboard/LeadToCloseTimeChart';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { HoverScrollContainer } from '@/components/dashboard/HoverScrollContainer';
import { startOfMonth, endOfMonth, isSameMonth, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { bitrixService, BitrixLead } from '@/services/bitrixService';
import { getFriendlySourceName } from '@/utils/sourceMapping';
import ReactECharts from 'echarts-for-react';

// ========== MODAL STATE TYPES ==========
interface ModalState {
  isOpen: boolean;
  title: string;
  data?: SegmentedDeal[];
  segmentedData?: DealsByStatus;
}

// ========== HELPERS ==========
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// ========== MAIN COMPONENT ==========
export default function DealsDashboard() {
  // Filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [sourceFilter, setSourceFilter] = useState('Todos');
  const [ufFilter, setUfFilter] = useState('Todos');
  const [regionalFilter, setRegionalFilter] = useState('Todos');
  const [funnelFilter, setFunnelFilter] = useState('Todos');

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
  });

  // Sidebar state for closing time chart
  const [timeRangeModalData, setTimeRangeModalData] = useState<{ range: string; deals: SegmentedDeal[] } | null>(null);
  const [selectedJourneyDeal, setSelectedJourneyDeal] = useState<SegmentedDeal | null>(null);


  // Use the filtered dashboard hook
  const {
    deals,
    leads,
    metrics,
    availableSources,
    availableUfs,
    availableRegionals,
    availableFunnels,
    convertedBreakdown,
    dealLossReasons,
    monthlyGoal,
    isLoading,
    isSyncing,
    error,
    refetch
  } = useFilteredDashboard(
    dateFilter,
    sourceFilter === 'Todos' ? null : sourceFilter,
    ufFilter === 'Todos' ? null : ufFilter,
    regionalFilter === 'Todos' ? null : regionalFilter,
    funnelFilter === 'Todos' ? null : funnelFilter
  );

  // ========== SAFRA (COHORT) METRICS ==========
  // Strict logic: Created in the selected period AND matches other filters
  const safraMetrics = useMemo(() => {
    if (!deals) return null;

    // Helper to check if deal was created in the current date filter range
    // We use the dateFilter state directly
    const isCreatedInPeriod = (dateStr: string) => {
      const date = new Date(dateStr);
      if (!dateFilter.startDate || !dateFilter.endDate) return true;
      return date >= dateFilter.startDate && date <= dateFilter.endDate;
    };

    // 1. Filter ALL deals (active + closed) that were CREATED in this period
    // The hook returns:
    // - andamento: Created In Range (because if Open, hook checks creation)
    // - ganhos/perdidos: Closed In Range (hook checks closing). We must re-filter these by CREATION.

    const createdAndamento = deals.por_status.andamento; // Inherently created in range if open
    const createdGanhos = deals.por_status.ganhos.filter(d => isCreatedInPeriod(d.data_criacao));
    const createdPerdidos = deals.por_status.perdidos.filter(d => isCreatedInPeriod(d.data_criacao));

    const safraDeals = [...createdAndamento, ...createdGanhos, ...createdPerdidos];

    const countTotal = safraDeals.length;

    // Demanda Orçada (Sum of all created this month)
    const demandaOrcada = safraDeals.reduce((acc, d) => acc + (d.valor || 0), 0);

    // Ticket Médio Orçado
    const ticketMedioOrcado = countTotal > 0 ? demandaOrcada / countTotal : 0;

    // Pipeline em Negociação (Subset of Safra that is still Open)
    // Note: Technically 'createdAndamento' is exactly this, but let's be safe
    // Wait: If I create a deal this month and it is still open, it is in 'andamento'.
    // If I create a deal this month and it is WON, it is in 'createdGanhos'.
    const pipelineCount = createdAndamento.length;
    const pipelineValue = createdAndamento.reduce((acc, d) => acc + (d.valor || 0), 0);

    // Vendas Fechadas (Subset of Safra that is WON)
    const wonCount = createdGanhos.length;
    const wonValue = createdGanhos.reduce((acc, d) => acc + (d.valor || 0), 0);

    // Perdidos (Subset of Safra that is LOST)
    const lostCount = createdPerdidos.length;
    const lostValue = createdPerdidos.reduce((acc, d) => acc + (d.valor || 0), 0);

    // Ticket Médio Fechado (Of the won subset)
    const ticketMedioFechado = wonCount > 0 ? wonValue / wonCount : 0;

    return {
      safraDeals,
      oportunidadesGeradas: countTotal,
      demandaOrcada,
      ticketMedioOrcado,
      pipelineCount,
      pipelineValue,
      wonCount,
      wonValue,
      lostCount,
      lostValue,
      ticketMedioFechado
    };
  }, [deals, dateFilter]);

  // ========== FUNNEL METRICS ==========
  const funnelMetrics = useMemo(() => {
    // Use the 'leads' from the hook which are already filtered by Date (Creation)
    // and other filters.
    const totalLeads = leads ? (leads.em_atendimento.length + leads.convertidos.length + leads.descartados.length) : 0;
    const totalDeals = safraMetrics?.oportunidadesGeradas || 0;
    const totalWon = safraMetrics?.wonCount || 0;

    const conversionRate = totalLeads > 0 ? ((totalDeals / totalLeads) * 100).toFixed(1) : '0';
    const wonRate = totalDeals > 0 ? ((totalWon / totalDeals) * 100).toFixed(1) : '0';

    return {
      totalLeads,
      totalDeals,
      totalWon,
      conversionRate,
      wonRate,
      wonValue: safraMetrics?.wonValue || 0
    };
  }, [leads, safraMetrics]);

  // Determine allDeals for Closing Time Chart (Using general 'allDeals' context or Safra?)
  // User says "Tempo de Fechamento ... que tem lá em Relatório de Conversão".
  // The Report uses "allDeals" (closed in range).
  // "Business Generated" generally refers to closed.
  // I will pass the general 'allDeals' (closed in range) to the chart, not just Safra,
  // because typically you analyze closing time of *closed* deals in the period.

  const allClosedDealsForTimeChart = [...deals.por_status.ganhos, ...deals.por_status.perdidos];

  // Modal handlers
  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const openDealList = (title: string, data: SegmentedDeal[]) => {
    setModalState({
      isOpen: true,
      title,
      data,
    });
  };

  const openSegmentedDeals = (title: string, segmentedData: DealsByStatus) => {
    setModalState({
      isOpen: true,
      title,
      segmentedData,
    });
  };

  // Click handlers
  const handleFaturamentoClick = () => openDealList('Faturamento (Ganhos)', deals.por_status.ganhos);
  const handlePipelineClick = () => openDealList('Pipeline (Em Andamento)', deals.por_status.andamento);
  const handlePerdidosClick = () => openDealList('Negócios Perdidos', deals.por_status.perdidos);

  const handleVarejoClick = () => openSegmentedDeals('Negócios - Varejo', deals.por_segmento.varejo);
  const handleProjetoClick = () => openSegmentedDeals('Negócios - Projeto', deals.por_segmento.projeto);

  const handleRevenueSourceClick = (source: string, sourceDeals: SegmentedDeal[]) => {
    openDealList(`Receita: ${source}`, sourceDeals);
  };

  const handleStateClick = (uf: string, stateDeals: SegmentedDeal[]) => {
    openDealList(`Estado: ${uf}`, stateDeals);
  };

  const handleLossReasonClick = (reason: string) => {
    const subset = deals.por_status.perdidos.filter(d => (d.motivo_perda || 'Não informado') === reason);
    openDealList(`Perda: ${reason}`, subset);
  };

  const handleSegmentBreakdownClick = (segment: string) => {
    if (segment.toLowerCase() === 'varejo') handleVarejoClick();
    else if (segment.toLowerCase() === 'projeto') handleProjetoClick();
  };

  const handleSegmentPerformanceClick = (segment: string, status: string) => {
    const segmentData = segment === 'varejo' ? deals.por_segmento.varejo : deals.por_segmento.projeto;
    const statusData = segmentData[status as keyof DealsByStatus] || [];
    openDealList(`${segment === 'varejo' ? 'Varejo' : 'Projeto'} - ${status}`, statusData);
  };

  // All deals for charts
  const allDeals = [...deals.por_status.ganhos, ...deals.por_status.perdidos, ...deals.por_status.andamento];
  const ganhosDeals = deals.por_status.ganhos;

  // Calculate segment totals
  const varejoTotal = deals.por_segmento.varejo.ganhos.length +
    deals.por_segmento.varejo.andamento.length +
    deals.por_segmento.varejo.perdidos.length;

  const projetoTotal = deals.por_segmento.projeto.ganhos.length +
    deals.por_segmento.projeto.andamento.length +
    deals.por_segmento.projeto.perdidos.length;

  // Calculate revenue by segment
  const varejoRevenue = deals.por_segmento.varejo.ganhos.reduce((acc, d) => acc + (d.valor || 0), 0);
  const projetoRevenue = deals.por_segmento.projeto.ganhos.reduce((acc, d) => acc + (d.valor || 0), 0);

  // ========== ERROR STATE ==========
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive text-lg">Erro ao carregar dados</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
          regionalFilter={regionalFilter}
          onRegionalFilterChange={setRegionalFilter}
          availableRegionals={availableRegionals}
          funnelFilter={funnelFilter}
          onFunnelFilterChange={setFunnelFilter}
          availableFunnels={availableFunnels}
          onRefresh={refetch}
          isLoading={isLoading}
          isSyncing={isSyncing}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Monthly Goal Section */}
        <MonthlyGoalSection metrics={monthlyGoal} isSyncing={isSyncing} />

        {/* Row 1: Financial KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
          ) : (
            <>
              <Card className="cursor-pointer hover:scale-[1.02] transition-all border-primary/50 bg-primary/5" onClick={handleFaturamentoClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
                  <div className="p-2 rounded-lg bg-primary/20 text-primary"><DollarSign className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.faturamentoTotal)}</div>
                  <p className="text-xs text-muted-foreground">{metrics.totalDealsGanhos} negócios ganhos</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:scale-[1.02] transition-all border-warning/50 bg-warning/5" onClick={handlePipelineClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline</CardTitle>
                  <div className="p-2 rounded-lg bg-warning/20 text-warning"><Target className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.pipelineTotal)}</div>
                  <p className="text-xs text-muted-foreground">{metrics.totalDealsAndamento} em andamento</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:scale-[1.02] transition-all border-destructive/50 bg-destructive/5" onClick={handlePerdidosClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Perdidos</CardTitle>
                  <div className="p-2 rounded-lg bg-destructive/20 text-destructive"><XCircle className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.perdidosTotal)}</div>
                  <p className="text-xs text-muted-foreground">{metrics.totalDealsPerdidos} negócios perdidos</p>
                </CardContent>
              </Card>

              <Card className="hover:scale-[1.02] transition-all border-secondary/50 bg-secondary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                  <div className="p-2 rounded-lg bg-secondary/20 text-secondary-foreground"><TrendingUp className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</div>
                  <p className="text-xs text-muted-foreground">Por negócio ganho</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Row 2: Segment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
          ) : (
            <>
              <Card className="cursor-pointer hover:scale-[1.02] transition-all border-info/50 bg-info/5" onClick={handleVarejoClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Varejo</CardTitle>
                  <div className="p-2 rounded-lg bg-info/20 text-info"><Store className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{varejoTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    {deals.por_segmento.varejo.ganhos.length} ganhos • {deals.por_segmento.varejo.andamento.length} andamento • {deals.por_segmento.varejo.perdidos.length} perdidos
                  </p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:scale-[1.02] transition-all border-secondary/50 bg-secondary/5" onClick={handleProjetoClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Projeto</CardTitle>
                  <div className="p-2 rounded-lg bg-secondary/20 text-secondary-foreground"><Briefcase className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{projetoTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    {deals.por_segmento.projeto.ganhos.length} ganhos • {deals.por_segmento.projeto.andamento.length} andamento • {deals.por_segmento.projeto.perdidos.length} perdidos
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>


        {/* ========== NEW SECTION: FUNNEL & TIMING ========== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Funnel Chart (Occupies 2/3) */}
          <div className="xl:col-span-2 h-full">
            <Card className="h-full bg-gradient-to-br from-card via-card to-muted/10 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Funil de Conversão (Safra)
                </CardTitle>
                <CardDescription>Fluxo de conversão dos leads criados no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[480px] w-full" />
                ) : (
                  <>
                    {/* KPI Cards - 2 Rows x 3 Columns */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {/* Row 1 */}
                      {/* Demanda Orçada (Valor das Oportunidades) */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/20">
                        <div className="flex items-center gap-2 text-xs text-amber-400 mb-2">
                          <Wallet className="h-4 w-4" />
                          Demanda Orçada
                        </div>
                        <div className="text-2xl font-bold text-amber-500">{formatCurrency(safraMetrics?.demandaOrcada || 0)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{safraMetrics?.oportunidadesGeradas || 0} oportunidades</div>
                      </div>

                      {/* Receita (Vendas Fechadas) */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/20">
                        <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
                          <DollarSign className="h-4 w-4" />
                          Receita (Fechadas)
                        </div>
                        <div className="text-2xl font-bold text-emerald-500">{formatCurrency(funnelMetrics.wonValue)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{funnelMetrics.totalWon} vendas</div>
                      </div>

                      {/* Ticket Médio (Fechado + Orçado) */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/20">
                        <div className="flex items-center gap-2 text-xs text-purple-400 mb-3">
                          <Target className="h-4 w-4" />
                          Ticket Médio
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 rounded-lg bg-purple-500/10">
                            <div className="text-[10px] text-muted-foreground mb-1">Fechado</div>
                            <div className="text-lg font-bold text-purple-500">
                              {funnelMetrics.totalWon > 0 ? formatCurrency(funnelMetrics.wonValue / funnelMetrics.totalWon) : 'R$ 0'}
                            </div>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-amber-500/10">
                            <div className="text-[10px] text-muted-foreground mb-1">Orçado</div>
                            <div className="text-lg font-bold text-amber-500">
                              {formatCurrency(safraMetrics?.ticketMedioOrcado || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Row 2 */}
                      {/* Conversão Lead → Oportunidade */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-600/5 border border-blue-500/20">
                        <div className="flex items-center gap-2 text-xs text-blue-400 mb-2">
                          <TrendingUp className="h-4 w-4" />
                          Conversão Lead → Oport.
                        </div>
                        <div className="text-2xl font-bold text-blue-500">{funnelMetrics.conversionRate}%</div>
                        <div className="text-xs text-muted-foreground mt-1">{funnelMetrics.totalDeals} de {funnelMetrics.totalLeads} leads</div>
                      </div>

                      {/* Conversão Oportunidade → Venda */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/15 to-green-600/5 border border-green-500/20">
                        <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Conversão Oport. → Venda
                        </div>
                        <div className="text-2xl font-bold text-green-500">{funnelMetrics.wonRate}%</div>
                        <div className="text-xs text-muted-foreground mt-1">{funnelMetrics.totalWon} de {funnelMetrics.totalDeals} oportunidades</div>
                      </div>

                      {/* Loss Rate */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/15 to-red-600/5 border border-red-500/20">
                        <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                          <XCircle className="h-4 w-4" />
                          Taxa de Perda
                        </div>
                        <div className="text-xl font-bold text-red-500">
                          {formatCurrency(safraMetrics?.lostValue || 0)}{' '}
                          <span className="text-base font-semibold">
                            ({safraMetrics && safraMetrics.oportunidadesGeradas > 0
                              ? ((safraMetrics.lostCount / safraMetrics.oportunidadesGeradas) * 100).toFixed(1)
                              : '0'}%)
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{safraMetrics?.lostCount || 0} perdidos</div>
                      </div>
                    </div>

                    {/* Funnel Chart - Full Width, Larger */}
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'item',
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          textStyle: { color: '#fff', fontSize: 13 },
                          padding: [12, 16],
                          formatter: (params: any) => {
                            const name = params.name;
                            const value = params.value;
                            if (name === 'Leads') {
                              return `<strong style="font-size:15px">${name}</strong><br/><br/>Total: <strong>${value.toLocaleString('pt-BR')}</strong>`;
                            } else if (name === 'Oportunidades') {
                              return `<strong style="font-size:15px">${name}</strong><br/><br/>Total: <strong>${value.toLocaleString('pt-BR')}</strong><br/>Valor: <strong style="color:#f59e0b">${formatCurrency(safraMetrics?.demandaOrcada || 0)}</strong><br/>Conversão: <strong style="color:#3b82f6">${funnelMetrics.conversionRate}%</strong> dos leads`;
                            } else if (name === 'Vendas') {
                              return `<strong style="font-size:15px">${name}</strong><br/><br/>Quantidade: <strong>${value.toLocaleString('pt-BR')}</strong><br/>Receita: <strong style="color:#22c55e">${formatCurrency(funnelMetrics.wonValue)}</strong><br/>Taxa: <strong style="color:#22c55e">${funnelMetrics.wonRate}%</strong> das oportunidades`;
                            }
                            return `${name}: ${value}`;
                          }
                        },
                        legend: { show: false },
                        series: [
                          {
                            name: 'Funil de Conversão',
                            type: 'funnel',
                            left: '5%',
                            top: 10,
                            bottom: 10,
                            width: '85%',
                            min: 0,
                            max: Math.max(funnelMetrics.totalLeads, 1),
                            minSize: '25%',
                            maxSize: '100%',
                            sort: 'descending',
                            gap: 10,
                            label: {
                              show: true,
                              position: 'inside',
                              formatter: (params: any) => {
                                return `{title|${params.name}}\n{value|${params.value.toLocaleString('pt-BR')}}`;
                              },
                              rich: {
                                title: {
                                  fontSize: 16,
                                  fontWeight: 'bold',
                                  color: '#fff',
                                  textShadowColor: 'rgba(0,0,0,0.5)',
                                  textShadowBlur: 8
                                },
                                value: {
                                  fontSize: 28,
                                  fontWeight: 'bold',
                                  color: '#fff',
                                  textShadowColor: 'rgba(0,0,0,0.5)',
                                  textShadowBlur: 8,
                                  padding: [8, 0, 0, 0]
                                }
                              }
                            },
                            labelLine: { show: false },
                            itemStyle: {
                              borderColor: 'rgba(255,255,255,0.3)',
                              borderWidth: 2
                            },
                            emphasis: {
                              label: { fontSize: 18 },
                              itemStyle: { shadowBlur: 30, shadowColor: 'rgba(0,0,0,0.5)' }
                            },
                            data: [
                              {
                                value: funnelMetrics.totalLeads,
                                name: 'Leads',
                                itemStyle: {
                                  color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 1, y2: 0,
                                    colorStops: [
                                      { offset: 0, color: 'hsl(217, 91%, 60%)' },
                                      { offset: 1, color: 'hsl(217, 91%, 45%)' }
                                    ]
                                  }
                                }
                              },
                              {
                                value: funnelMetrics.totalDeals,
                                name: 'Oportunidades',
                                itemStyle: {
                                  color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 1, y2: 0,
                                    colorStops: [
                                      { offset: 0, color: 'hsl(38, 92%, 50%)' },
                                      { offset: 1, color: 'hsl(32, 95%, 44%)' }
                                    ]
                                  }
                                }
                              },
                              {
                                value: funnelMetrics.totalWon,
                                name: 'Vendas',
                                itemStyle: {
                                  color: {
                                    type: 'linear',
                                    x: 0, y: 0, x2: 1, y2: 0,
                                    colorStops: [
                                      { offset: 0, color: 'hsl(142, 71%, 45%)' },
                                      { offset: 1, color: 'hsl(142, 76%, 35%)' }
                                    ]
                                  }
                                }
                              }
                            ]
                          }
                        ]
                      }}
                      style={{ height: '360px', width: '100%' }}
                      opts={{ renderer: 'svg' }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Closing Time Chart (Occupies 1/3) */}
          <div className="xl:col-span-1 h-full">
            {isLoading ? (
              <Skeleton className="h-full rounded-lg" />
            ) : (
              <div className="h-full">
                <LeadToCloseTimeChart
                  deals={allClosedDealsForTimeChart}
                  onBarClick={(range, rangeDeals) => setTimeRangeModalData({ range, deals: rangeDeals })}
                  onDealClick={(deal) => setSelectedJourneyDeal(deal)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Deals Timeline (full width) */}
        <div className="w-full">
          {isLoading ? (
            <Skeleton className="h-[400px] rounded-lg" />
          ) : (
            <DealsTimelineChart deals={{ ganhos: deals.por_status.ganhos, perdidos: deals.por_status.perdidos }} />
          )}
        </div>

        {/* Row 4: Revenue by Source + Segment Analysis (merged) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px] rounded-lg" />
              <Skeleton className="h-[400px] rounded-lg" />
            </>
          ) : (
            <>
              <RevenueBySourceChart deals={ganhosDeals} onBarClick={handleRevenueSourceClick} />
              <SegmentPerformanceChart
                varejo={deals.por_segmento.varejo}
                projeto={deals.por_segmento.projeto}
                onSegmentClick={handleSegmentPerformanceClick}
              />
            </>
          )}
        </div>

        {/* Row 5: Segment Analysis (NEW merged chart) + Loss Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[350px] rounded-lg" />
              <Skeleton className="h-[350px] rounded-lg" />
            </>
          ) : (
            <>
              <SegmentAnalysisChart
                varejo={deals.por_segmento.varejo}
                projeto={deals.por_segmento.projeto}
                varejoSources={convertedBreakdown.varejoSources}
                projetoSources={convertedBreakdown.projetoSources}
                onSegmentClick={handleSegmentBreakdownClick}
              />
              <DealLossReasonChart
                data={dealLossReasons}
                onReasonClick={handleLossReasonClick}
              />
            </>
          )}
        </div>

        {/* Row 7: Geographic Distribution */}
        <div className="w-full">
          {isLoading ? (
            <Skeleton className="h-[550px] rounded-lg" />
          ) : (
            <DealsBrazilHeatMap
              deals={allDeals}
              onStateClick={handleStateClick}
            />
          )}
        </div>
      </div>

      {/* Drill-down Modal */}
      <DrillDownModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        data={modalState.data}
        type="deal"
        segmentedData={modalState.segmentedData}
        showSource={true}
      />

      {/* Time Range Deals Sidebar */}
      {timeRangeModalData && (
        <Sheet open={!!timeRangeModalData} onOpenChange={(open) => !open && setTimeRangeModalData(null)}>
          <SheetContent className="sm:max-w-[700px] overflow-y-auto">
            <SheetHeader className="mb-4">
              <SheetTitle>Negócios Fechados: {timeRangeModalData.range}</SheetTitle>
              <SheetDescription>
                {timeRangeModalData.deals.length} negócios fecharam neste período
              </SheetDescription>
            </SheetHeader>
            <ClosingTimeDealsListWithJourney
              deals={timeRangeModalData.deals}
              onViewJourney={(deal) => setSelectedJourneyDeal(deal)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Customer Journey Sidebar */}
      {selectedJourneyDeal && (
        <CustomerJourneySheet
          deal={selectedJourneyDeal}
          open={!!selectedJourneyDeal}
          onOpenChange={(open) => !open && setSelectedJourneyDeal(null)}
        />
      )}
    </DashboardLayout>
  );
}

// ========== CLOSING TIME DEALS LIST WITH JOURNEY ==========
const ITEMS_PER_PAGE = 10;
type SortKey = 'titulo' | 'valor' | 'fonte' | 'status_nome' | 'data_criacao';
type SortDirection = 'asc' | 'desc';

interface ClosingTimeDealsListProps {
  deals: SegmentedDeal[];
  onViewJourney: (deal: SegmentedDeal) => void;
}

function ClosingTimeDealsListWithJourney({ deals, onViewJourney }: ClosingTimeDealsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'data_criacao', direction: 'desc' });

  const formatCurrencyLocal = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Filter by search
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return deals;
    const query = searchQuery.toLowerCase();
    return deals.filter(deal =>
      deal.titulo?.toLowerCase().includes(query) ||
      deal.id?.toString().includes(query) ||
      deal.fonte?.toLowerCase().includes(query)
    );
  }, [deals, searchQuery]);

  // Sort deals
  const sortedDeals = useMemo(() => {
    const sorted = [...filteredDeals];
    sorted.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];

      if (sortConfig.key === 'data_criacao') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      }
      if (sortConfig.key === 'valor') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      }
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'string' && typeof valB === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredDeals, sortConfig]);

  const totalPages = Math.ceil(sortedDeals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDeals = sortedDeals.slice(startIndex, endIndex);

  const handleSort = (key: SortKey) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (deals.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhum negócio encontrado para este período.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome, ID ou fonte..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Table */}
      <HoverScrollContainer>
        <table className="w-full caption-bottom text-sm text-left min-w-[600px]">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50">
              <th className="h-10 px-3 align-middle font-medium text-muted-foreground w-8">#</th>
              <th
                className="h-10 px-3 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('titulo')}
              >
                <div className="flex items-center gap-1">
                  Título
                  <ArrowUpDown className={`h-3 w-3 ${sortConfig.key === 'titulo' ? 'opacity-100 text-primary' : 'opacity-50'}`} />
                </div>
              </th>
              <th
                className="h-10 px-3 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('valor')}
              >
                <div className="flex items-center gap-1">
                  Valor
                  <ArrowUpDown className={`h-3 w-3 ${sortConfig.key === 'valor' ? 'opacity-100 text-primary' : 'opacity-50'}`} />
                </div>
              </th>
              <th
                className="h-10 px-3 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => handleSort('status_nome')}
              >
                <div className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className={`h-3 w-3 ${sortConfig.key === 'status_nome' ? 'opacity-100 text-primary' : 'opacity-50'}`} />
                </div>
              </th>
              <th className="h-10 px-3 align-middle font-medium text-muted-foreground text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {paginatedDeals.map((deal, index) => (
              <tr key={deal.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-3 align-middle text-muted-foreground text-xs">{startIndex + index + 1}</td>
                <td className="p-3 align-middle font-medium max-w-[200px] truncate">{deal.titulo}</td>
                <td className="p-3 align-middle text-emerald-500 font-semibold">{formatCurrencyLocal(Number(deal.valor))}</td>
                <td className="p-3 align-middle">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${deal.status_nome === 'Ganho' ? 'bg-emerald-500/20 text-emerald-500' :
                    deal.status_nome === 'Perdido' ? 'bg-red-500/20 text-red-500' :
                      'bg-amber-500/20 text-amber-500'
                    }`}>
                    {deal.status_nome}
                  </span>
                </td>
                <td className="p-3 align-middle text-right">
                  <button
                    onClick={() => onViewJourney(deal)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                  >
                    Ver Jornada
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </HoverScrollContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 disabled:opacity-50"
            >
              Próximo <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== CUSTOMER JOURNEY SHEET ==========
function CustomerJourneySheet({ deal, open, onOpenChange }: { deal: SegmentedDeal, open: boolean, onOpenChange: (o: boolean) => void }) {
  const [lead, setLead] = useState<BitrixLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchMethod, setSearchMethod] = useState<'id' | 'phone' | 'none'>('none');

  useEffect(() => {
    const fetchLead = async () => {
      if (!open) {
        setLead(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setSearchMethod('none');

      try {
        // Strategy 1: Try by id_lead if available
        if (deal?.id_lead) {
          const leadById = await bitrixService.getLead(deal.id_lead);
          if (leadById) {
            setLead(leadById);
            setSearchMethod('id');
            setLoading(false);
            return;
          }
        }

        // Strategy 2: Try by phone number
        if (deal?.telefone) {
          const leadByPhone = await bitrixService.searchLeadByPhone(deal.telefone);
          if (leadByPhone) {
            setLead(leadByPhone);
            setSearchMethod('phone');
            setLoading(false);
            return;
          }
        }

        setLead(null);
        setSearchMethod('none');
      } catch (error) {
        console.error('Error fetching lead:', error);
        setLead(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [deal, open]);

  const formatCurrencyLocal = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto bg-gradient-to-b from-background to-muted/20">
        <SheetHeader className="mb-6 pb-4 border-b">
          <SheetTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Jornada do Cliente
          </SheetTitle>
          <SheetDescription>Rastreabilidade completa do Lead ao Negócio fechado.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* 1. LEAD ORIGIN */}
          <div className="relative pl-10 pb-6">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-primary to-primary/30" />
            <div className="absolute left-[-4px] top-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">1</div>

            <div className="mb-2 text-sm font-bold text-primary flex items-center gap-2">
              <User className="h-4 w-4" /> Origem (Lead)
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 rounded-lg bg-muted/30">
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando dados no Bitrix...
              </div>
            ) : lead ? (
              <Card className="bg-muted/30 border-primary/20">
                <CardContent className="p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-base">{lead.TITLE}</div>
                    {searchMethod === 'phone' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-500">
                        📱 Encontrado por Telefone
                      </span>
                    )}
                    {searchMethod === 'id' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                        🔗 Vínculo id_lead
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground text-xs">
                    <div className="flex items-center gap-1"><span className="opacity-60">Criação:</span></div>
                    <div className="font-medium text-foreground">{format(new Date(lead.DATE_CREATE), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                    <div className="flex items-center gap-1"><Tag className="h-3 w-3 opacity-60" /><span className="opacity-60">Fonte:</span></div>
                    <div className="font-medium text-foreground">{getFriendlySourceName(lead.SOURCE_ID)}</div>
                  </div>
                  <a href={`https://atacadaoled.bitrix24.com.br/crm/lead/details/${lead.ID}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                    <ExternalLink className="h-3 w-3" /> Abrir no Bitrix
                  </a>
                </CardContent>
              </Card>
            ) : (
              <div className="text-sm p-4 rounded-lg bg-muted/30 border border-muted">
                <p className="text-muted-foreground mb-2">Não foi possível localizar o Lead de origem.</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  {deal.id_lead && <p>✗ Busca por id_lead ({deal.id_lead}): não encontrado</p>}
                  {deal.telefone && <p>✗ Busca por telefone ({deal.telefone}): não encontrado</p>}
                  {!deal.id_lead && !deal.telefone && <p>✗ Negócio sem id_lead e sem telefone</p>}
                </div>
              </div>
            )}
          </div>

          {/* 2. CONVERSION */}
          <div className="relative pl-10 pb-6">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-primary/30 to-amber-500" />
            <div className="absolute left-[-4px] top-0 h-6 w-6 rounded-full bg-primary/50 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">2</div>

            <div className="mb-2 text-sm font-bold text-foreground flex items-center gap-2">
              <ArrowRight className="h-4 w-4" /> Conversão
            </div>
            <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/20">
              O lead foi qualificado e convertido em negócio comercial.
            </div>
          </div>

          {/* 3. DEAL GENERATED */}
          <div className="relative pl-10 pb-6">
            <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-amber-500 to-emerald-500" />
            <div className="absolute left-[-4px] top-0 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">3</div>

            <div className="mb-2 text-sm font-bold text-amber-500 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Negócio Gerado
            </div>
            <Card className="bg-muted/30 border-amber-500/20">
              <CardContent className="p-4 space-y-3 text-sm">
                <div className="font-semibold text-base">{deal.titulo}</div>
                <div className="text-2xl font-bold text-emerald-500">{formatCurrencyLocal(Number(deal.valor))}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground text-xs">
                  <div><span className="opacity-60">Criação Deal:</span></div>
                  <div className="font-medium text-foreground">{format(new Date(deal.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                  <div className="flex items-center gap-1"><Tag className="h-3 w-3 opacity-60" /><span className="opacity-60">Fonte:</span></div>
                  <div className="font-medium text-foreground">{deal.fonte}</div>
                  <div><span className="opacity-60">Responsável:</span></div>
                  <div className="font-medium text-foreground">{deal.responsavel_nome}</div>
                </div>
                {deal.link_bitrix && (
                  <a href={deal.link_bitrix} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                    <ExternalLink className="h-3 w-3" /> Abrir Negócio no Bitrix
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 4. CLOSING */}
          <div className="relative pl-10 pb-2">
            <div className={`absolute left-[-4px] top-0 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${deal.status_nome === 'Ganho' ? 'bg-emerald-500' : deal.status_nome === 'Perdido' ? 'bg-red-500' : 'bg-amber-500'}`}>4</div>

            <div className={`mb-2 text-sm font-bold flex items-center gap-2 ${deal.status_nome === 'Ganho' ? 'text-emerald-500' : deal.status_nome === 'Perdido' ? 'text-red-500' : 'text-amber-500'}`}>
              <CheckCircle2 className="h-4 w-4" /> {deal.status_nome === 'Ganho' || deal.status_nome === 'Perdido' ? 'Fechamento' : 'Em Andamento'}
            </div>
            {deal.data_fechamento ? (
              <Card className={`bg-muted/30 ${deal.status_nome === 'Ganho' ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                <CardContent className="p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-lg ${deal.status_nome === 'Ganho' ? 'text-emerald-500' : 'text-red-500'}`}>{deal.status_nome}</span>
                    {deal.status_nome === 'Ganho' && (
                      <span className="text-lg font-bold text-emerald-500">{formatCurrencyLocal(Number(deal.valor))}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Data de Fechamento: <span className="font-medium text-foreground">{format(new Date(deal.data_fechamento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  {deal.status_nome === 'Perdido' && deal.motivo_perda && (
                    <div className="text-xs text-red-400 mt-2 p-2 rounded bg-red-500/10">
                      Motivo da Perda: {deal.motivo_perda}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/20">
                Negócio ainda em andamento. Valor potencial: <strong className="text-amber-500">{formatCurrencyLocal(Number(deal.valor))}</strong>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
