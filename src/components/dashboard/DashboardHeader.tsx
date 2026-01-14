import { useState } from 'react';
import { Calendar, ChevronDown, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { ALL_SOURCES } from '@/types/crm';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  dateRange: { startDate: Date | null; endDate: Date | null };
  onDateRangeChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  onRefresh: () => void;
  isLoading: boolean;
  sourceFilter: string;
  onSourceFilterChange: (source: string) => void;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

const months = [
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
].filter(m => parseInt(m.value) <= currentMonth);

export function DashboardHeader({ 
  dateRange, 
  onDateRangeChange, 
  onRefresh, 
  isLoading,
  sourceFilter,
  onSourceFilterChange,
}: DashboardHeaderProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.toString());

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    const date = new Date(currentYear, parseInt(month), 1);
    onDateRangeChange({
      startDate: startOfMonth(date),
      endDate: endOfMonth(date)
    });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range) {
      onDateRangeChange({
        startDate: range.from || null,
        endDate: range.to || null
      });
    }
  };

  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return 'Selecione um período';
    return `${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')}`;
  };

  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = days === 0 ? new Date() : subDays(end, days);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    onDateRangeChange({ startDate: start, endDate: end });
  };

  const quickFilters = [
    { label: 'Hoje', days: 0 },
    { label: '4 dias', days: 4 },
    { label: '10 dias', days: 10 },
    { label: '15 dias', days: 15 },
    { label: '20 dias', days: 20 },
    { label: '25 dias', days: 25 },
  ];

  return (
    <header className="border-b border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Dashboard de Vendas</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick filters */}
          <div className="flex gap-1 flex-wrap">
            {quickFilters.map((filter) => (
              <Button 
                key={filter.label}
                variant="ghost" 
                size="sm" 
                onClick={() => handleQuickFilter(filter.days)}
                className="text-xs h-8"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Month selector (current year only) */}
          <Select value={selectedMonth} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[120px] bg-secondary h-9">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 h-9">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formatDateRange()}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={{
                  from: dateRange.startDate || undefined,
                  to: dateRange.endDate || undefined
                }}
                onSelect={handleDateRangeSelect}
                locale={ptBR}
                numberOfMonths={2}
                disabled={(date) => date > new Date() || date.getFullYear() < currentYear}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          {/* Source filter */}
          <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
            <SelectTrigger className="w-[160px] bg-secondary h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              {ALL_SOURCES.map(source => (
                <SelectItem key={source} value={source}>{source}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh button */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </header>
  );
}
