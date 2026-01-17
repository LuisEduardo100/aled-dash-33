import React from 'react';
import ReactECharts from 'echarts-for-react';
import { DemandMetrics } from '@/hooks/useDemandMetrics';

import { useIsMobile } from '@/hooks/use-mobile';

interface ChannelShareChartProps {
    metrics: DemandMetrics;
}

const CHANNEL_COLORS: Record<string, string> = {
    'Google Ads': '#4285F4',
    'Meta Ads': '#E1306C',
    'Indicação Amigo': '#10b981',
    'Indicação Profissional': '#f59e0b',
    'LTV / Recompra': '#8b5cf6',
};

export const ChannelShareChart: React.FC<ChannelShareChartProps> = ({ metrics }) => {
    const isMobile = useIsMobile();
    
    const data = metrics.channelMetrics
        .filter(c => c.oportunidadesRealizado > 0 && c.channel.toLowerCase() !== 'outros')
        .map(c => ({
            name: c.channel,
            value: c.oportunidadesRealizado,
            itemStyle: { color: CHANNEL_COLORS[c.channel] || '#6b7280' }
        }));

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            borderColor: '#374151',
            textStyle: { color: '#f3f4f6' },
            formatter: (params: any) => {
                const value = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact'
                }).format(params.value);
                return `<strong>${params.name}</strong>: ${value} (${params.percent.toFixed(1)}%)`;
            }
        },
        legend: {
            show: isMobile, // Show legend only on mobile
            bottom: 0,
            left: 'center',
            type: 'scroll',
            textStyle: { color: '#94a3b8' }
        },
        series: [
            {
                name: 'Share por Canal',
                type: 'pie',
                radius: isMobile ? ['40%', '60%'] : ['60%', '80%'], // Smaller radius on mobile to fit legend
                center: isMobile ? ['50%', '40%'] : ['50%', '55%'], // Move up on mobile
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 6,
                    borderColor: '#0f172a',
                    borderWidth: 2
                },
                label: {
                    show: !isMobile, // Hide labels on mobile to prevent overlap
                    position: 'outside',
                    color: '#94a3b8',
                    formatter: '{b}\n{d}%'
                },
                labelLine: {
                    show: !isMobile,
                    length: 15,
                    length2: 10
                },
                data: data
            }
        ]
    };

    return (
        <div className="bg-card rounded-xl border border-border p-4 h-full flex flex-col">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Share de Receita por Canal
            </h4>
            <div className="flex-1 min-h-[300px]">
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'svg' }}
                />
            </div>
        </div>
    );
};
