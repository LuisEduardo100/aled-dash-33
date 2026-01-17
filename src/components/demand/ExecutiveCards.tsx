import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DemandMetrics } from '@/hooks/useDemandMetrics';
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Calendar, Gauge } from 'lucide-react';

interface ExecutiveCardsProps {
    metrics: DemandMetrics;
}

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(2).replace('.', ',')}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const ExecutiveCards: React.FC<ExecutiveCardsProps> = ({ metrics }) => {
    return (
        <div className="space-y-4">
            {/* Faturamento Row */}
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    FATURAMENTO (Ganhos)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Realizado</p>
                                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(metrics.faturamentoRealizado)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-emerald-500/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Meta</p>
                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.faturamentoMeta)}</p>
                                </div>
                                <Target className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">% Atingido</p>
                                    <p className="text-2xl font-bold text-foreground">{formatPercent(metrics.faturamentoProgress)}</p>
                                    <div className="w-full bg-secondary h-1.5 rounded-full mt-2">
                                        <div 
                                            className="h-full rounded-full bg-emerald-500 transition-all"
                                            style={{ width: `${Math.min(100, metrics.faturamentoProgress)}%` }}
                                        />
                                    </div>
                                </div>
                                <Gauge className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Meta Diária</p>
                                    <p className="text-2xl font-bold text-orange-400">
                                        {metrics.faturamentoDailyRequired > 0 
                                            ? formatCurrency(metrics.faturamentoDailyRequired) 
                                            : 'Meta Batida!'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metrics.daysRemaining} dias restantes
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-orange-500/30" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Oportunidades Row */}
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    OPORTUNIDADES (Pipeline)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Pipeline Total</p>
                                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(metrics.oportunidadesRealizado)}</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-blue-500/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Meta</p>
                                    <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.oportunidadesMeta)}</p>
                                </div>
                                <Target className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={`bg-card border-border ${metrics.oportunidadesPacing >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Pacing</p>
                                    <div className="flex items-center gap-2">
                                        {metrics.oportunidadesPacing >= 0 ? (
                                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                                        ) : (
                                            <TrendingDown className="h-5 w-5 text-red-400" />
                                        )}
                                        <p className={`text-2xl font-bold ${metrics.oportunidadesPacing >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {metrics.oportunidadesPacing >= 0 ? '+' : ''}{formatPercent(metrics.oportunidadesPacing)}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Dia {metrics.currentDay}/{metrics.daysInMonth} • Esperado: {formatPercent(metrics.expectedProgress)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Projeção</p>
                                    <p className={`text-2xl font-bold ${metrics.oportunidadesProjection >= metrics.oportunidadesMeta ? 'text-emerald-400' : 'text-orange-400'}`}>
                                        {formatCurrency(metrics.oportunidadesProjection)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {metrics.oportunidadesProjection >= metrics.oportunidadesMeta ? 'Meta será batida' : 'Abaixo da meta'}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
