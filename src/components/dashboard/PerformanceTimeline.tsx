import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CRMLead, CRMDeal } from '@/types/crm';
import { format, parseISO, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PerformanceTimelineProps {
  leads: CRMLead[];
  deals: CRMDeal[];
  startDate: Date | null;
  endDate: Date | null;
}

export function PerformanceTimeline({ leads, deals, startDate, endDate }: PerformanceTimelineProps) {
  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];

    const days = eachDayOfInterval({
      start: startOfDay(startDate),
      end: endOfDay(endDate),
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const leadsCount = leads.filter((lead) => {
        const leadDate = parseISO(lead.date_create);
        return leadDate >= dayStart && leadDate <= dayEnd;
      }).length;

      const dealsCount = deals.filter((deal) => {
        const dealDate = parseISO(deal.date_create);
        return dealDate >= dayStart && dealDate <= dayEnd;
      }).length;

      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        fullDate: format(day, 'dd/MM/yyyy', { locale: ptBR }),
        leads: leadsCount,
        deals: dealsCount,
      };
    });
  }, [leads, deals, startDate, endDate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{payload[0]?.payload?.fullDate}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'leads' ? 'Entrada de Leads' : 'Negócios Criados'}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Performance Temporal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Selecione um período para visualizar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Performance Temporal - Leads vs Negócios</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (value === 'leads' ? 'Entrada de Leads' : 'Negócios Criados')}
              wrapperStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="hsl(199, 89%, 48%)"
              fill="url(#colorLeads)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="deals"
              stroke="hsl(160, 84%, 39%)"
              fill="url(#colorDeals)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-info/10 border border-info/20">
            <p className="text-xs text-muted-foreground">Total Leads no Período</p>
            <p className="text-2xl font-bold text-info">{leads.length}</p>
            <p className="text-xs text-muted-foreground">
              Média: {(leads.length / Math.max(chartData.length, 1)).toFixed(1)}/dia
            </p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground">Total Negócios no Período</p>
            <p className="text-2xl font-bold text-primary">{deals.length}</p>
            <p className="text-xs text-muted-foreground">
              Média: {(deals.length / Math.max(chartData.length, 1)).toFixed(1)}/dia
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
