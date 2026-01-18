import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { DemandMetrics } from '@/hooks/useDemandMetrics';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DailyProgressChartProps {
    metrics: DemandMetrics;
}

type MetricType = 'faturamento' | 'oportunidades';

export const DailyProgressChart: React.FC<DailyProgressChartProps> = ({ metrics }) => {
    const [metricType, setMetricType] = useState<MetricType>('faturamento');

    // Select Data Source based on Toggle
    const metricMeta = metricType === 'faturamento' ? metrics.faturamentoMeta : metrics.oportunidadesMeta;
    const dailyDataKey = metricType === 'faturamento' ? 'faturamento' : 'oportunidades';
    const chartTitle = metricType === 'faturamento' ? 'Faturamento (Realizado vs Meta)' : 'Oportunidades (Pipeline vs Meta)';
    const barColor = metricType === 'faturamento' ? ['#10b981', '#059669'] : ['#3b82f6', '#2563eb']; // Green for Fat, Blue for Opp
    const lineColor = metricType === 'faturamento' ? '#f59e0b' : '#f59e0b'; // Gold for meta line

    // Generate ideal daily goal line data
    const dailyGoal = metricMeta > 0 ? metricMeta / metrics.daysInMonth : 0;
    const idealData: number[] = [];
    const daysArray: string[] = [];
    
    for (let i = 1; i <= metrics.daysInMonth; i++) {
        daysArray.push(`${i}`);
        idealData.push(dailyGoal * i);
    }

    // Create cumulative realized data
    let cumulative = 0;
    const cumulativeData: (number | null)[] = metrics.dailyData.map(d => {
        const val = d[dailyDataKey] as number;
        cumulative += val;
        return cumulative;
    });

    // Pad with nulls for future days
    while (cumulativeData.length < metrics.daysInMonth) {
        cumulativeData.push(null);
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            borderColor: '#374151',
            textStyle: { color: '#f3f4f6' },
            formatter: (params: any[]) => {
                const day = params[0]?.axisValue;
                let result = `<div style="font-weight:bold;margin-bottom:4px">Dia ${day}</div>`;
                params.forEach((p: any) => {
                    if (p.value !== null && p.value !== undefined) {
                        const value = new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            notation: 'compact'
                        }).format(p.value);
                        result += `<div>${p.marker} ${p.seriesName}: <strong>${value}</strong></div>`;
                    }
                });
                return result;
            }
        },
        legend: {
            data: ['Realizado Acumulado', 'Meta Ideal'],
            textStyle: { color: '#94a3b8' },
            top: 5,
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: daysArray,
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            axisLine: { lineStyle: { color: '#374151' } },
            name: 'Dia do Mês',
            nameLocation: 'center',
            nameGap: 25,
            nameTextStyle: { color: '#94a3b8' }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#94a3b8',
                fontSize: 10,
                formatter: (val: number) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                }
            },
            axisLine: { lineStyle: { color: '#374151' } },
            splitLine: { lineStyle: { color: '#1f2937' } }
        },
        series: [
            {
                name: 'Realizado Acumulado',
                type: 'bar',
                data: cumulativeData,
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: barColor[0] },
                            { offset: 1, color: barColor[1] }
                        ]
                    },
                    borderRadius: [4, 4, 0, 0]
                },
                barWidth: '60%'
            },
            {
                name: 'Meta Ideal',
                type: 'line',
                data: idealData,
                smooth: true,
                lineStyle: { color: lineColor, width: 2, type: 'dashed' },
                symbol: 'none',
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(245, 158, 11, 0.15)' },
                            { offset: 1, color: 'rgba(245, 158, 11, 0.02)' }
                        ]
                    }
                }
            }
        ]
    };

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                    📈 {chartTitle}
                </h4>
                <div className="flex items-center space-x-2">
                    <Label htmlFor="metric-toggle" className="text-xs text-muted-foreground">
                        {metricType === 'faturamento' ? 'Faturamento' : 'Oportunidades'}
                    </Label>
                    <Switch
                        id="metric-toggle"
                        checked={metricType === 'oportunidades'}
                        onCheckedChange={(checked) => setMetricType(checked ? 'oportunidades' : 'faturamento')}
                    />
                </div>
            </div>
            <ReactECharts
                option={option}
                style={{ height: '280px', width: '100%' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    );
};
