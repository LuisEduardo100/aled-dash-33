import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeadStatusPieChartProps {
  emAtendimento: number;
  descartados: number;
  convertidos: number;
  onSegmentClick?: (status: 'em_atendimento' | 'descartados' | 'convertidos') => void;
}

const COLORS = {
  em_atendimento: 'hsl(var(--warning))',
  descartados: 'hsl(var(--destructive))',
  convertidos: 'hsl(var(--success))',
};

const STATUS_LABELS = {
  em_atendimento: 'Em Atendimento',
  descartados: 'Descartados',
  convertidos: 'Convertidos',
};

export function LeadStatusPieChart({ 
  emAtendimento, 
  descartados, 
  convertidos,
  onSegmentClick 
}: LeadStatusPieChartProps) {
  const data = [
    { name: STATUS_LABELS.em_atendimento, value: emAtendimento, key: 'em_atendimento' as const },
    { name: STATUS_LABELS.descartados, value: descartados, key: 'descartados' as const },
    { name: STATUS_LABELS.convertidos, value: convertidos, key: 'convertidos' as const },
  ].filter(item => item.value > 0);

  const total = emAtendimento + descartados + convertidos;

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Status dos Leads</CardTitle>
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
        <CardTitle className="text-lg">Status dos Leads</CardTitle>
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
              formatter={(value: number, name: string) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                name,
              ]}
            />
            <Legend 
              verticalAlign="bottom"
              formatter={(value) => <span className="text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm text-muted-foreground">Total de Leads</p>
        </div>
      </CardContent>
    </Card>
  );
}
