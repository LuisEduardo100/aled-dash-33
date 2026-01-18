import { useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface GoalComparisonChartProps {
  data: {
    name: string;
    revenue: number;
    opportunities: number;
    revenueTarget: number;
    oppsTarget: number;
  }[];
}

export function GoalComparisonChart({ data }: GoalComparisonChartProps) {
  const [viewMode, setViewMode] = useState<'opportunities' | 'revenue'>('opportunities');

  const chartData = data.map(item => ({
    name: item.name,
    actual: viewMode === 'opportunities' ? item.opportunities : item.revenue,
    target: viewMode === 'opportunities' ? item.oppsTarget : item.revenueTarget,
  }));

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatValue = (value: number) => 
    viewMode === 'revenue' ? formatCurrency(value) : formatCurrency(value); 

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-normal">
          Meta vs Realizado por Canal e Novos Clientes
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Label htmlFor="view-mode" className="text-sm text-muted-foreground">
            {viewMode === 'opportunities' ? 'Oportunidades' : 'Faturamento'}
          </Label>
          <Switch
            id="view-mode"
            checked={viewMode === 'revenue'}
            onCheckedChange={(checked) => setViewMode(checked ? 'revenue' : 'opportunities')}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                stroke="#888"
                fontSize={12}
                interval={0} // Show all labels
              />
              <YAxis 
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} 
                tickLine={false}
                axisLine={false}
                stroke="#888"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  formatValue(value),
                  name === 'actual' ? 'Realizado' : 'Meta'
                ]}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend verticalAlign="top" height={36} />
              
              <Bar 
                dataKey="actual" 
                name="Realizado" 
                fill="#22c55e" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
                label={{ 
                    position: 'top', 
                    fill: '#fff', 
                    fontSize: 10,
                    formatter: (val: number) => `R$${(val/1000).toFixed(0)}k`
                }}
              />

              <Line 
                type="monotone" 
                dataKey="target" 
                name="Meta" 
                stroke="#eab308" 
                strokeWidth={2}
                dot={{ r: 6, fill: '#eab308', strokeWidth: 2, stroke: '#1f2937' }} 
                connectNulls 
                strokeDasharray="5 5" 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
