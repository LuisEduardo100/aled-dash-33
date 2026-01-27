import { useState } from 'react';
import { Users, TrendingUp, UserX, UserCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KPICard } from '@/components/dashboard/KPICard';
import { DrillDownModal } from '@/components/dashboard/DrillDownModal';
import { SourceChart } from '@/components/dashboard/SourceChart';
import { LeadTimelineChart } from '@/components/dashboard/LeadTimelineChart';
import { LeadStatusPieChart } from '@/components/dashboard/LeadStatusPieChart';
import { LeadsBrazilHeatMap } from '@/components/dashboard/LeadsBrazilHeatMap';
import { ConversionAnalysis } from '@/components/dashboard/ConversionAnalysis';
import { DiscardReasonChart } from '@/components/dashboard/DiscardReasonChart';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { SegmentedLead, DateFilter } from '@/types/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';

// ========== MODAL STATE TYPES ==========
interface ModalState {
  isOpen: boolean;
  title: string;
  data?: SegmentedLead[];
  showDiscardReason?: boolean;
}

// ========== HELPERS ==========
const calcPercentage = (value: number, total: number): string => {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
};

// ========== MAIN COMPONENT ==========
export default function LeadsDashboard() {
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
    showDiscardReason: false,
  });

  // Use the filtered dashboard hook (leads only, no funnel filter needed)
  const {
    leads,
    metrics,
    availableSources,
    availableUfs,
    availableRegionals,
    geoData,
    marketingData,
    leadsTimeline,
    discardReasons,
    isLoading,
    isSyncing,
    error,
    refetch
  } = useFilteredDashboard(
    dateFilter,
    sourceFilter === 'Todos' ? null : sourceFilter,
    ufFilter === 'Todos' ? null : ufFilter,
    regionalFilter === 'Todos' ? null : regionalFilter,
    null // No funnel filter for leads
  );

  // Modal handlers
  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const openLeadList = (title: string, data: SegmentedLead[], showDiscardReason = false) => {
    setModalState({
      isOpen: true,
      title,
      data,
      showDiscardReason,
    });
  };

  // Click handlers
  const handleTotalLeadsClick = () => {
    const allLeads = [...leads.em_atendimento, ...leads.descartados, ...leads.convertidos];
    openLeadList('Todos os Leads', allLeads);
  };

  const handleEmAtendimentoClick = () => openLeadList('Leads em Atendimento', leads.em_atendimento);
  const handleDescartadosClick = () => openLeadList('Leads Descartados', leads.descartados, true);
  const handleConvertidosClick = () => openLeadList('Leads Convertidos', leads.convertidos);

  const handlePieSegmentClick = (status: 'em_atendimento' | 'descartados' | 'convertidos') => {
    if (status === 'em_atendimento') handleEmAtendimentoClick();
    else if (status === 'descartados') handleDescartadosClick();
    else handleConvertidosClick();
  };

  const handleSourceChartClick = (source: string, sourceLeads: SegmentedLead[]) => {
    openLeadList(`Origem: ${source}`, sourceLeads);
  };

  const handleStateClick = (uf: string, stateLeads: SegmentedLead[]) => {
    openLeadList(`Estado: ${uf}`, stateLeads);
  };

  const handleReasonClick = (reason: string) => {
    const subset = leads.descartados.filter(l => (l.motivo_descarte || 'Não informado') === reason);
    openLeadList(`Descarte: ${reason}`, subset, true);
  };

  const handleConversionAnalysisClick = (title: string, items: SegmentedLead[]) => {
    openLeadList(title, items);
  };

  // All leads for charts
  const allLeads = [...leads.em_atendimento, ...leads.descartados, ...leads.convertidos];

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
          funnelFilter="Todos"
          onFunnelFilterChange={() => { }}
          availableFunnels={[]}
          onRefresh={refetch}
          isLoading={isLoading}
          isSyncing={isSyncing}
        />
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
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

        {/* Row 2: Timeline Chart (full width) */}
        <div className="w-full">
          {isLoading ? (
            <Skeleton className="h-[350px] rounded-lg" />
          ) : (
            <LeadTimelineChart data={leadsTimeline} />
          )}
        </div>

        {/* Row 3: Status Pie + Discard Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px] rounded-lg" />
              <Skeleton className="h-[400px] rounded-lg" />
            </>
          ) : (
            <>
              <LeadStatusPieChart
                emAtendimento={metrics.emAtendimentoCount}
                descartados={metrics.descartadosCount}
                convertidos={metrics.convertidosCount}
                onSegmentClick={handlePieSegmentClick}
              />
              <DiscardReasonChart
                data={discardReasons}
                onReasonClick={(reason) => handleReasonClick(reason)}
                hideToggle={true}
              />
            </>
          )}
        </div>

        {/* Row 4: Source Attribution + Conversion Analysis (side by side) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[400px] rounded-lg" />
              <Skeleton className="h-[400px] rounded-lg" />
            </>
          ) : (
            <>
              <SourceChart leads={allLeads} onBarClick={handleSourceChartClick} />
              <ConversionAnalysis
                googleConvertedLeads={marketingData.google}
                metaConvertedLeads={marketingData.meta}
                indicacaoConvertedLeads={marketingData.indicacaoAmigo}
                profissionalConvertedLeads={marketingData.profissional}
                ltvConvertedLeads={marketingData.ltv}
                otherConvertedLeads={marketingData.other}
                googleConvertedVarejo={[]}
                googleConvertedProjeto={[]}
                metaConvertedVarejo={[]}
                metaConvertedProjeto={[]}
                totalConverted={leads.convertidos.length}
                onSegmentClick={handleConversionAnalysisClick}
              />
            </>
          )}
        </div>

        {/* Row 6: Geographic Distribution */}
        <div className="w-full">
          {isLoading ? (
            <Skeleton className="h-[550px] rounded-lg" />
          ) : (
            <LeadsBrazilHeatMap
              stateData={geoData.leads}
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
        type="lead"
        showDiscardReason={modalState.showDiscardReason}
        showSource={true}
      />
    </DashboardLayout>
  );
}
