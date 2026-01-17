import React from 'react';
import ReactECharts from 'echarts-for-react';
import { DemandMetrics } from '@/hooks/useDemandMetrics';

interface GoalGaugeChartProps {
    metrics: DemandMetrics;
}

export const GoalGaugeChart: React.FC<GoalGaugeChartProps> = ({ metrics }) => {
    const createGaugeOption = (value: number, max: number, title: string, color: string) => ({
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'], // Restored standard center
                radius: '110%', // Sligthly larger
                min: 0,
                max: 100,
                splitNumber: 5, // Match Dashboard
                axisLine: {
                    lineStyle: {
                        width: 30, // Match Dashboard thickness
                        color: [
                            [0.25, '#ef4444'],
                            [0.5, '#f59e0b'],
                            [0.75, '#3b82f6'],
                            [1, '#10b981']
                        ]
                    }
                },
                pointer: {
                    icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                    length: '15%',
                    width: 12,
                    offsetCenter: [0, '-50%'],
                    itemStyle: { color: 'auto' }
                },
                axisTick: {
                    length: 8,
                    lineStyle: { color: 'auto', width: 2 }
                },
                splitLine: {
                    length: 12,
                    lineStyle: { color: 'auto', width: 3 }
                },
                axisLabel: {
                    color: '#94a3b8',
                    fontSize: 12,
                    distance: -50, // Match Dashboard
                    formatter: (val: number) => val === 100 ? 'META' : ''
                },
                title: {
                    show: false // Dashboard hides title inside gauge, uses external or custom
                },
                detail: {
                    fontSize: 30,
                    offsetCenter: [0, '0%'], // Center
                    valueAnimation: true,
                    formatter: (val: number) => `${val.toFixed(1)}%`,
                    color: 'auto',
                },
                data: [{ value: Math.min(100, value), name: title }]
            }
        ]
    });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">
                    💰 Faturamento
                </h4>
                <div className="flex-1 flex items-center justify-center">
                    <ReactECharts
                        option={createGaugeOption(
                            metrics.faturamentoProgress,
                            100,
                            'Ganhos',
                            '#10b981'
                        )}
                        style={{ height: '300px', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 flex flex-col">
                <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">
                    📊 Oportunidades
                </h4>
                <div className="flex-1 flex items-center justify-center">
                    <ReactECharts
                        option={createGaugeOption(
                            metrics.oportunidadesProgress,
                            100,
                            'Pipeline',
                            '#3b82f6'
                        )}
                        style={{ height: '300px', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                    />
                </div>
            </div>
        </div>
    );
};
