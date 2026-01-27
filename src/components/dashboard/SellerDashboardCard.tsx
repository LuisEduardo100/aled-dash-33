import React, { useState, useRef, useEffect } from 'react';
import { getSellerPhoto, getSellerMonthlyGoal, setSellerMonthlyGoal } from '@/utils/sellerPhotos';
import { User, TrendingUp, ShoppingCart, Settings2 } from 'lucide-react';
import { getDaysInMonth, getDate } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as echarts from 'echarts';

interface SellerDashboardCardProps {
    name: string;
    totalValue: number;
    dealCount: number;
    isTopPerformer?: boolean;
    rank?: number;
    onGoalUpdate?: () => void;
}

export function SellerDashboardCard({
    name,
    totalValue,
    dealCount,
    isTopPerformer = false,
    rank,
    onGoalUpdate
}: SellerDashboardCardProps) {
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const gaugeRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<echarts.ECharts | null>(null);

    // Get seller photo
    const photoPath = getSellerPhoto(name);

    // Get monthly goal
    const monthlyGoal = getSellerMonthlyGoal(name);

    // Calculate metrics
    const today = new Date();
    const daysInMonth = getDaysInMonth(today);
    const currentDay = getDate(today);

    // Daily goal = Monthly goal / days in month
    const dailyGoal = monthlyGoal / daysInMonth;

    // Average per deal (ticket médio)
    const averageTicket = dealCount > 0 ? totalValue / dealCount : 0;

    // Average per day
    const averagePerDay = currentDay > 0 ? totalValue / currentDay : 0;

    // Financial conversion rate (% of goal achieved)
    const financialConversionRate = monthlyGoal > 0 ? (totalValue / monthlyGoal) * 100 : 0;

    // Format currency
    const formatShortCurrency = (val: number): string => {
        if (val >= 1000000) {
            return `${(val / 1000000).toFixed(1).replace('.', ',')}M`;
        }
        if (val >= 1000) {
            return `${(val / 1000).toFixed(1).replace('.', ',')}k`;
        }
        return val.toFixed(0);
    };

    const formatGaugeValue = (val: number): string => {
        if (val >= 1000000) {
            return `${(val / 1000000).toFixed(2).replace('.', ',')} Mi`;
        }
        if (val >= 1000) {
            return `${(val / 1000).toFixed(2).replace('.', ',')} Mil`;
        }
        return new Intl.NumberFormat('pt-BR').format(val);
    };

    // Initialize ECharts gauge - NO value inside, just the arc
    useEffect(() => {
        if (!gaugeRef.current) return;

        if (chartRef.current) {
            chartRef.current.dispose();
        }

        const chart = echarts.init(gaugeRef.current);
        chartRef.current = chart;

        const percentage = Math.min((totalValue / monthlyGoal) * 100, 100);

        const option: echarts.EChartsOption = {
            series: [
                {
                    type: 'gauge',
                    startAngle: 180,
                    endAngle: 0,
                    min: 0,
                    max: 100,
                    splitNumber: 5,
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 1,
                            y2: 0,
                            colorStops: [
                                { offset: 0, color: '#22c55e' },
                                { offset: 0.5, color: '#4ade80' },
                                { offset: 1, color: '#86efac' }
                            ]
                        }
                    },
                    progress: {
                        show: true,
                        width: 14
                    },
                    pointer: {
                        show: false
                    },
                    axisLine: {
                        lineStyle: {
                            width: 14,
                            color: [[1, 'rgba(255,255,255,0.08)']]
                        }
                    },
                    axisTick: { show: false },
                    splitLine: { show: false },
                    axisLabel: { show: false },
                    anchor: { show: false },
                    title: { show: false },
                    detail: { show: false },
                    data: [{ value: percentage }]
                }
            ]
        };

        chart.setOption(option);

        const handleResize = () => chart.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.dispose();
        };
    }, [totalValue, monthlyGoal]);

    // Handle goal save
    const handleSaveGoal = () => {
        const newGoal = parseFloat(goalInput.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(newGoal) && newGoal > 0) {
            setSellerMonthlyGoal(name, newGoal);
            setIsEditingGoal(false);
            setGoalInput('');
            onGoalUpdate?.();
        }
    };

    return (
        <div className={`
            bg-card border rounded-xl overflow-hidden shadow-lg relative
            ${isTopPerformer ? 'ring-2 ring-yellow-500/50' : ''}
            transition-all duration-300 hover:shadow-xl
        `}>
            {/* Edit goal button - Top right */}
            <Dialog open={isEditingGoal} onOpenChange={setIsEditingGoal}>
                <DialogTrigger asChild>
                    <button className="absolute top-2 right-2 p-1.5 hover:bg-muted rounded transition-colors z-10 opacity-60 hover:opacity-100">
                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Meta Mensal - {name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div>
                            <Label>Meta Atual</Label>
                            <p className="text-lg font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyGoal)}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="newGoal">Nova Meta (R$)</Label>
                            <Input
                                id="newGoal"
                                type="text"
                                placeholder="Ex: 150000"
                                value={goalInput}
                                onChange={(e) => setGoalInput(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleSaveGoal} className="w-full">
                            Salvar Meta
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Top section: Photo + Name + Metrics */}
            <div className="p-3 lg:p-4 xl:p-5">
                {/* Header: Photo, Name, Rank */}
                <div className="flex items-center gap-3 mb-2">
                    {/* Photo */}
                    {photoPath ? (
                        <img
                            src={photoPath}
                            alt={name}
                            className="w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-full object-cover border-3 border-primary/20 shadow-lg"
                        />
                    ) : (
                        <div className="w-14 h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20 rounded-full bg-muted flex items-center justify-center border-3 border-primary/20 shadow-lg">
                            <User className="w-7 h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 text-muted-foreground" />
                        </div>
                    )}

                    {/* Name and Rank */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            {rank && rank <= 3 && (
                                <span className={`
                                    text-xs lg:text-sm font-bold px-2 py-0.5 rounded
                                    ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : ''}
                                    ${rank === 2 ? 'bg-gray-400/20 text-gray-400' : ''}
                                    ${rank === 3 ? 'bg-orange-500/20 text-orange-500' : ''}
                                `}>
                                    #{rank}
                                </span>
                            )}
                            <h3 className="font-bold text-base lg:text-lg text-foreground truncate">{name}</h3>
                        </div>

                        {/* Inline metrics - clearer labels, larger font */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[15px] lg:text-base text-muted-foreground mt-1">
                            <span><strong className="text-foreground">{dealCount}</strong> vendas</span>
                            <span>Média/dia: <strong className="text-foreground">{formatShortCurrency(averagePerDay)}</strong></span>
                            <span>Meta/dia: <strong className="text-foreground">{formatShortCurrency(dailyGoal)}</strong></span>
                        </div>
                        <div className="flex gap-4 text-sm lg:text-[15px] text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                Conversão: <span className={financialConversionRate >= 100 ? 'text-emerald-500 font-semibold' : 'text-foreground'}>
                                    {Math.min(financialConversionRate, 999).toFixed(0)}%
                                </span>
                            </span>
                            <span className="flex items-center gap-1">
                                <ShoppingCart className="w-4 h-4 text-blue-500" />
                                Ticket: <strong className="text-foreground">{formatShortCurrency(averageTicket)}</strong>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* GAUGE SECTION - Prominent, fills available space */}
            <div className="flex-1 flex flex-col justify-end px-2 pb-0 lg:px-4">
                {/* Gauge container - full width */}
                <div className="relative w-full h-[160px] lg:h-[190px] xl:h-[220px] 2xl:h-[240px]">
                    {/* ECharts gauge arc */}
                    <div
                        ref={gaugeRef}
                        className="w-full h-full"
                    />

                    {/* Value displayed centered at bottom */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                        <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-emerald-500 leading-none">
                            {formatGaugeValue(totalValue)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
