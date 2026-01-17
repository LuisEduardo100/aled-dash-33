import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { DemandGoals, ChannelGoals } from '@/hooks/useDemandGoals';

interface GoalsConfigSheetProps {
    goals: DemandGoals;
    onSave: (goals: DemandGoals) => void;
    onReset: () => void;
}

const formatCurrencyInput = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
};

const parseCurrencyInput = (value: string): number => {
    return parseInt(value.replace(/\D/g, ''), 10) || 0;
};

const channelLabels: Record<keyof ChannelGoals, string> = {
    google: 'Google Ads',
    meta: 'Meta Ads',
    indicacaoAmigo: 'Indicação Amigo',
    indicacaoProfissional: 'Indicação Profissional',
    ltv: 'LTV / Recompra',
    outros: 'Outros',
};

export const GoalsConfigSheet: React.FC<GoalsConfigSheetProps> = ({ goals, onSave, onReset }) => {
    const [localGoals, setLocalGoals] = React.useState<DemandGoals>(goals);
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        setLocalGoals(goals);
    }, [goals]);

    const updateFaturamento = (key: keyof ChannelGoals, value: string) => {
        setLocalGoals(prev => ({
            ...prev,
            faturamento: { ...prev.faturamento, [key]: parseCurrencyInput(value) }
        }));
    };

    const updateOportunidades = (key: keyof ChannelGoals, value: string) => {
        setLocalGoals(prev => ({
            ...prev,
            oportunidades: { ...prev.oportunidades, [key]: parseCurrencyInput(value) }
        }));
    };

    const updateConversionRate = (value: string) => {
        const rate = parseFloat(value.replace(',', '.')) || 0;
        setLocalGoals(prev => ({
            ...prev,
            conversionRate: Math.min(100, Math.max(0, rate))
        }));
    };

    const handleSave = () => {
        onSave(localGoals);
        setOpen(false);
    };

    const handleReset = () => {
        onReset();
        setOpen(false);
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Configurar Metas
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[500px] sm:max-w-[540px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>⚙️ Configurar Metas</SheetTitle>
                    <SheetDescription>
                        Configure as metas mensais de Faturamento e Oportunidades por canal.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Conversion Rate Section */}
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold text-orange-400 flex items-center gap-2">
                            📈 Taxa de Conversão
                            <span className="text-xs font-normal text-muted-foreground">(Oportunidades → Faturamento)</span>
                        </h3>
                        <div className="flex items-center gap-3">
                            <Label className="w-40 text-sm">Taxa de Conversão</Label>
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    className="pr-8"
                                    value={localGoals.conversionRate}
                                    onChange={(e) => updateConversionRate(e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Percentual esperado de conversão de oportunidades (pipeline) em faturamento (ganhos).
                        </p>
                    </div>

                    {/* Faturamento Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                            💰 Metas de Faturamento
                            <span className="text-xs font-normal text-muted-foreground">(Negócios Ganhos)</span>
                        </h3>
                        <div className="grid gap-3">
                            {(Object.keys(channelLabels) as (keyof ChannelGoals)[]).map(key => (
                                <div key={`fat-${key}`} className="flex items-center gap-3">
                                    <Label className="w-40 text-sm">{channelLabels[key]}</Label>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                        <Input
                                            className="pl-10"
                                            value={formatCurrencyInput(localGoals.faturamento[key])}
                                            onChange={(e) => updateFaturamento(key, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Oportunidades Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                            📊 Metas de Oportunidades
                            <span className="text-xs font-normal text-muted-foreground">(Pipeline Total)</span>
                        </h3>
                        <div className="grid gap-3">
                            {(Object.keys(channelLabels) as (keyof ChannelGoals)[]).map(key => (
                                <div key={`opp-${key}`} className="flex items-center gap-3">
                                    <Label className="w-40 text-sm">{channelLabels[key]}</Label>
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                        <Input
                                            className="pl-10"
                                            value={formatCurrencyInput(localGoals.oportunidades[key])}
                                            onChange={(e) => updateOportunidades(key, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleSave} className="flex-1">
                            Salvar Metas
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Restaurar Padrão
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

