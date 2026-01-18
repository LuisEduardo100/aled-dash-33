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
    novosLeads: 'Novos Leads/Clientes',
};

export const GoalsConfigSheet: React.FC<GoalsConfigSheetProps> = ({ goals, onSave, onReset }) => {
    const [localGoals, setLocalGoals] = React.useState<DemandGoals>(goals);
    const [open, setOpen] = React.useState(false);
    
    // Separate state for Global Totals to avoid rounding glitches in the Input
    const [globalRevenue, setGlobalRevenue] = React.useState(0);
    const [globalOpps, setGlobalOpps] = React.useState(0);

    // Initialize/Sync state when goals prop changes or dialog opens
    React.useEffect(() => {
        setLocalGoals(goals);
        const totalRev = (goals.faturamento.ltv || 0) + (goals.faturamento.novosLeads || 0);
        const totalOpp = (goals.oportunidades.ltv || 0) + (goals.oportunidades.novosLeads || 0);
        setGlobalRevenue(totalRev);
        setGlobalOpps(totalOpp);
    }, [goals, open]);

    const handleGlobalRevenueChange = (value: string) => {
        const val = parseCurrencyInput(value);
        setGlobalRevenue(val);
        
        // Calculate breakdown (30/70) ensuring precise sum
        const ltv = Math.round(val * 0.3);
        const novosLeads = val - ltv; // Remainder ensures sum matches exactly

        setLocalGoals(prev => ({
            ...prev,
            faturamento: {
                ...prev.faturamento,
                ltv,
                novosLeads
            }
        }));
    };

    const handleGlobalOppsChange = (value: string) => {
        const val = parseCurrencyInput(value);
        setGlobalOpps(val);

        const ltv = Math.round(val * 0.3);
        const novosLeads = val - ltv;

        setLocalGoals(prev => ({
            ...prev,
            oportunidades: {
                ...prev.oportunidades,
                ltv,
                novosLeads
            }
        }));
    };

    // Removed manual updateFaturamento for channels as it is now auto-calculated

    const updateOportunidades = (key: keyof ChannelGoals, value: string) => {
        const newVal = parseCurrencyInput(value);
        
        // Validation: Sum of channels cannot exceed "Novos Clientes" total
        // Define manual channels
        const manualChannels: (keyof ChannelGoals)[] = ['google', 'meta', 'indicacaoAmigo', 'indicacaoProfissional'];
        
        // Calculate current sum of OTHER channels
        const otherChannelsSum = manualChannels
            .filter(k => k !== key)
            .reduce((acc, k) => acc + (localGoals.oportunidades[k] || 0), 0);
            
        const limit = localGoals.oportunidades.novosLeads;
        
        if (newVal + otherChannelsSum > limit) {
             // Prevent update if exceeds limit (or clamp? User said "não deve ser permitido")
             // We'll just return for now, effectively blocking the input
             // Optionally could start showing an error state, but blocking is safest for strict requirement
             return; 
        }

        // Auto-calculate Revenue Goal based on Conversion Rate
        const rate = localGoals.conversionRate;
        const newRevenueGoal = Math.round(newVal * (rate / 100));

        setLocalGoals(prev => ({
            ...prev,
            oportunidades: { ...prev.oportunidades, [key]: newVal },
            faturamento: { ...prev.faturamento, [key]: newRevenueGoal }
        }));
    };

    const updateConversionRate = (value: string) => {
        const rate = parseFloat(value.replace(',', '.')) || 0;
        const safeRate = Math.min(100, Math.max(0, rate));
        
        // Recalculate ALL channel revenue goals based on new rate
        const manualChannels: (keyof ChannelGoals)[] = ['google', 'meta', 'indicacaoAmigo', 'indicacaoProfissional'];
        
        setLocalGoals(prev => {
            const updatedFaturamento = { ...prev.faturamento };
            manualChannels.forEach(k => {
                const opp = prev.oportunidades[k] || 0;
                updatedFaturamento[k] = Math.round(opp * (safeRate / 100));
            });
            
            return {
                ...prev,
                conversionRate: safeRate,
                faturamento: updatedFaturamento
            };
        });
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
            <SheetContent className="w-[600px] sm:max-w-[640px] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>⚙️ Configurar Metas Globais</SheetTitle>
                    <SheetDescription>
                        Defina as metas globais e a distribuição entre LTV e Novos Clientes.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-8">
                    {/* Global Totals Section */}
                    <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            🌐 Metas Totais da Empresa
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Faturamento Total (R$)</Label>
                                <Input 
                                    value={formatCurrencyInput(globalRevenue)}
                                    onChange={(e) => handleGlobalRevenueChange(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Oportunidades Totais (R$)</Label>
                                <Input 
                                    value={formatCurrencyInput(globalOpps)}
                                    onChange={(e) => handleGlobalOppsChange(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Calculated Segments */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-md text-muted-foreground uppercase tracking-wider text-xs">
                            Distribuição Automática
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-secondary/30 rounded-lg border">
                                <div className="text-sm font-medium text-muted-foreground mb-1">LTV / Recompra (30%)</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Fat.</span>
                                        <span className="font-mono">{formatCurrencyInput(localGoals.faturamento.ltv)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Opp.</span>
                                        <span className="font-mono">{formatCurrencyInput(localGoals.oportunidades.ltv)}</span>
                                    </div>
                                </div>
                            </div>
                             <div className="p-3 bg-secondary/30 rounded-lg border">
                                <div className="text-sm font-medium text-emerald-500 mb-1">Novos Clientes (70%)</div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Fat.</span>
                                        <span className="font-mono">{formatCurrencyInput(localGoals.faturamento.novosLeads)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Opp.</span>
                                        <span className="font-mono">{formatCurrencyInput(localGoals.oportunidades.novosLeads)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manual Channel Breakdown */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-md flex items-center justify-between">
                            <span>📍 Metas por Canal de Aquisição</span>
                            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded">
                                Soma sugerida: {formatCurrencyInput(localGoals.oportunidades.novosLeads)} (Opp)
                            </span>
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Defina manualmente a meta de cada canal. A soma destes canais representa a composição da meta de "Novos Clientes".
                        </p>
                        
                        <div className="space-y-4">
                            {/* Headers */}
                            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium mb-2 px-1">
                                <div className="col-span-4">Canal</div>
                                <div className="col-span-4">Meta Faturamento</div>
                                <div className="col-span-4">Meta Oportunidades</div>
                            </div>

                            {/* Lines */}
                            {(['google', 'meta', 'indicacaoAmigo', 'indicacaoProfissional'] as (keyof ChannelGoals)[]).map(key => (
                                <div key={key} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-4 text-sm font-medium">
                                        {channelLabels[key]}
                                    </div>
                                    <div className="col-span-4 relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                                        <Input
                                            className="pl-7 h-8 text-sm bg-muted text-muted-foreground"
                                            value={formatCurrencyInput(localGoals.faturamento[key])}
                                            readOnly 
                                            // No onChange, auto-calculated
                                            title="Calculado automaticamente pela Taxa de Conversão"
                                        />
                                    </div>
                                    <div className="col-span-4 relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
                                        <Input
                                            className="pl-7 h-8 text-sm"
                                            value={formatCurrencyInput(localGoals.oportunidades[key])}
                                            onChange={(e) => updateOportunidades(key, e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Conversion Rate */}
                     <div className="pt-4 border-t flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">Taxa de Conversão Global (Opp → Fat)</Label>
                        <div className="relative w-24">
                            <Input
                                type="number"
                                className="h-8 pr-6 text-right"
                                value={localGoals.conversionRate}
                                onChange={(e) => updateConversionRate(e.target.value)}
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button onClick={handleSave} className="w-full">
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

