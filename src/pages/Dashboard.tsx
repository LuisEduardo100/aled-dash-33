import { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, TrendingUp, Percent } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { KPICard } from '@/components/dashboard/KPICard';
import { ConversionChart } from '@/components/dashboard/ConversionChart';
import { SourceChart } from '@/components/dashboard/SourceChart';
import { LeadsTable } from '@/components/dashboard/LeadsTable';
import { DrillDownModal } from '@/components/dashboard/DrillDownModal';
import { useDataFetch, useMetrics } from '@/hooks/useDataFetch';
import { CRMLead, CRMDeal } from '@/types/crm';
import { Skeleton } from '@/components/ui/skeleton';
import { startOfMonth, endOfMonth } from 'date-fns';

interface ModalState {
  isOpen: boolean;
  title: string;
  data: (CRMLead | CRMDeal)[];
  type: 'lead' | 'deal';
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });

  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    data: [],
    type: 'lead'
  });

  const { leads, deals, isLoading, error, refetch } = useDataFetch(dateRange);
  const metrics = useMetrics(leads, deals);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const openModal = (title: string, data: (CRMLead | CRMDeal)[], type: 'lead' | 'deal') => {
    setModalState({ isOpen: true, title, data, type });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // KPI click handlers
  const handleTotalLeadsClick = () => {
    openModal('Todos os Leads', leads, 'lead');
  };

  const handleInProgressClick = () => {
    const inProgressLeads = leads.filter(l => l.status_id === 'IN_PROCESS');
    openModal('Leads em Atendimento', inProgressLeads, 'lead');
  };

  const handleDiscardedClick = () => {
    const discardedLeads = leads.filter(l => l.status_id === 'JUNK' || l.discard_reason);
    openModal('Leads Descartados', discardedLeads, 'lead');
  };

  const handleConvertedClick = () => {
    const convertedLeads = leads.filter(l => l.status_id === 'CONVERTED');
    openModal('Leads Convertidos', convertedLeads, 'lead');
  };

  // Chart click handlers
  const handleConversionSegmentClick = (category: string, categoryDeals: CRMDeal[]) => {
    openModal(`Negócios - ${category}`, categoryDeals, 'deal');
  };

  const handleSourceBarClick = (source: string, sourceLeads: CRMLead[]) => {
    openModal(`Leads - ${source}`, sourceLeads, 'lead');
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
                icon={<Users className="h-5 w-5" />}
                variant="info"
                onClick={handleTotalLeadsClick}
              />
              <KPICard
                title="Em Atendimento"
                value={metrics.inProgress}
                subtitle={`${metrics.newLeads} novos`}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="warning"
                onClick={handleInProgressClick}
              />
              <KPICard
                title="Descartados"
                value={metrics.discarded}
                icon={<UserX className="h-5 w-5" />}
                variant="destructive"
                onClick={handleDiscardedClick}
              />
              <KPICard
                title="Convertidos"
                value={metrics.converted}
                icon={<UserCheck className="h-5 w-5" />}
                variant="success"
                onClick={handleConvertedClick}
              />
              <KPICard
                title="Taxa de Conversão"
                value={`${metrics.conversionRate.toFixed(1)}%`}
                icon={<Percent className="h-5 w-5" />}
                variant="success"
              />
            </>
          )}
        </div>

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
      />
    </DashboardLayout>
  );
}
