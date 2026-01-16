import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedLead } from '@/types/dashboard';

interface SourceChartProps {
  leads: SegmentedLead[];
  onBarClick: (source: string, leads: SegmentedLead[]) => void;
}

const COLORS = {
  'Meta Ads': 'hsl(199, 89%, 48%)', // Info blue
  'Google Ads': 'hsl(38, 92%, 50%)', // Warning orange
  'Indicação': 'hsl(142, 71%, 45%)', // Success green
  'LTV': 'hsl(280, 65%, 60%)', // Purple for LTV
  'Outros': 'hsl(160, 84%, 39%)', // Primary green
};

export function SourceChart({ leads, onBarClick }: SourceChartProps) {
  // Group leads by source
  const sourceData = leads.reduce((acc, lead) => {
    let source = lead.fonte || 'Outros';
    const s = source.toLowerCase();
    // Group meta sources
    if (s.includes('meta') || s.includes('facebook') || s.includes('instagram')) {
      source = 'Meta Ads';
    } else if (s.includes('google')) {
      source = 'Google Ads';
    } else if (s.includes('indica')) {
      source = 'Indicação';
    } else if (s.includes('ltv')) {
      source = 'LTV';
    } else {
      source = 'Outros';
    }

    if (!acc[source]) {
      acc[source] = { leads: [], converted: 0 };
    }
    acc[source].leads.push(lead);
    if (lead.status_codigo === 'CONVERTED' || lead.status_codigo === 'S') {
      acc[source].converted++;
    }
    return acc;
  }, {} as Record<string, { leads: SegmentedLead[]; converted: number }>);

  const chartData = Object.entries(sourceData).map(([name, data]) => ({
    name,
    total: data.leads.length,
    converted: data.converted,
    leads: data.leads,
    conversionRate: data.leads.length > 0 ? ((data.converted / data.leads.length) * 100).toFixed(1) : '0',
  }));

  // Sort by total leads descending
  chartData.sort((a, b) => b.total - a.total);

  const handleClick = (data: { name: string; leads: SegmentedLead[] }) => {
    onBarClick(data.name, data.leads);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.total} leads</p>
          <p className="text-sm text-primary">{data.converted} convertidos ({data.conversionRate}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Atribuição de Origem</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--accent))' }} />
              <Bar
                dataKey="total"
                radius={[0, 4, 4, 0]}
                onClick={(_, index) => handleClick(chartData[index])}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS] || COLORS['Outros']}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            Nenhum lead no período
          </div>
        )}

        {/* Source breakdown cards */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors text-center"
              onClick={() => handleClick(item)}
            >
              <p className="text-xs text-muted-foreground truncate">{item.name}</p>
              <p className="text-lg font-bold text-foreground">{item.total}</p>
              <p className="text-xs text-primary">{item.conversionRate}% conv.</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
