import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealsByStatus } from '@/types/dashboard';

interface SegmentPerformanceChartProps {
  varejo: DealsByStatus;
  projeto: DealsByStatus;
  onSegmentClick?: (segment: string, status: string) => void;
}

const COLORS = {
  ganhos: 'hsl(var(--success))',
  andamento: 'hsl(var(--warning))',
  perdidos: 'hsl(var(--destructive))',
};

export function SegmentPerformanceChart({ varejo, projeto, onSegmentClick }: SegmentPerformanceChartProps) {
  const chartData = useMemo(() => {
    const calcTotal = (status: DealsByStatus) => ({
      ganhos: status.ganhos.length,
      andamento: status.andamento.length,
      perdidos: status.perdidos.length,
      ganhosValor: status.ganhos.reduce((acc, d) => acc + (d.valor || 0), 0),
      andamentoValor: status.andamento.reduce((acc, d) => acc + (d.valor || 0), 0),
      perdidosValor: status.perdidos.reduce((acc, d) => acc + (d.valor || 0), 0),
    });

    return [
      { name: 'Varejo', segment: 'varejo', ...calcTotal(varejo) },
      { name: 'Projeto', segment: 'projeto', ...calcTotal(projeto) },
    ];
  }, [varejo, projeto]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Performance por Segmento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              type="number"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              width={60}
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
              formatter={(value: number, name: string, props: any) => {
                const labels: Record<string, string> = {
                  ganhos: 'Ganhos',
                  andamento: 'Em Andamento',
                  perdidos: 'Perdidos',
                };
                const valorKey = `${name}Valor` as keyof typeof props.payload;
                const valorTotal = props.payload[valorKey] as number;
                return [`${value} negócios (${formatCurrency(valorTotal)})`, labels[name]];
              }}
            />
            <Legend 
              formatter={(value) => {
                const labels: Record<string, string> = {
                  ganhos: 'Ganhos',
                  andamento: 'Em Andamento',
                  perdidos: 'Perdidos',
                };
                return labels[value] || value;
              }}
            />
            <Bar 
              dataKey="ganhos" 
              stackId="a" 
              fill={COLORS.ganhos}
              onClick={(data) => onSegmentClick?.(data.segment, 'ganhos')}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="andamento" 
              stackId="a" 
              fill={COLORS.andamento}
              onClick={(data) => onSegmentClick?.(data.segment, 'andamento')}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="perdidos" 
              stackId="a" 
              fill={COLORS.perdidos}
              onClick={(data) => onSegmentClick?.(data.segment, 'perdidos')}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
