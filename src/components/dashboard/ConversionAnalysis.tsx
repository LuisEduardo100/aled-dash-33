import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedLead, SegmentedDeal } from '@/types/dashboard';

interface ConversionAnalysisProps {
  googleConvertedLeads: SegmentedLead[];
  metaConvertedLeads: SegmentedLead[];
  indicacaoConvertedLeads: SegmentedLead[];
  profissionalConvertedLeads: SegmentedLead[];
  ltvConvertedLeads: SegmentedLead[];
  otherConvertedLeads: SegmentedLead[];
  googleConvertedVarejo: SegmentedDeal[];
  googleConvertedProjeto: SegmentedDeal[];
  metaConvertedVarejo: SegmentedDeal[];
  metaConvertedProjeto: SegmentedDeal[];
  totalConverted: number;
  onSegmentClick?: (title: string, leadsOrDeals: SegmentedLead[] | SegmentedDeal[]) => void;
}

const COLORS = {
  'Google Ads': 'hsl(38, 92%, 50%)',
  'Meta Ads': 'hsl(262, 83%, 58%)',
  'Indicação Amigo': 'hsl(142, 71%, 45%)',
  'Profissional': 'hsl(200, 98%, 39%)',
  'LTV': 'hsl(330, 81%, 60%)',
  'Outras Fontes': 'hsl(var(--muted))',
  'Varejo': 'hsl(160, 84%, 39%)',
  'Projeto': 'hsl(199, 89%, 48%)',
};

export function ConversionAnalysis({
  googleConvertedLeads,
  metaConvertedLeads,
  indicacaoConvertedLeads,
  profissionalConvertedLeads,
  ltvConvertedLeads,
  otherConvertedLeads,
  googleConvertedVarejo,
  googleConvertedProjeto,
  metaConvertedVarejo,
  metaConvertedProjeto,
  totalConverted,
  onSegmentClick,
}: ConversionAnalysisProps) {
  const googleCount = googleConvertedLeads.length;
  const metaCount = metaConvertedLeads.length;
  const indicacaoCount = indicacaoConvertedLeads.length;
  const profissionalCount = profissionalConvertedLeads.length;
  const ltvCount = ltvConvertedLeads.length;
  const otherCount = otherConvertedLeads.length;

  const getPercent = (count: number) => totalConverted > 0 ? ((count / totalConverted) * 100).toFixed(1) : '0';

  const sourceData = [
    { name: 'Google Ads', value: googleCount, percent: getPercent(googleCount), items: googleConvertedLeads },
    { name: 'Meta Ads', value: metaCount, percent: getPercent(metaCount), items: metaConvertedLeads },
    { name: 'Indicação Amigo', value: indicacaoCount, percent: getPercent(indicacaoCount), items: indicacaoConvertedLeads },
    { name: 'Profissional', value: profissionalCount, percent: getPercent(profissionalCount), items: profissionalConvertedLeads },
    { name: 'LTV', value: ltvCount, percent: getPercent(ltvCount), items: ltvConvertedLeads },
    { name: 'Outras Fontes', value: otherCount, percent: getPercent(otherCount), items: otherConvertedLeads },
  ].sort((a, b) => b.value - a.value);

  const googleBreakdown = [
    { name: 'Varejo', value: googleConvertedVarejo.length, items: googleConvertedVarejo },
    { name: 'Projeto', value: googleConvertedProjeto.length, items: googleConvertedProjeto },
  ];

  const metaBreakdown = [
    { name: 'Varejo', value: metaConvertedVarejo.length, items: metaConvertedVarejo },
    { name: 'Projeto', value: metaConvertedProjeto.length, items: metaConvertedProjeto },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} itens</p>
          {data.percent && (
            <p className="text-sm text-primary">{data.percent}% do total</p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderBreakdownPie = (title: string, breakdownData: typeof googleBreakdown) => (
    <div>
      <p className="text-sm text-muted-foreground mb-3">{title}</p>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie
              data={breakdownData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={5}
              dataKey="value"
              onClick={(_, index) => onSegmentClick?.(`${title} - ${breakdownData[index].name}`, breakdownData[index].items)}
              style={{ cursor: 'pointer' }}
            >
              {breakdownData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {breakdownData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-2 rounded bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => onSegmentClick?.(`${title} - ${item.name}`, item.items)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
                />
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Análise de Conversão por Fonte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main comparison */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Origem de Conversão</p>
          <ResponsiveContainer width="100%" height={250}>
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
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                onClick={(_, index) => onSegmentClick?.(sourceData[index].name, sourceData[index].items)}
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {sourceData.map((item) => (
            <div
              key={item.name}
              className="p-2 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => onSegmentClick?.(item.name, item.items)}
            >
              <p className="text-[10px] text-muted-foreground truncate" title={item.name}>{item.name}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
              <p className="text-[10px] text-primary">{item.percent}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
