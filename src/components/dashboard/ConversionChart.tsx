import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedDeal } from '@/types/dashboard';

interface ConversionChartProps {
  deals: SegmentedDeal[];
  onSegmentClick: (category: string, deals: SegmentedDeal[]) => void;
}

const COLORS = {
  'Varejo': 'hsl(160, 84%, 39%)', // Primary green
  'Projeto': 'hsl(199, 89%, 48%)', // Info blue
  'Outros': 'hsl(215, 20%, 65%)', // Muted
};

export function ConversionChart({ deals, onSegmentClick }: ConversionChartProps) {
  // Filter only won deals for conversion analysis
  const wonDeals = deals.filter(d => d.status_nome === 'Ganho');

  // Group by category
  const categoryData = wonDeals.reduce((acc, deal) => {
    // Normalize category name details
    let category = deal.segmento || 'Outros';
    // Capitalize first letter if needed or match exact keys
    if (category.toLowerCase() === 'varejo') category = 'Varejo';
    else if (category.toLowerCase() === 'projeto') category = 'Projeto';
    else category = 'Outros';

    if (!acc[category]) {
      acc[category] = { count: 0, value: 0, deals: [] };
    }
    acc[category].count++;
    acc[category].value += (deal.valor || 0);
    acc[category].deals.push(deal);
    return acc;
  }, {} as Record<string, { count: number; value: number; deals: SegmentedDeal[] }>);

  const chartData = Object.entries(categoryData).map(([name, data]) => ({
    name,
    value: data.count,
    totalValue: data.value,
    deals: data.deals,
  }));

  const handleClick = (data: { name: string; deals: SegmentedDeal[] }) => {
    onSegmentClick(data.name, data.deals);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} negócios</p>
          <p className="text-sm text-primary font-medium">{formatCurrency(data.totalValue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Análise de Renda Gerada</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                onClick={(_, index) => handleClick(chartData[index])}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Outros}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-sm text-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            Nenhum negócio convertido no período
          </div>
        )}

        {/* Summary below chart */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => handleClick(item)}
            >
              <p className="text-sm text-muted-foreground">{item.name}</p>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-primary">{formatCurrency(item.totalValue)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
