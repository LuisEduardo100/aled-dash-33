import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, TrendingUp, HelpCircle } from 'lucide-react';
import { SegmentedDeal } from '@/types/dashboard';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO } from 'date-fns';

interface LeadToCloseTimeChartProps {
  deals: SegmentedDeal[];
  onBarClick?: (range: string, rangeDeals: SegmentedDeal[]) => void;
  onDealClick?: (deal: SegmentedDeal, type: 'fastest' | 'slowest') => void;
}

const TIME_RANGES = [
  { label: '0-7 dias', min: 0, max: 7, color: 'hsl(142, 71%, 45%)' },
  { label: '8-14 dias', min: 8, max: 14, color: 'hsl(142, 60%, 50%)' },
  { label: '15-30 dias', min: 15, max: 30, color: 'hsl(48, 96%, 53%)' },
  { label: '31-60 dias', min: 31, max: 60, color: 'hsl(38, 92%, 50%)' },
  { label: '61-90 dias', min: 61, max: 90, color: 'hsl(25, 95%, 53%)' },
  { label: '90+ dias', min: 91, max: Infinity, color: 'hsl(0, 84%, 60%)' },
];

export function LeadToCloseTimeChart({ deals, onBarClick, onDealClick }: LeadToCloseTimeChartProps) {
  // Calculate closing time for each won deal
  const closingTimeData = useMemo(() => {
    const wonDeals = deals.filter(d => d.status_nome === 'Ganho' && d.data_fechamento && d.data_criacao);
    
    const dealsWithTime = wonDeals.map(deal => {
      const creationDate = parseISO(deal.data_criacao);
      const closingDate = parseISO(deal.data_fechamento!);
      
      // Calculate raw differences
      const rawSecondsToClose = differenceInSeconds(closingDate, creationDate);
      
      // If negative, there's a data inconsistency (closing before creation)
      // This usually happens due to timezone issues - use absolute value
      const isDataInconsistent = rawSecondsToClose < 0;
      const absoluteSeconds = Math.abs(rawSecondsToClose);
      
      // Convert to other units
      const daysToClose = Math.floor(absoluteSeconds / 86400);
      const hoursToClose = Math.floor(absoluteSeconds / 3600);
      const minutesToClose = Math.floor(absoluteSeconds / 60);
      const secondsToClose = absoluteSeconds;
      
      return { 
        ...deal, 
        daysToClose,
        hoursToClose,
        minutesToClose,
        secondsToClose,
        isDataInconsistent
      };
    });

    // Group by time ranges
    const rangeData = TIME_RANGES.map(range => {
      const rangeDeals = dealsWithTime.filter(
        d => d.daysToClose >= range.min && d.daysToClose <= range.max
      );
      const totalValue = rangeDeals.reduce((acc, d) => acc + (d.valor || 0), 0);
      return {
        name: range.label,
        count: rangeDeals.length,
        value: totalValue,
        color: range.color,
        deals: rangeDeals,
        minDays: range.min,
        maxDays: range.max,
      };
    });

    // Calculate average closing time
    const totalDays = dealsWithTime.reduce((acc, d) => acc + d.daysToClose, 0);
    const avgDays = dealsWithTime.length > 0 ? Math.round(totalDays / dealsWithTime.length) : 0;
    
    // Calculate median
    const sortedDays = dealsWithTime.map(d => d.daysToClose).sort((a, b) => a - b);
    const medianDays = sortedDays.length > 0 
      ? sortedDays.length % 2 === 0
        ? Math.round((sortedDays[sortedDays.length / 2 - 1] + sortedDays[sortedDays.length / 2]) / 2)
        : sortedDays[Math.floor(sortedDays.length / 2)]
      : 0;

    // Fastest and slowest deal (with full time granularity)
    const fastestDeal = dealsWithTime.length > 0 
      ? dealsWithTime.reduce((min, d) => d.secondsToClose < min.secondsToClose ? d : min)
      : null;
    const slowestDeal = dealsWithTime.length > 0 
      ? dealsWithTime.reduce((max, d) => d.daysToClose > max.daysToClose ? d : max)
      : null;

    return {
      rangeData,
      avgDays,
      medianDays,
      totalDeals: dealsWithTime.length,
      fastestDeal,
      slowestDeal,
    };
  }, [deals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format fastest time - show days, hours, minutes, or seconds based on duration
  const formatFastestTime = () => {
    if (!closingTimeData.fastestDeal) return '0';
    const { daysToClose, hoursToClose, minutesToClose, secondsToClose } = closingTimeData.fastestDeal;
    
    // If 1+ days, show days
    if (daysToClose >= 1) {
      return `${daysToClose}`;
    }
    
    // If 1+ hours, show hours
    if (hoursToClose >= 1) {
      return `${hoursToClose}h`;
    }
    
    // If 1+ minutes, show minutes
    if (minutesToClose >= 1) {
      return `${minutesToClose}min`;
    }
    
    // Otherwise show seconds
    return `${secondsToClose}s`;
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-foreground">{data.count} negócios fechados</p>
          <p className="text-sm text-emerald-500 font-medium">{formatCurrency(data.value)}</p>
          <p className="text-xs text-muted-foreground mt-1">Clique para ver detalhes</p>
        </div>
      );
    }
    return null;
  };

  if (closingTimeData.totalDeals === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Tempo Médio de Fechamento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum negócio ganho no período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Tempo de Fechamento (Lead → Negócio Ganho)
          </CardTitle>
          <CardDescription>
            Distribuição do tempo entre a criação do negócio e seu fechamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Média */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <div className="text-3xl font-bold text-primary">{closingTimeData.avgDays}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Média (dias)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>O que é a Média?</strong></p>
                    <p className="text-sm mt-1">É a soma de todos os tempos de fechamento dividida pelo número de negócios. Indica o tempo "típico" para fechar um negócio, mas pode ser distorcida por valores extremos.</p>
                    <p className="text-sm mt-2 text-muted-foreground"><strong>Insight:</strong> Compare com a mediana - se forem muito diferentes, há negócios com tempos muito longos puxando a média para cima.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Mediana */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-3xl font-bold text-blue-500">{closingTimeData.medianDays}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Mediana (dias)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p><strong>O que é a Mediana?</strong></p>
                    <p className="text-sm mt-1">É o valor do meio quando todos os tempos são ordenados. Metade dos negócios fecha antes e metade depois desse tempo.</p>
                    <p className="text-sm mt-2 text-muted-foreground"><strong>Insight:</strong> A mediana é mais representativa que a média, pois não é afetada por negócios muito lentos ou muito rápidos. Use-a para definir expectativas realistas de prazo.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            {/* Mais rápido */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center cursor-pointer hover:bg-emerald-500/20 transition-colors"
                  onClick={() => closingTimeData.fastestDeal && onDealClick?.(closingTimeData.fastestDeal, 'fastest')}
                >
                  <div className="text-3xl font-bold text-emerald-500">
                    {formatFastestTime()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Mais rápido {closingTimeData.fastestDeal && closingTimeData.fastestDeal.daysToClose >= 1 ? '(dias)' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    📋 Clique para ver detalhes
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">{closingTimeData.fastestDeal?.titulo || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Clique para auditar este negócio</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Mais lento */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center cursor-pointer hover:bg-amber-500/20 transition-colors"
                  onClick={() => closingTimeData.slowestDeal && onDealClick?.(closingTimeData.slowestDeal, 'slowest')}
                >
                  <div className="text-3xl font-bold text-amber-500">
                    {closingTimeData.slowestDeal?.daysToClose || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Mais lento (dias)</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    📋 Clique para ver detalhes
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">{closingTimeData.slowestDeal?.titulo || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Clique para auditar este negócio</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={closingTimeData.rangeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ 
                  value: 'Negócios', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
                }}
              />
              <RechartsTooltip content={<CustomChartTooltip />} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                onClick={(data) => onBarClick?.(data.name, data.deals)}
                className="cursor-pointer"
              >
                {closingTimeData.rangeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Insight */}
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Análise
            </h4>
            <p className="text-sm text-muted-foreground">
              {closingTimeData.avgDays <= 30 ? (
                <>
                  Excelente performance! O tempo médio de fechamento de <strong className="text-emerald-500">{closingTimeData.avgDays} dias</strong> indica um ciclo de vendas ágil.
                </>
              ) : closingTimeData.avgDays <= 60 ? (
                <>
                  Ciclo de vendas moderado. O tempo médio de <strong className="text-amber-500">{closingTimeData.avgDays} dias</strong> pode ser otimizado com follow-ups mais frequentes.
                </>
              ) : (
                <>
                  Ciclo de vendas longo. O tempo médio de <strong className="text-red-500">{closingTimeData.avgDays} dias</strong> sugere oportunidades para acelerar o processo comercial.
                </>
              )}
              {' '}De {closingTimeData.totalDeals} negócios ganhos, a maioria ({
                closingTimeData.rangeData.reduce((max, r) => r.count > max.count ? r : max).count
              }) fechou em <strong>{closingTimeData.rangeData.reduce((max, r) => r.count > max.count ? r : max).name}</strong>.
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
