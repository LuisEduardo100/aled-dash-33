import React from 'react';
import ReactECharts from 'echarts-for-react';
import { MonthlyGoalMetrics } from '@/types/dashboard';
import { Target, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';

interface MonthlyGoalSectionProps {
    metrics: MonthlyGoalMetrics | undefined;
    isSyncing?: boolean;
}

export const MonthlyGoalSection: React.FC<MonthlyGoalSectionProps> = ({ metrics, isSyncing }) => {
    if (!metrics) return null;

    const { current, target, progress, projection, pace, isGoalMet, workingDays } = metrics;

    // Gauge Setup
    const option = {
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'],
                radius: '100%',
                min: 0,
                max: target,
                splitNumber: 5,
                axisLine: {
                    lineStyle: {
                        width: 30,
                        color: [
                            [0.25, '#ef4444'], // Red
                            [0.5, '#f59e0b'],  // Amber
                            [0.75, '#3b82f6'], // Blue
                            [1, '#10b981']     // Emerald
                        ]
                    }
                },
                pointer: {
                    icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                    length: '15%',
                    width: 12,
                    offsetCenter: [0, '-50%'],
                    itemStyle: {
                        color: 'auto' // Auto matches the segment color, or use '#e2e8f0' for white-ish
                    }
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
                    color: '#94a3b8', // Slate 400 (Lighter for dark mode)
                    fontSize: 12,
                    distance: -50,
                    formatter: function (value: number) {
                        return Math.round(value) === target ? 'META' : '';
                    }
                },
                title: { show: false },
                detail: {
                    fontSize: 36,
                    offsetCenter: [0, '-10%'],
                    valueAnimation: true,
                    formatter: function (value: number) {
                        return `{value|${Math.round(value)}}\n{label|leads}`;
                    },
                    rich: {
                        value: {
                            fontSize: 32,
                            fontWeight: 'bold',
                            color: '#f1f5f9', // Slate 100 (White-ish)
                            padding: [0, 0, 5, 0]
                        },
                        label: {
                            fontSize: 14,
                            color: '#94a3b8' // Slate 400
                        }
                    }
                },
                data: [{ value: current }]
            }
        ]
    };

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-8 items-center">

                {/* Visual / Gauge Section */}
                <div className="w-full lg:w-1/3 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-8">
                    <div className="flex items-center gap-2 mb-2 self-start">
                        <Target className="h-5 w-5 text-indigo-400" />
                        <h2 className="text-lg font-semibold text-card-foreground">Meta Mensal</h2>
                    </div>
                    <p className="text-sm text-muted-foreground self-start mb-4">
                        Projeto (Google + Meta Ads)
                    </p>

                    <div className="relative w-full h-[200px] flex items-center justify-center">
                        <ReactECharts
                            option={option}
                            style={{ height: '300px', width: '100%', marginTop: '-60px' }}
                            opts={{ renderer: 'svg' }}
                        />
                        {isGoalMet && (
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[20%] mt-8 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="h-3 w-3" />
                                Meta Batida!
                            </div>
                        )}
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Progress Bar */}
                    <div className="md:col-span-2 bg-muted/30 rounded-lg p-4 border border-border">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Progresso Atual</span>
                                <div className="text-2xl font-bold text-card-foreground mt-1">{progress.toFixed(1)}%</div>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Meta: {target}</span>
                        </div>
                        <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${isGoalMet ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(100, progress)}%` }}
                            />
                        </div>
                    </div>

                    {/* Projection Card */}
                    <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-1">
                                    <TrendingUp className="h-4 w-4 text-blue-400" />
                                    Projeção
                                </span>
                                <div className="text-3xl font-bold text-card-foreground">{projection}</div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            Considerando <strong className="text-foreground">{workingDays.elapsed}</strong> dias úteis já passados
                        </div>
                    </div>

                    {/* Pace Card */}
                    <div className="bg-card rounded-lg p-4 border border-border shadow-sm flex flex-col justify-between hover:border-indigo-500/50 transition-colors">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-1">
                                    <Calendar className="h-4 w-4 text-orange-400" />
                                    Necessário Hoje
                                </span>
                                <div className="text-3xl font-bold text-card-foreground">
                                    {pace} <span className="text-base font-normal text-muted-foreground">/ dia</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            Para bater a meta em <strong className="text-foreground">{workingDays.remaining}</strong> dias úteis
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
