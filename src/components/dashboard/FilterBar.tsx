import { useState, useEffect } from 'react';
import { Calendar, Filter, RefreshCw, MapPin, HelpCircle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateFilter } from '@/types/dashboard';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface FilterBarProps {
    dateFilter: DateFilter;
    onDateFilterChange: (filter: DateFilter) => void;
    sourceFilter: string;
    onSourceFilterChange: (source: string) => void;
    availableSources: string[];
    ufFilter: string;
    onUfFilterChange: (uf: string) => void;
    availableUfs: string[];
    regionalFilter?: string;
    onRegionalFilterChange?: (reg: string) => void;
    availableRegionals?: string[];
    funnelFilter?: string;
    onFunnelFilterChange?: (funnel: string) => void;
    availableFunnels?: string[];
    onRefresh: () => void;
    isLoading?: boolean;
    isSyncing?: boolean;
}

const REGIONAL_DESCRIPTIONS: Record<string, string> = {
    'Todos': 'Exibe todos os dados de todas as regionais',
    'Regional CE': 'Somente os dados do Ceará',
    'Regional PI': 'Somente os dados do Piauí',
    'Regional NE': 'Todos os estados do Nordeste exceto CE e PI',
    'Regional SP': 'Somente São Paulo',
    'Regional Brasil': 'Todo Brasil exceto Regional CE, PI, NE e SP',
    'Regional BR': 'Todo Brasil exceto Regional CE, PI, NE e SP',
};

type DatePreset = 'hoje' | 'ultimos7' | 'mesAtual' | 'custom';

