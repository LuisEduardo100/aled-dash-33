import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedLead } from '@/types/dashboard';

interface ConversionAnalysisProps {
  googleConvertedLeads: SegmentedLead[];
  otherConvertedLeads: SegmentedLead[];
  googleConvertedVarejo: SegmentedLead[];
  googleConvertedProjeto: SegmentedLead[];
  totalConverted: number;
  onSegmentClick?: (title: string, leads: SegmentedLead[]) => void;
}

const COLORS = {
  'Google Ads': 'hsl(38, 92%, 50%)',
  'Outras Fontes': 'hsl(160, 84%, 39%)',
  'Varejo': 'hsl(160, 84%, 39%)',
  'Projeto': 'hsl(199, 89%, 48%)',
};

export function ConversionAnalysis({
  googleConvertedLeads,
  otherConvertedLeads,
  googleConvertedVarejo,
  googleConvertedProjeto,
  totalConverted,
  onSegmentClick,
}: ConversionAnalysisProps) {
  const googleCount = googleConvertedLeads.length;
  const otherCount = otherConvertedLeads.length;
  const googlePercent = totalConverted > 0 ? ((googleCount / totalConverted) * 100).toFixed(1) : '0';
  const otherPercent = totalConverted > 0 ? ((otherCount / totalConverted) * 100).toFixed(1) : '0';

  const sourceData = [
    { name: 'Google Ads', value: googleCount, percent: googlePercent, leads: googleConvertedLeads },
    { name: 'Outras Fontes', value: otherCount, percent: otherPercent, leads: otherConvertedLeads },
  ];

  const googleBreakdown = [
    { name: 'Varejo', value: googleConvertedVarejo.length, leads: googleConvertedVarejo },
    { name: 'Projeto', value: googleConvertedProjeto.length, leads: googleConvertedProjeto },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.value} leads</p>
          {data.percent && (
            <p className="text-sm text-primary">{data.percent}% do total</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Análise de Conversão por Fonte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main comparison */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">Google Ads vs Outras Fontes</p>
          <ResponsiveContainer width="100%" height={120}>
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
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          {sourceData.map((item) => (
            <div
              key={item.name}
              className="p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors"
              onClick={() => onSegmentClick?.(item.name, item.leads)}
            >
              <p className="text-xs text-muted-foreground">{item.name}</p>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-primary">{item.percent}%</p>
            </div>
          ))}
        </div>

        {/* Google breakdown by deal type */}
        {googleCount > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">Segmentação Google Ads</p>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={150}>
                <PieChart>
                  <Pie
                    data={googleBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(_, index) => onSegmentClick?.(`Google - ${googleBreakdown[index].name}`, googleBreakdown[index].leads)}
                    style={{ cursor: 'pointer' }}
                  >
                    {googleBreakdown.map((entry, index) => (
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
                {googleBreakdown.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2 rounded bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                    onClick={() => onSegmentClick?.(`Google - ${item.name}`, item.leads)}
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
        )}
      </CardContent>
    </Card>
  );
}
