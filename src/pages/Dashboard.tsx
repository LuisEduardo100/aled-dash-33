import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, TrendingUp, DollarSign, Target, Store, Briefcase, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KPICard } from '@/components/dashboard/KPICard';
import { DrillDownModal } from '@/components/dashboard/DrillDownModal';
import { ConversionChart } from '@/components/dashboard/ConversionChart';
import { SourceChart } from '@/components/dashboard/SourceChart';
import { BrazilHeatMap } from '@/components/dashboard/BrazilHeatMap';
import { ConversionAnalysis } from '@/components/dashboard/ConversionAnalysis';
import { LeadTimelineChart } from '@/components/dashboard/LeadTimelineChart';
import { ConvertedSegmentationChart } from '@/components/dashboard/ConvertedSegmentationChart';
import { DiscardReasonChart } from '@/components/dashboard/DiscardReasonChart';
import { MonthlyGoalSection } from '@/components/dashboard/MonthlyGoalSection';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { SegmentedLead, SegmentedDeal, DealsByStatus, DateFilter } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth } from 'date-fns';

// ========== MODAL STATE TYPES ==========
interface ModalState {
  isOpen: boolean;
  title: string;
  data?: SegmentedLead[] | SegmentedDeal[];
  type: 'lead' | 'deal';
  segmentedData?: DealsByStatus;
  showDiscardReason?: boolean;
  showSource?: boolean;
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

const calcPercentage = (value: number, total: number): string => {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
};

// ========== MAIN COMPONENT ==========
export default function Dashboard() {
  // Filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [sourceFilter, setSourceFilter] = useState('Todos');
  const [ufFilter, setUfFilter] = useState('Todos');
  const [regionalFilter, setRegionalFilter] = useState('Todos');

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    type: 'lead',
    showDiscardReason: false,
    showSource: true,
  });

  // Use the new filtered dashboard hook
  const {
    leads,
    deals,
    metrics,
    availableSources,
    availableUfs,
    availableRegionals, // NEW
    geoData,
    marketingData,
    leadsTimeline,
    convertedBreakdown,
    discardReasons,
    dealLossReasons, // NEW
    monthlyGoal, // NEW
    isLoading,
    isSyncing, // New
    error,
    refetch
  } = useFilteredDashboard(
    dateFilter,
    sourceFilter === 'Todos' ? null : sourceFilter,
    ufFilter === 'Todos' ? null : ufFilter,
    regionalFilter === 'Todos' ? null : regionalFilter // NEW
  );

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Modal handlers
  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // ... (existing generic list openers) ...
  const openLeadList = (title: string, data: SegmentedLead[], showDiscardReason = false) => {
    setModalState({
      isOpen: true,
      title,
      data,
      type: 'lead',
      showDiscardReason,
      showSource: true,
    });
  };

  const openDealList = (title: string, data: SegmentedDeal[]) => {
    setModalState({
      isOpen: true,
      title,
      data,
      type: 'deal',
      showSource: true,
    });
  };

  // ... (existing specific handlers) ...
  const handleEmAtendimentoClick = () => openLeadList('Leads em Atendimento', leads.em_atendimento);
  const handleDescartadosClick = () => openLeadList('Leads Descartados', leads.descartados, true);
  const handleConvertidosClick = () => openLeadList('Leads Convertidos', leads.convertidos);
  const handleTotalLeadsClick = () => {
    const allLeads = [...leads.em_atendimento, ...leads.descartados, ...leads.convertidos];
    openLeadList('Todos os Leads', allLeads);
  };

  const handleVarejoClick = () => {
    setModalState({
      isOpen: true,
      title: 'Negócios - Varejo',
      type: 'deal',
      segmentedData: deals.por_segmento.varejo,
      showSource: true,
    });
  };

  const handleProjetoClick = () => {
    setModalState({
      isOpen: true,
      title: 'Negócios - Projeto',
      type: 'deal',
      segmentedData: deals.por_segmento.projeto,
      showSource: true,
    });
  };

  const handleFaturamentoClick = () => openDealList('Faturamento (Ganhos)', deals.por_status.ganhos);
  const handlePipelineClick = () => openDealList('Pipeline (Em Andamento)', deals.por_status.andamento);
  const handlePerdidosDealClick = () => openDealList('Negócios Perdidos', deals.por_status.perdidos);

  // Chart Click Handlers
  const handleConversionChartClick = (category: string, deals: SegmentedDeal[]) => {
    openDealList(`Segmento: ${category}`, deals);
  };

  const handleSourceChartClick = (source: string, leads: SegmentedLead[]) => {
    openLeadList(`Origem: ${source}`, leads);
  };

  const handleStateClick = (uf: string, leads: SegmentedLead[]) => {
    openLeadList(`Estado: ${uf}`, leads);
  };

  const handleConversionAnalysisClick = (title: string, items: SegmentedLead[] | SegmentedDeal[]) => {
    const isDeal = items.length > 0 && 'segmento' in items[0];
    if (isDeal) {
      openDealList(title, items as SegmentedDeal[]);
    } else {
      openLeadList(title, items as SegmentedLead[]);
    }
  };

  const handleReasonClick = (reason: string, type: 'lead' | 'deal') => {
    if (type === 'lead') {
      const subset = leads.descartados.filter(l => (l.motivo_descarte || 'Não informado') === reason);
      openLeadList(`Descarte: ${reason}`, subset, true);
    } else {
      const subset = deals.por_status.perdidos.filter(d => (d.motivo_perda || 'Não informado') === reason);
      openDealList(`Perda: ${reason}`, subset);
    }
  };

  const handleConvertedSegmentClick = (segment: string) => {
    const segLower = segment.toLowerCase();
    if (segLower === 'varejo') {
      handleVarejoClick();
    } else if (segLower === 'projeto') {
      handleProjetoClick();
    }
  };

  // Combined data for generic charts
  const allLeads = [...leads.em_atendimento, ...leads.descartados, ...leads.convertidos];
  const allDeals = [...deals.por_status.ganhos, ...deals.por_status.perdidos, ...deals.por_status.andamento];

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

  // Calculate segment totals
  const varejoTotal = deals.por_segmento.varejo.ganhos.length +
    deals.por_segmento.varejo.andamento.length +
    deals.por_segmento.varejo.perdidos.length;

  const projetoTotal = deals.por_segmento.projeto.ganhos.length +
    deals.por_segmento.projeto.andamento.length +
    deals.por_segmento.projeto.perdidos.length;

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
          regionalFilter={regionalFilter} // NEW
          onRegionalFilterChange={setRegionalFilter} // NEW
          availableRegionals={availableRegionals} // NEW
          onRefresh={refetch}
          isLoading={isLoading}
          isSyncing={isSyncing} // New
        />
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Monthly Goal Section */}
        <MonthlyGoalSection metrics={monthlyGoal} isSyncing={isSyncing} />

        {/* Row 1: Lead KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
          ) : (
            <>
              <KPICard
                title="Total de Leads"
                value={metrics.totalLeads}
                percentage="100"
                icon={<Users className="h-5 w-5" />}
                variant="info"
                onClick={handleTotalLeadsClick}
              />
              <KPICard
                title="Em Atendimento"
                value={metrics.emAtendimentoCount}
                percentage={calcPercentage(metrics.emAtendimentoCount, metrics.totalLeads)}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="warning"
                onClick={handleEmAtendimentoClick}
              />
              <KPICard
                title="Descartados"
                value={metrics.descartadosCount}
                percentage={calcPercentage(metrics.descartadosCount, metrics.totalLeads)}
                icon={<UserX className="h-5 w-5" />}
                variant="destructive"
                onClick={handleDescartadosClick}
              />
              <KPICard
                title="Convertidos"
                value={metrics.convertidosCount}
                percentage={calcPercentage(metrics.convertidosCount, metrics.totalLeads)}
                icon={<UserCheck className="h-5 w-5" />}
                variant="success"
                onClick={handleConvertidosClick}
              />
            </>
          )}
        </div>

        {/* Row 2: Financial KPI Cards */}
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

              <Card className="cursor-pointer hover:scale-[1.02] transition-all border-destructive/50 bg-destructive/5" onClick={handlePerdidosDealClick}>
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
                  <div className="p-2 rounded-lg bg-secondary/20 text-secondary-foreground"><DollarSign className="h-5 w-5" /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</div>
                  <p className="text-xs text-muted-foreground">Por negócio ganho</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Row 3: Segment Cards */}
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

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px] rounded-lg" />
              <Skeleton className="h-[400px] rounded-lg" />
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <LeadTimelineChart data={leadsTimeline} />
              </div>
              <SourceChart leads={allLeads} onBarClick={handleSourceChartClick} />
              <ConversionChart deals={allDeals} onSegmentClick={handleConversionChartClick} />
            </>
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px] rounded-lg" />
              <Skeleton className="h-[400px] rounded-lg" />
            </>
          ) : (
            <>
              <>
                <div className="col-span-1 lg:col-span-2 space-y-6">
                  <BrazilHeatMap stateData={geoData} onStateClick={handleStateClick} />
                </div>

                {/* Analysis Row: Conversion Analysis */}
                <div className="col-span-1 lg:col-span-2">
                  <ConversionAnalysis
                    googleConvertedLeads={marketingData.google}
                    metaConvertedLeads={marketingData.meta}
                    indicacaoConvertedLeads={marketingData.indicacaoAmigo}
                    profissionalConvertedLeads={marketingData.profissional}
                    ltvConvertedLeads={marketingData.ltv}
                    otherConvertedLeads={marketingData.other}
                    googleConvertedVarejo={marketingData.googleVarejo}
                    googleConvertedProjeto={marketingData.googleProjeto}
                    metaConvertedVarejo={marketingData.metaVarejo}
                    metaConvertedProjeto={marketingData.metaProjeto}
                    totalConverted={leads.convertidos.length}
                    onSegmentClick={handleConversionAnalysisClick}
                  />
                </div>

                {/* Detail Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-1 lg:col-span-2 h-[400px]">
                  <div className="h-full">
                    <ConvertedSegmentationChart data={convertedBreakdown} onSegmentClick={handleConvertedSegmentClick} />
                  </div>
                  <div className="h-full">
                    <DiscardReasonChart
                      data={discardReasons}
                      lossData={dealLossReasons} // NEW
                      onReasonClick={handleReasonClick} // UPDATED
                    />
                  </div>
                </div>
              </>
            </>
          )}
        </div>
      </div>

      {/* Drill-down Modal */}
      <DrillDownModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        data={modalState.data}
        type={modalState.type}
        segmentedData={modalState.segmentedData}
        showDiscardReason={modalState.showDiscardReason}
        showSource={modalState.showSource}
      />
    </DashboardLayout >
  );
}
