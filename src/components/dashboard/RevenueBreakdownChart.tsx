import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueBreakdownChartProps {
  varejoRevenue: number;
  projetoRevenue: number;
  onSegmentClick?: (segment: 'varejo' | 'projeto') => void;
}

const COLORS = {
  varejo: 'hsl(var(--info))',
  projeto: 'hsl(var(--secondary))',
};

export function RevenueBreakdownChart({ 
  varejoRevenue, 
  projetoRevenue,
  onSegmentClick 
}: RevenueBreakdownChartProps) {
  const total = varejoRevenue + projetoRevenue;
  
  const data = [
    { name: 'Varejo', value: varejoRevenue, key: 'varejo' as const },
    { name: 'Projeto', value: projetoRevenue, key: 'projeto' as const },
  ].filter(item => item.value > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Receita por Segmento</CardTitle>
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
        <CardTitle className="text-lg">Receita por Segmento</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onSegmentClick?.(entry.key)}
              className="cursor-pointer"
            >
              {data.map((entry) => (
                <Cell 
                  key={entry.key} 
                  fill={COLORS[entry.key]}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
              ))}
            </Pie>
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
              formatter={(value: number) => [
                formatCurrency(value),
                'Receita',
              ]}
            />
            <Legend 
              verticalAlign="bottom"
              formatter={(value) => <span className="text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
          <p className="text-sm text-muted-foreground">Total de Receita</p>
        </div>
      </CardContent>
    </Card>
  );
}
