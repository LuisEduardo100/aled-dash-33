import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, TrendingUp, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { ConversionChart } from '@/components/dashboard/ConversionChart';
import { SourceChart } from '@/components/dashboard/SourceChart';
import { LeadsTable } from '@/components/dashboard/LeadsTable';
import { DrillDownModal } from '@/components/dashboard/DrillDownModal';
import { FinancialSection } from '@/components/dashboard/FinancialSection';
import { BrazilHeatMap } from '@/components/dashboard/BrazilHeatMap';
import { ConversionAnalysis } from '@/components/dashboard/ConversionAnalysis';
import { DiscardAnalysis } from '@/components/dashboard/DiscardAnalysis';
import { PerformanceTimeline } from '@/components/dashboard/PerformanceTimeline';
import { useDataFetch, useMetrics, useGeographicData } from '@/hooks/useDataFetch';
import { CRMLead, CRMDeal } from '@/types/crm';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';

interface ModalState {
  isOpen: boolean;
  title: string;
  data: (CRMLead | CRMDeal)[];
  type: 'lead' | 'deal';
  showDiscardReason?: boolean;
  showSource?: boolean;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [sourceFilter, setSourceFilter] = useState('Todos');

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    data: [],
    type: 'lead',
    showDiscardReason: false,
    showSource: false,
  });

  const { leads, deals, isLoading, error, refetch } = useDataFetch(dateRange, sourceFilter);
  const metrics = useMetrics(leads, deals);
  const geoData = useGeographicData(leads, deals);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const openModal = (
    title: string, 
    data: (CRMLead | CRMDeal)[], 
    type: 'lead' | 'deal',
    showDiscardReason = false,
    showSource = false
  ) => {
    setModalState({ isOpen: true, title, data, type, showDiscardReason, showSource });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // KPI click handlers
  const handleTotalLeadsClick = () => openModal('Todos os Leads', leads, 'lead', false, true);
  const handleInProgressClick = () => {
    const inProgressLeads = leads.filter(l => l.status_id === 'IN_PROCESS');
    openModal('Leads em Atendimento', inProgressLeads, 'lead', false, true);
  };
  const handleDiscardedClick = () => {
    openModal('Leads Descartados', metrics.discardedLeads, 'lead', true, true);
  };
  const handleConvertedClick = () => {
    openModal('Leads Convertidos', metrics.convertedLeads, 'lead', false, true);
  };
  const handleQuotedClick = () => openModal('Negócios Orçados', metrics.quotedDeals, 'deal', false, true);

  // Chart click handlers
  const handleConversionSegmentClick = (category: string, categoryDeals: CRMDeal[]) => {
    openModal(`Negócios - ${category}`, categoryDeals, 'deal', false, true);
  };
  const handleSourceBarClick = (source: string, sourceLeads: CRMLead[]) => {
    openModal(`Leads - ${source}`, sourceLeads, 'lead', false, true);
  };

  // Financial click handler
  const handleFinancialClick = (title: string, financialDeals: CRMDeal[]) => {
    openModal(title, financialDeals, 'deal', false, true);
  };

  // Geographic click handler
  const handleStateClick = (uf: string, stateLeads: CRMLead[]) => {
    openModal(`Leads Convertidos - ${uf}`, stateLeads, 'lead', false, true);
  };

  // Conversion analysis click handler
  const handleConversionAnalysisClick = (title: string, analysisLeads: CRMLead[]) => {
    openModal(title, analysisLeads, 'lead', false, true);
  };

  // Discard analysis click handler
  const handleDiscardReasonClick = (reason: string, reasonLeads: CRMLead[]) => {
    openModal(`Descartados - ${reason}`, reasonLeads, 'lead', true, true);
  };

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
      <DashboardHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onRefresh={refetch}
        isLoading={isLoading}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))
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
                value={metrics.inProgress}
                percentage={metrics.inProgressPercent}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="warning"
                onClick={handleInProgressClick}
              />
              <KPICard
                title="Descartados"
                value={metrics.discarded}
                percentage={metrics.discardedPercent}
                icon={<UserX className="h-5 w-5" />}
                variant="destructive"
                onClick={handleDiscardedClick}
              />
              <KPICard
                title="Convertidos"
                value={metrics.converted}
                percentage={metrics.convertedPercent}
                icon={<UserCheck className="h-5 w-5" />}
                variant="success"
                onClick={handleConvertedClick}
              />
              <KPICard
                title="Orçados"
                value={metrics.quoted}
                percentage={metrics.quotedPercent}
                icon={<FileText className="h-5 w-5" />}
                variant="info"
                onClick={handleQuotedClick}
              />
            </>
          )}
        </div>

        {/* Financial Section */}
        {isLoading ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : (
          <FinancialSection
            wonDeals={metrics.wonDeals}
            lostDeals={metrics.lostDeals}
            pipelineDeals={metrics.pipelineDeals}
            totalWonValue={metrics.totalWonValue}
            totalLostValue={metrics.totalLostValue}
            totalPipelineValue={metrics.totalPipelineValue}
            averageTicket={metrics.averageTicket}
            onCardClick={handleFinancialClick}
          />
        )}

        {/* Performance Timeline */}
        {isLoading ? (
          <Skeleton className="h-[400px] rounded-lg" />
        ) : (
          <PerformanceTimeline
            leads={leads}
            deals={deals}
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
          />
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[450px] rounded-lg" />
              <Skeleton className="h-[450px] rounded-lg" />
            </>
          ) : (
            <>
              <ConversionChart 
                deals={deals} 
                onSegmentClick={handleConversionSegmentClick} 
              />
              <SourceChart 
                leads={leads} 
                onBarClick={handleSourceBarClick} 
              />
            </>
          )}
        </div>

        {/* Geographic Map & Conversion Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[500px] rounded-lg" />
              <Skeleton className="h-[500px] rounded-lg" />
            </>
          ) : (
            <>
              <BrazilHeatMap 
                stateData={geoData} 
                onStateClick={handleStateClick}
              />
              <ConversionAnalysis
                googleData={metrics.googleData}
                metaData={metrics.metaData}
                indicacoesData={metrics.indicacoesData}
                totalConverted={metrics.converted}
                onSegmentClick={handleConversionAnalysisClick}
              />
            </>
          )}
        </div>

        {/* Discard Analysis */}
        {isLoading ? (
          <Skeleton className="h-[400px] rounded-lg" />
        ) : (
          <DiscardAnalysis
            discardedLeads={metrics.discardedLeads}
            onReasonClick={handleDiscardReasonClick}
          />
        )}

        {/* Leads Table */}
        <div className="bg-card rounded-lg border border-border p-6">
          {isLoading ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <LeadsTable leads={leads} />
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
        showDiscardReason={modalState.showDiscardReason}
        showSource={modalState.showSource}
      />
    </DashboardLayout>
  );
}
