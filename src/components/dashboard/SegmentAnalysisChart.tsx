import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DealsByStatus } from '@/types/dashboard';

interface SourceData {
  name: string;
  value: number;
}

interface SegmentAnalysisChartProps {
  varejo: DealsByStatus;
  projeto: DealsByStatus;
  varejoSources: SourceData[];
  projetoSources: SourceData[];
  onSegmentClick?: (segment: string) => void;
}

const COLORS = {
  varejo: 'hsl(160, 84%, 39%)', // Green
  projeto: 'hsl(199, 89%, 48%)', // Blue
};

export function SegmentAnalysisChart({ 
  varejo, 
  projeto, 
  varejoSources, 
  projetoSources,
  onSegmentClick 
}: SegmentAnalysisChartProps) {
  // Calculate revenue and counts
  const varejoRevenue = varejo.ganhos.reduce((acc, d) => acc + (d.valor || 0), 0);
  const projetoRevenue = projeto.ganhos.reduce((acc, d) => acc + (d.valor || 0), 0);
  const totalRevenue = varejoRevenue + projetoRevenue;

  const varejoCount = varejo.ganhos.length + varejo.andamento.length + varejo.perdidos.length;
  const projetoCount = projeto.ganhos.length + projeto.andamento.length + projeto.perdidos.length;
  const totalCount = varejoCount + projetoCount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const segmentData = [
    { name: 'Varejo', value: varejoRevenue, count: varejoCount },
    { name: 'Projeto', value: projetoRevenue, count: projetoCount },
  ].filter(d => d.value > 0 || d.count > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{d.name}</p>
          <p className="text-sm text-foreground">{formatCurrency(d.value)}</p>
          <p className="text-sm text-muted-foreground">{d.count} negócios</p>
        </div>
      );
    }
    return null;
  };

  const renderSegmentDetail = (
    title: string,
    revenue: number,
    count: number,
    sources: SourceData[],
    color: string,
    segment: string
  ) => (
    <div
      className="flex-1 min-w-[200px] cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => onSegmentClick?.(segment)}
    >
      <div className="flex items-center gap-2 mb-3 p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground">{count} negócios</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">{formatCurrency(revenue)}</p>
          <p className="text-xs text-muted-foreground">
            {totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : 0}% da receita
          </p>
        </div>
      </div>
      <div className="space-y-1.5 pl-2">
        <p className="text-xs text-muted-foreground mb-2">Top Fontes:</p>
        {sources.slice(0, 4).map((source, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate max-w-[120px]" title={source.name}>
              {source.name}
            </span>
            <span className="font-medium text-foreground">{source.value}</span>
          </div>
        ))}
        {sources.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Sem dados de fonte</p>
        )}
      </div>
    </div>
  );

  if (totalCount === 0 && totalRevenue === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Análise por Segmento</CardTitle>
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
        <CardTitle className="text-lg">Análise por Segmento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Pie Chart */}
          <div className="w-full lg:w-[220px] flex flex-col items-center">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => onSegmentClick?.(data.name.toLowerCase())}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);

                      return (
                        <text 
                          x={x} 
                          y={y} 
                          fill="white" 
                          textAnchor="middle" 
                          dominantBaseline="central" 
                          className="text-[10px] font-bold drop-shadow-md"
                        >
                          {totalRevenue > 0 ? ((value / totalRevenue) * 100).toFixed(0) : 0}%
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {segmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === 'Varejo' ? COLORS.varejo : COLORS.projeto}
                        cursor="pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground">Receita Total (Ganhos)</p>
            </div>
          </div>

          {/* Segment Details */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 w-full">
            {renderSegmentDetail('Varejo', varejoRevenue, varejoCount, varejoSources, COLORS.varejo, 'varejo')}
            {renderSegmentDetail('Projeto', projetoRevenue, projetoCount, projetoSources, COLORS.projeto, 'projeto')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
