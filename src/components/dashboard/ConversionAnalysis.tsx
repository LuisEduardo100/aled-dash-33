import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CRMLead, CRMDeal, getDealCategory } from '@/types/crm';

interface SourceConversionData {
  leads: CRMLead[];
  converted: CRMLead[];
  varejo: CRMLead[];
  projeto: CRMLead[];
  conversionRate: number;
}

interface ConversionAnalysisProps {
  googleData: SourceConversionData;
  metaData: SourceConversionData;
  indicacoesData: SourceConversionData;
  totalConverted: number;
  onSegmentClick?: (title: string, leads: CRMLead[]) => void;
}

const COLORS = {
  'Google': 'hsl(38, 92%, 50%)',
  'Meta Ads': 'hsl(221, 83%, 53%)',
  'Indicações': 'hsl(160, 84%, 39%)',
  'Varejo': 'hsl(160, 84%, 39%)',
  'Projeto': 'hsl(199, 89%, 48%)',
};

export function ConversionAnalysis({
  googleData,
  metaData,
  indicacoesData,
  totalConverted,
  onSegmentClick,
}: ConversionAnalysisProps) {
  const sourceData = [
    { 
      name: 'Google', 
      total: googleData.leads.length,
      converted: googleData.converted.length, 
      rate: googleData.conversionRate,
      leads: googleData.converted,
    },
    { 
      name: 'Meta Ads', 
      total: metaData.leads.length,
      converted: metaData.converted.length, 
      rate: metaData.conversionRate,
      leads: metaData.converted,
    },
    { 
      name: 'Indicações', 
      total: indicacoesData.leads.length,
      converted: indicacoesData.converted.length, 
      rate: indicacoesData.conversionRate,
      leads: indicacoesData.converted,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">Total de Leads: {data.total}</p>
          <p className="text-sm text-primary">Convertidos: {data.converted}</p>
          <p className="text-sm text-primary">Taxa: {data.rate.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const SegmentTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} leads</p>
        </div>
      );
    }
    return null;
  };

  const renderSourceBreakdown = (
    label: string,
    data: SourceConversionData,
    color: string
  ) => {
    const breakdown = [
      { name: 'Varejo', value: data.varejo.length, leads: data.varejo },
      { name: 'Projeto', value: data.projeto.length, leads: data.projeto },
    ];

    if (data.converted.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {data.conversionRate.toFixed(1)}% conversão
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={15}
                  outerRadius={28}
                  paddingAngle={3}
                  dataKey="value"
                  onClick={(_, index) => onSegmentClick?.(`${label} - ${breakdown[index].name}`, breakdown[index].leads)}
                  style={{ cursor: 'pointer' }}
                >
                  {breakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name as keyof typeof COLORS]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip content={<SegmentTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {breakdown.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-xs cursor-pointer hover:bg-secondary/30 px-1 py-0.5 rounded"
                onClick={() => onSegmentClick?.(`${label} - ${item.name}`, item.leads)}
              >
                <div className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Análise de Conversão por Canal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main comparison bar chart */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Conversões por Canal Principal</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={sourceData} layout="vertical">
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
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="converted"
                radius={[0, 4, 4, 0]}
                onClick={(_, index) => onSegmentClick?.(sourceData[index].name, sourceData[index].leads)}
                style={{ cursor: 'pointer' }}
              >
                {sourceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name as keyof typeof COLORS]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards with conversion rates */}
        <div className="grid grid-cols-3 gap-3">
          {sourceData.map((item) => (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors text-center"
              onClick={() => onSegmentClick?.(item.name, item.leads)}
            >
              <p className="text-xs text-muted-foreground">{item.name}</p>
              <p className="text-xl font-bold text-foreground">{item.converted}</p>
              <p className="text-xs text-primary">{item.rate.toFixed(1)}%</p>
            </div>
          ))}
        </div>

        {/* Detailed breakdown by segment (Varejo/Projeto) */}
        <div className="space-y-4 pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">Segmentação Varejo vs Projeto</p>
          {renderSourceBreakdown('Google', googleData, COLORS['Google'])}
          {renderSourceBreakdown('Meta Ads', metaData, COLORS['Meta Ads'])}
          {renderSourceBreakdown('Indicações', indicacoesData, COLORS['Indicações'])}
        </div>
      </CardContent>
    </Card>
  );
}
