import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CRMLead } from '@/types/crm';

interface DiscardAnalysisProps {
  discardedLeads: CRMLead[];
  onReasonClick?: (reason: string, leads: CRMLead[]) => void;
}

// Coral/red tones for discard reasons
const DISCARD_COLORS = [
  'hsl(0, 72%, 51%)',    // Red
  'hsl(16, 90%, 50%)',   // Coral
  'hsl(25, 95%, 53%)',   // Orange-coral
  'hsl(350, 89%, 60%)',  // Rose
  'hsl(10, 78%, 54%)',   // Salmon
  'hsl(0, 84%, 60%)',    // Light red
];

export function DiscardAnalysis({ discardedLeads, onReasonClick }: DiscardAnalysisProps) {
  // Group leads by discard reason
  const reasonCounts = discardedLeads.reduce((acc, lead) => {
    const reason = lead.discard_reason || 'Sem motivo informado';
    if (!acc[reason]) {
      acc[reason] = { count: 0, leads: [] };
    }
    acc[reason].count++;
    acc[reason].leads.push(lead);
    return acc;
  }, {} as Record<string, { count: number; leads: CRMLead[] }>);

  const chartData = Object.entries(reasonCounts)
    .map(([reason, data]) => ({
      name: reason,
      value: data.count,
      leads: data.leads,
    }))
    .sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} leads descartados</p>
          <p className="text-sm text-destructive">
            {((data.value / discardedLeads.length) * 100).toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  if (discardedLeads.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Análise de Descartes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum lead descartado no período</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Motivos de Descarte</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={120}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              onClick={(data) => onReasonClick?.(data.name, data.leads)}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={DISCARD_COLORS[index % DISCARD_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.slice(0, 4).map((item, index) => (
            <div
              key={item.name}
              className="p-2 rounded-lg bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors"
              onClick={() => onReasonClick?.(item.name, item.leads)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: DISCARD_COLORS[index] }}
                />
                <span className="text-xs text-muted-foreground truncate">{item.name}</span>
              </div>
              <p className="text-lg font-bold text-foreground ml-5">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
