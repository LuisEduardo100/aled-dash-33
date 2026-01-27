import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedDeal } from '@/types/dashboard';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DealsTimelineChartProps {
  deals: {
    ganhos: SegmentedDeal[];
    perdidos: SegmentedDeal[];
  };
}

export function DealsTimelineChart({ deals }: DealsTimelineChartProps) {
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { ganhos: number; perdidos: number; ganhosValor: number; perdidosValor: number }>();

    // Process won deals
    deals.ganhos.forEach(deal => {
      const dateStr = deal.data_fechamento || deal.data_criacao;
      if (!dateStr) return;
      const date = dateStr.split('T')[0];
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { ganhos: 0, perdidos: 0, ganhosValor: 0, perdidosValor: 0 });
      }
      const entry = dateMap.get(date)!;
      entry.ganhos++;
      entry.ganhosValor += deal.valor || 0;
    });

    // Process lost deals
    deals.perdidos.forEach(deal => {
      const dateStr = deal.data_fechamento || deal.data_criacao;
      if (!dateStr) return;
      const date = dateStr.split('T')[0];
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { ganhos: 0, perdidos: 0, ganhosValor: 0, perdidosValor: 0 });
      }
      const entry = dateMap.get(date)!;
      entry.perdidos++;
      entry.perdidosValor += deal.valor || 0;
    });

    return Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        formattedDate: format(parseISO(date), 'dd/MM', { locale: ptBR }),
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [deals]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Negócios Fechados (Timeline)</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Negócios Fechados (Timeline)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="formattedDate" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              itemStyle={{
                color: 'hsl(var(--popover-foreground))',
              }}
              labelStyle={{
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  ganhos: 'Ganhos',
                  perdidos: 'Perdidos',
                };
                return [value, labels[name] || name];
              }}
              labelFormatter={(label) => `Data: ${label}`}
            />
            <Legend 
              formatter={(value) => {
                const labels: Record<string, string> = {
                  ganhos: 'Ganhos',
                  perdidos: 'Perdidos',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="ganhos"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="perdidos"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
