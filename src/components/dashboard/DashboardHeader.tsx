import { useState } from 'react';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface DashboardHeaderProps {
  dateRange: { startDate: Date | null; endDate: Date | null };
  onDateRangeChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

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
];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y.toString(), label: y.toString() }));

export function DashboardHeader({ dateRange, onDateRangeChange, onRefresh, isLoading }: DashboardHeaderProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const handleMonthYearChange = (month: string, year: string) => {
    const date = new Date(parseInt(year), parseInt(month), 1);
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

  const handleQuickFilter = (months: number) => {
    const end = new Date();
    const start = subMonths(end, months);
    onDateRangeChange({ startDate: start, endDate: end });
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Dashboard de Vendas</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick filters */}
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleQuickFilter(0)}
            className="text-xs"
          >
            Hoje
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleQuickFilter(1)}
            className="text-xs"
          >
            30 dias
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleQuickFilter(3)}
            className="text-xs"
          >
            90 dias
          </Button>
        </div>

        {/* Month/Year selector */}
        <div className="flex gap-2">
          <Select 
            value={selectedMonth} 
            onValueChange={(v) => {
              setSelectedMonth(v);
              handleMonthYearChange(v, selectedYear);
            }}
          >
            <SelectTrigger className="w-[130px] bg-secondary">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={selectedYear} 
            onValueChange={(v) => {
              setSelectedYear(v);
              handleMonthYearChange(selectedMonth, v);
            }}
          >
            <SelectTrigger className="w-[100px] bg-secondary">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
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
            />
          </PopoverContent>
        </Popover>

        {/* Refresh button */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </header>
  );
}