export function FilterBar({
    dateFilter,
    onDateFilterChange,
    sourceFilter,
    onSourceFilterChange,
    availableSources,
    ufFilter,
    onUfFilterChange,
    availableUfs,
    regionalFilter,
    onRegionalFilterChange,
    availableRegionals,
    funnelFilter,
    onFunnelFilterChange,
    availableFunnels,
    onRefresh,
    isLoading = false,
    isSyncing = false,
}: FilterBarProps) {
    const [activePreset, setActivePreset] = useState<DatePreset>('mesAtual');
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [tempDate, setTempDate] = useState<DateRange | undefined>();

    useEffect(() => {
        if (showCustomPicker) {
            setTempDate(undefined);
        }
    }, [showCustomPicker]);

    const handlePresetClick = (preset: DatePreset) => {
        setActivePreset(preset);
        const now = new Date();

        switch (preset) {
            case 'hoje':
                onDateFilterChange({
                    startDate: startOfDay(now),
                    endDate: endOfDay(now),
                });
                break;
            case 'ultimos7':
                onDateFilterChange({
                    startDate: startOfDay(subDays(now, 6)),
                    endDate: endOfDay(now),
                });
                break;
            case 'mesAtual':
                onDateFilterChange({
                    startDate: startOfMonth(now),
                    endDate: endOfMonth(now),
                });
                break;
            case 'custom':
                setShowCustomPicker(true);
                break;
        }
    };

    const handleCustomDateSelect = (range: DateRange | undefined) => {
        setTempDate(range);
        if (range?.from && range?.to) {
            onDateFilterChange({
                startDate: startOfDay(range.from),
                endDate: endOfDay(range.to),
            });
            setShowCustomPicker(false);
        }
    };

    const getDateRangeLabel = () => {
        if (!dateFilter.startDate || !dateFilter.endDate) return 'Selecionar período';
        return `${format(dateFilter.startDate, 'dd/MM', { locale: ptBR })} - ${format(dateFilter.endDate, 'dd/MM', { locale: ptBR })}`;
    };

    return (
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-4 bg-card/60 backdrop-blur-sm border border-border/60 rounded-xl shadow-sm">
            {/* Date Filters Group */}
            <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/30">
                <Button
                    variant={activePreset === 'hoje' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handlePresetClick('hoje')}
                    className={cn("h-7 text-xs rounded-md transition-all", activePreset === 'hoje' && "shadow-sm")}
                >
                    Hoje
                </Button>
                <Button
                    variant={activePreset === 'ultimos7' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handlePresetClick('ultimos7')}
                    className={cn("h-7 text-xs rounded-md transition-all", activePreset === 'ultimos7' && "shadow-sm")}
                >
                    7 Dias
                </Button>
                <Button
                    variant={activePreset === 'mesAtual' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handlePresetClick('mesAtual')}
                    className={cn("h-7 text-xs rounded-md transition-all", activePreset === 'mesAtual' && "shadow-sm")}
                >
                    Mês Atual
                </Button>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
                    <PopoverTrigger asChild>
                        <Button
                            variant={activePreset === 'custom' ? 'secondary' : 'outline'}
                            size="sm"
                            onClick={() => {
                                setActivePreset('custom');
                                setShowCustomPicker(true);
                            }}
                            className={cn("h-7 text-xs rounded-md gap-2 border-dashed font-normal", activePreset === 'custom' && "border-solid bg-secondary")}
                        >
                            <Calendar className="h-3.5 w-3.5" />
                            {activePreset === 'custom' ? getDateRangeLabel() : 'Personalizado'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                            mode="range"
                            selected={tempDate}
                            onSelect={handleCustomDateSelect}
                            numberOfMonths={1}
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>
            </div>

            <div className="hidden lg:block w-px h-6 bg-border/50" />

            {/* Dropdown Filters Group */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Source Filter */}
                <div className="flex items-center gap-2">
                    <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
                        <SelectTrigger className="w-auto min-w-[140px] max-w-[200px] h-9 rounded-full bg-background border-border/60 hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground w-full min-w-0">
                                <Filter className="h-3.5 w-3.5 shrink-0" />
                                <span className="font-medium text-foreground truncate flex-1 text-left">{sourceFilter === 'Todos' ? 'Todas Fontes' : sourceFilter}</span>
                            </div>
                        </SelectTrigger>
                        <SelectContent align="start" className="rounded-xl">
                            {availableSources.map(source => (
                                <SelectItem key={source} value={source} className="text-sm">
                                    {source}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Funnel Filter */}
                {onFunnelFilterChange && availableFunnels && (
                    <div className="flex items-center gap-2">
                        <Select value={funnelFilter} onValueChange={onFunnelFilterChange}>
                            <SelectTrigger className="w-auto min-w-[140px] max-w-[220px] h-9 rounded-full bg-background border-border/60 hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground w-full min-w-0">
                                    <Layers className="h-3.5 w-3.5 shrink-0" />
                                    <span className="font-medium text-foreground truncate flex-1 text-left">{funnelFilter === 'Todos' ? 'Todos Funis' : funnelFilter}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent align="start" className="rounded-xl">
                                {availableFunnels.map(funnel => (
                                    <SelectItem key={funnel} value={funnel} className="text-sm">
                                        {funnel}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Regional Filter */}
                {onRegionalFilterChange && availableRegionals && (
                    <div className="flex items-center gap-2">
                        <Select value={regionalFilter} onValueChange={onRegionalFilterChange}>
                            <SelectTrigger className="w-auto min-w-[140px] max-w-[200px] h-9 rounded-full bg-background border-border/60 hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground w-full min-w-0">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="font-medium text-foreground truncate flex-1 text-left">{regionalFilter === 'Todos' ? 'Todas Regionais' : regionalFilter}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent align="start" className="rounded-xl">
                                {availableRegionals.map(reg => (
                                    <SelectItem key={reg} value={reg} className="text-sm">
                                        <div className="flex items-center justify-between w-full gap-2">
                                            <span>{reg}</span>
                                            {REGIONAL_DESCRIPTIONS[reg] && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 hover:text-muted-foreground cursor-help shrink-0" />
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="max-w-[200px]">
                                                        <p className="text-xs">{REGIONAL_DESCRIPTIONS[reg]}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* UF Filter - Only if Regional is specific or needed */}
                {ufFilter && onUfFilterChange && availableUfs && (
                    <div className="flex items-center gap-2">
                        <Select value={ufFilter} onValueChange={onUfFilterChange}>
                            <SelectTrigger className="w-[100px] h-9 rounded-full bg-background border-border/60 hover:bg-accent/50 focus:ring-0 focus:ring-offset-0 text-sm">
                                <span className="font-medium text-foreground truncate">{ufFilter === 'Todos' ? 'Todas UFs' : ufFilter}</span>
                            </SelectTrigger>
                            <SelectContent align="start" className="rounded-xl">
                                {availableUfs.map(uf => (
                                    <SelectItem key={uf} value={uf} className="text-sm">
                                        {uf}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2 pl-4 border-l border-border/50">
                <div className="bg-muted/30 px-3 py-1.5 rounded-md border border-border/30 text-xs font-medium text-muted-foreground hidden xl:block">
                    {activePreset === 'custom' ? getDateRangeLabel() : activePreset === 'mesAtual' ? 'Este Mês' : activePreset === 'ultimos7' ? 'Últimos 7 dias' : 'Hoje'}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading || isSyncing}
                    className="h-9 w-9 p-0 rounded-full hover:bg-muted"
                >
                    <RefreshCw className={cn("h-4 w-4 text-muted-foreground", (isLoading || isSyncing) && "animate-spin text-primary")} />
                </Button>
            </div>
        </div>
    );
}
