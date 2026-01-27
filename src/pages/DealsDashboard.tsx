import { useState } from 'react';
import { DollarSign, Target, XCircle, Store, Briefcase, TrendingUp } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth } from 'date-fns';

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

  // Use the filtered dashboard hook
  const {
    deals,
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
    </DashboardLayout>
  );
}
