import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DemandMetrics, ChannelMetrics } from '@/hooks/useDemandMetrics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChannelPerformanceTableProps {
    metrics: DemandMetrics;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);
};

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
    switch (trend) {
        case 'up':
            return <TrendingUp className="h-4 w-4 text-emerald-400" />;
        case 'down':
            return <TrendingDown className="h-4 w-4 text-red-400" />;
        default:
            return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
};

const ProgressBar = ({ percent }: { percent: number }) => {
    const clampedPercent = Math.min(100, Math.max(0, percent));
    const colorClass = 
        percent >= 80 ? 'bg-emerald-500' :
        percent >= 50 ? 'bg-blue-500' :
        percent >= 30 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full ${colorClass} transition-all`}
                    style={{ width: `${clampedPercent}%` }}
                />
            </div>
            <span className="text-xs font-medium w-12 text-right">{percent.toFixed(1)}%</span>
        </div>
    );
};

export const ChannelPerformanceTable: React.FC<ChannelPerformanceTableProps> = ({ metrics }) => {
    // Calculate totals
    const totalFaturamentoMeta = metrics.channelMetrics.reduce((s, c) => s + c.faturamentoMeta, 0);
    const totalFaturamentoRealizado = metrics.channelMetrics.reduce((s, c) => s + c.faturamentoRealizado, 0);
    const totalOportunidadesMeta = metrics.channelMetrics.reduce((s, c) => s + c.oportunidadesMeta, 0);
    const totalOportunidadesRealizado = metrics.channelMetrics.reduce((s, c) => s + c.oportunidadesRealizado, 0);
    const totalPercent = totalOportunidadesMeta > 0 ? (totalOportunidadesRealizado / totalOportunidadesMeta) * 100 : 0;
    const totalGap = totalOportunidadesMeta - totalOportunidadesRealizado;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
                <h4 className="text-sm font-medium text-muted-foreground">
                    📊 Performance por Canal
                </h4>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="font-semibold">Canal</TableHead>
                            <TableHead className="text-right font-semibold text-emerald-400">Meta Fat.</TableHead>
                            <TableHead className="text-right font-semibold text-emerald-400">Fat. Real.</TableHead>
                            <TableHead className="text-right font-semibold text-blue-400">Meta Opp.</TableHead>
                            <TableHead className="text-right font-semibold text-blue-400">Opp. Real.</TableHead>
                            <TableHead className="font-semibold">% Atingido</TableHead>
                            <TableHead className="text-right font-semibold">Gap</TableHead>
                            <TableHead className="text-center font-semibold">Trend</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {metrics.channelMetrics
                            .filter(channel => channel.channel.toLowerCase() !== 'outros')
                            .map(channel => (
                            <TableRow key={channel.channelKey} className="hover:bg-muted/20">
                                <TableCell className="font-medium">{channel.channel}</TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {formatCurrency(channel.faturamentoMeta)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-emerald-400">
                                    {formatCurrency(channel.faturamentoRealizado)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {formatCurrency(channel.oportunidadesMeta)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-blue-400">
                                    {formatCurrency(channel.oportunidadesRealizado)}
                                </TableCell>
                                <TableCell>
                                    <ProgressBar percent={channel.percentAtingido} />
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                    {channel.gap > 0 ? formatCurrency(channel.gap) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <TrendIcon trend={channel.trend} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/50 font-semibold border-t-2">
                            <TableCell className="font-bold">TOTAL</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalFaturamentoMeta)}</TableCell>
                            <TableCell className="text-right text-emerald-400">{formatCurrency(totalFaturamentoRealizado)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalOportunidadesMeta)}</TableCell>
                            <TableCell className="text-right text-blue-400">{formatCurrency(totalOportunidadesRealizado)}</TableCell>
                            <TableCell>
                                <ProgressBar percent={totalPercent} />
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(totalGap)}</TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
