import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedDeal } from '@/types/dashboard';

interface DealLossReasonChartProps {
  data: { name: string; value: number }[];
  onReasonClick?: (reason: string) => void;
}

export function DealLossReasonChart({ data, onReasonClick }: DealLossReasonChartProps) {
  // Take only top 7 reasons
  const chartData = data.slice(0, 7);

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Motivos de Perda</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">Nenhum registro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Motivos de Perda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mt-2">
          {chartData.map((item) => {
            const maxValue = Math.max(...chartData.map(d => d.value));
            const percentage = (item.value / maxValue) * 100;

            return (
              <div
                key={item.name}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => onReasonClick?.(item.name)}
              >
                <span 
                  className="text-sm font-medium w-[140px] text-right truncate text-muted-foreground group-hover:text-foreground transition-colors" 
                  title={item.name}
                >
                  {item.name}
                </span>
                <div className="flex-1 h-8 bg-secondary/20 rounded-r-md relative flex items-center">
                  <div
                    className="h-full bg-destructive rounded-r-md transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                  />
                  <span className="ml-2 font-bold text-foreground">{item.value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
