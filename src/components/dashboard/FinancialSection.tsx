import { DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CRMDeal } from '@/types/crm';
import { cn } from '@/lib/utils';

interface FinancialSectionProps {
  wonDeals: CRMDeal[];
  lostDeals: CRMDeal[];
  pipelineDeals: CRMDeal[];
  totalWonValue: number;
  totalLostValue: number;
  totalPipelineValue: number;
  averageTicket: number;
  onCardClick: (title: string, deals: CRMDeal[]) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function FinancialSection({
  wonDeals,
  lostDeals,
  pipelineDeals,
  totalWonValue,
  totalLostValue,
  totalPipelineValue,
  averageTicket,
  onCardClick,
}: FinancialSectionProps) {
  const financialCards = [
    {
      title: 'Ganhos',
      value: totalWonValue,
      count: wonDeals.length,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: 'success' as const,
      deals: wonDeals,
    },
    {
      title: 'Pipeline',
      value: totalPipelineValue,
      count: pipelineDeals.length,
      icon: <Target className="h-5 w-5" />,
      variant: 'warning' as const,
      deals: pipelineDeals,
    },
    {
      title: 'Perdidos',
      value: totalLostValue,
      count: lostDeals.length,
      icon: <TrendingDown className="h-5 w-5" />,
      variant: 'destructive' as const,
      deals: lostDeals,
    },
    {
      title: 'Ticket Médio',
      value: averageTicket,
      count: null,
      icon: <DollarSign className="h-5 w-5" />,
      variant: 'info' as const,
      deals: wonDeals,
    },
  ];

  const variantStyles = {
    success: 'border-primary/50 bg-primary/5',
    warning: 'border-warning/50 bg-warning/5',
    destructive: 'border-destructive/50 bg-destructive/5',
    info: 'border-info/50 bg-info/5',
  };

  const iconStyles = {
    success: 'bg-primary/20 text-primary',
    warning: 'bg-warning/20 text-warning',
    destructive: 'bg-destructive/20 text-destructive',
    info: 'bg-info/20 text-info',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Indicadores Financeiros</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {financialCards.map((card) => (
          <Card
            key={card.title}
            className={cn(
              'transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg',
              variantStyles[card.variant]
            )}
            onClick={() => onCardClick(card.title, card.deals)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <div className="space-y-1">
                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(card.value)}
                    </span>
                    {card.count !== null && (
                      <p className="text-xs text-muted-foreground">
                        {card.count} {card.count === 1 ? 'negócio' : 'negócios'}
                      </p>
                    )}
                  </div>
                </div>
                <div className={cn('p-3 rounded-lg', iconStyles[card.variant])}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
