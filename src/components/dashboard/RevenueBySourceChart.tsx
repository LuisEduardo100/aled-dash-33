import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedDeal } from '@/types/dashboard';

interface RevenueBySourceChartProps {
  deals: SegmentedDeal[];
  onBarClick?: (source: string, sourceDeals: SegmentedDeal[]) => void;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
];

export function RevenueBySourceChart({ deals, onBarClick }: RevenueBySourceChartProps) {
  const chartData = useMemo(() => {
    const sourceMap = new Map<string, { value: number; deals: SegmentedDeal[] }>();

    deals.forEach(deal => {
      const source = deal.fonte || 'Desconhecido';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { value: 0, deals: [] });
      }
      const entry = sourceMap.get(source)!;
      entry.value += deal.valor || 0;
      entry.deals.push(deal);
    });

    return Array.from(sourceMap.entries())
      .map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
        fullName: name,
        value: data.value,
        deals: data.deals,
        count: data.deals.length,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [deals]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return `R$ ${value.toFixed(0)}`;
  };

  const formatFullCurrency = (value: number) => {
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
          <CardTitle className="text-lg">Receita por Fonte</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[350px]">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Receita por Fonte</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={formatCurrency}
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
              formatter={(value: number) => [formatFullCurrency(value), 'Receita']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `${payload[0].payload.fullName} (${payload[0].payload.count} negócios)`;
                }
                return label;
              }}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              onClick={(data) => onBarClick?.(data.fullName, data.deals)}
              className="cursor-pointer"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
