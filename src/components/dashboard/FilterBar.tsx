import { useState } from 'react';
import { Calendar, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateFilter } from '@/types/dashboard';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FilterBarProps {
    dateFilter: DateFilter;
    onDateFilterChange: (filter: DateFilter) => void;
    sourceFilter: string;
    onSourceFilterChange: (source: string) => void;
    availableSources: string[];
    onRefresh: () => void;
    isLoading?: boolean;
}

type DatePreset = 'hoje' | 'ultimos7' | 'mesAtual' | 'custom';

export function FilterBar({
    dateFilter,
    onDateFilterChange,
    sourceFilter,
    onSourceFilterChange,
    availableSources,
    onRefresh,
    isLoading = false,
}: FilterBarProps) {
    const [activePreset, setActivePreset] = useState<DatePreset>('mesAtual');
    const [showCustomPicker, setShowCustomPicker] = useState(false);

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

    const handleCustomDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
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
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
            {/* Date Preset Buttons */}
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex gap-1">
                    <Button
                        variant={activePreset === 'hoje' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePresetClick('hoje')}
                    >
                        Hoje
                    </Button>
                    <Button
                        variant={activePreset === 'ultimos7' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePresetClick('ultimos7')}
                    >
                        Últimos 7 dias
                    </Button>
                    <Button
                        variant={activePreset === 'mesAtual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePresetClick('mesAtual')}
                    >
                        Mês Atual
                    </Button>
                    <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={activePreset === 'custom' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    setActivePreset('custom');
                                    setShowCustomPicker(true);
                                }}
                            >
                                {activePreset === 'custom' ? getDateRangeLabel() : 'Personalizado'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                mode="range"
                                selected={{
                                    from: dateFilter.startDate || undefined,
                                    to: dateFilter.endDate || undefined,
                                }}
                                onSelect={handleCustomDateSelect}
                                numberOfMonths={2}
                                locale={ptBR}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border" />

            {/* Source Filter */}
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por fonte" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableSources.map(source => (
                            <SelectItem key={source} value={source}>
                                {source}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Refresh Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="gap-2"
            >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
            </Button>

            {/* Current Filter Display */}
            <div className="text-sm text-muted-foreground">
                {getDateRangeLabel()}
                {sourceFilter !== 'Todos' && ` • ${sourceFilter}`}
            </div>
        </div>
    );
}

export default FilterBar;
