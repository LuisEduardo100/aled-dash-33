
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SourceData {
    name: string;
    value: number;
}

interface ConvertedSegmentationChartProps {
    data: {
        varejo: number;
        projeto: number;
        varejoSources: SourceData[];
        projetoSources: SourceData[];
    };
    onSegmentClick?: (segment: string) => void;
}

const COLORS = {
    varejo: 'hsl(160, 84%, 39%)', // Green
    projeto: 'hsl(199, 89%, 48%)', // Blue
};

// Pastel/Light colors for source breakdown
const SOURCE_COLORS = [
    '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#fbbf24', '#9ca3af'
];

export function ConvertedSegmentationChart({ data, onSegmentClick }: ConvertedSegmentationChartProps) {
    const segmentData = [
        { name: 'Varejo', value: data.varejo },
        { name: 'Projeto', value: data.projeto },
    ].filter(d => d.value > 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            return (
                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-foreground">{d.name}</p>
                    <p className="text-sm text-foreground">{d.value} conversões</p>
                </div>
            );
        }
        return null;
    };

    const renderSourceList = (title: string, sources: SourceData[], color: string) => (
        <div
            className="flex-1 min-w-[200px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onSegmentClick?.(title)}
        >
            <div className="flex items-center gap-2 mb-2 p-2 rounded bg-secondary/30">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <h4 className="font-semibold text-sm">{title}</h4>
                <span className="ml-auto text-xs font-mono bg-background px-1 rounded">{sources.reduce((a, b) => a + b.value, 0)}</span>
            </div>
            <div className="space-y-1 pl-2">
                {sources.slice(0, 5).map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{source.name}</span>
                        <span className="font-medium">{source.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Segmentação de Convertidos</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Pie Chart */}
                    <div className="h-[200px] w-[200px] flex-shrink-0">
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
                                    onClick={(data) => onSegmentClick?.(data.name)}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                        return (
                                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold drop-shadow-md">
                                                {value}
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
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-xl">
                                    {data.varejo + data.projeto}
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Breakdown Lists */}
                    <div className="flex flex-wrap gap-4 w-full">
                        {renderSourceList('Varejo', data.varejoSources, COLORS.varejo)}
                        {renderSourceList('Projeto', data.projetoSources, COLORS.projeto)}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
