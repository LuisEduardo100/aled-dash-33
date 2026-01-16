import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DiscardReasonChartProps {
    data: { name: string; value: number }[];
    lossData?: { name: string; value: number }[]; // New prop for Lost Deals
    onReasonClick?: (reason: string, type: 'lead' | 'deal') => void;
}

export function DiscardReasonChart({ data, lossData, onReasonClick }: DiscardReasonChartProps) {
    const [viewType, setViewType] = useState<'lead' | 'deal'>('lead');

    // Select data based on view type
    const activeData = viewType === 'deal' && lossData ? lossData : data;
    const title = viewType === 'deal' ? 'Motivos de Perda (Negócios)' : 'Motivos de Descarte (Leads)';

    // Take only top 7 reasons
    const chartData = activeData.slice(0, 7);

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{title}</CardTitle>
                <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'lead' | 'deal')}>
                    <TabsList className="h-8">
                        <TabsTrigger value="lead" className="text-xs h-7">Leads</TabsTrigger>
                        <TabsTrigger value="deal" className="text-xs h-7">Negócios</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-3 mt-2">
                    {chartData.length > 0 ? (
                        chartData.map((item) => {
                            // Calculate relative width max 100% based on max value
                            const maxValue = Math.max(...chartData.map(d => d.value));
                            const percentage = (item.value / maxValue) * 100;

                            return (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-3 cursor-pointer group"
                                    onClick={() => onReasonClick?.(item.name, viewType)}
                                >
                                    <span className="text-sm font-medium w-[140px] text-right truncate text-muted-foreground group-hover:text-foreground transition-colors" title={item.name}>
                                        {item.name}
                                    </span>
                                    <div className="flex-1 h-8 bg-secondary/20 rounded-r-md relative flex items-center">
                                        <div
                                            className="h-full bg-destructive rounded-r-md transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                            style={{ width: `${percentage}%` }}
                                        />
                                        <span className="ml-2 font-bold text-foreground">{item.value}</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                            Nenhum registro
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
