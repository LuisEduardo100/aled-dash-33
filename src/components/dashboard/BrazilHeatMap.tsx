import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SegmentedLead } from '@/types/dashboard';
import { API_CONFIG } from '@/config/api';

// State Names Mapping
const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
  'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
  'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
  'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
  'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
  'SE': 'Sergipe', 'TO': 'Tocantins'
};

interface BrazilHeatMapProps {
  stateData: {
    leads: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>;
    converted: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>;
  };
  onStateClick?: (uf: string, leads: SegmentedLead[]) => void;
}

export function BrazilHeatMap({ stateData, onStateClick }: BrazilHeatMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [geoJson, setGeoJson] = useState<any>(null);
  const [metric, setMetric] = useState<'leads' | 'converted'>('converted');

  // Fetch GeoJSON from backend using API config base
  useEffect(() => {
    // Construct URL based on DASHBOARD_ENDPOINT
    // If DASHBOARD_ENDPOINT is http://localhost:3000/api/dashboard, we want http://localhost:3000/api/dashboard/geojson
    const baseUrl = API_CONFIG.DASHBOARD_ENDPOINT.replace(/\/api\/dashboard\/?$/, '');
    const url = `${baseUrl}/api/dashboard/geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => setGeoJson(data))
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  const mapData = useMemo(() => {
    const currentData = stateData[metric];
    return Object.entries(currentData).map(([uf, data]) => ({
      name: STATE_NAMES[uf] || uf,
      value: data.total,
      uf,
      sources: data.sources,
      leads: data.leads,
    }));
  }, [stateData, metric]);

  const maxValue = useMemo(() => {
    return Math.max(...mapData.map(d => d.value), 1);
  }, [mapData]);

  useEffect(() => {
    if (!chartRef.current || !geoJson) return;

    // Register map
    echarts.registerMap('Brazil', geoJson);

    // Initialize chart
    chartInstance.current = echarts.init(chartRef.current, 'dark');

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'hsl(var(--popover))',
        borderColor: 'hsl(var(--border))',
        textStyle: {
          color: 'hsl(var(--popover-foreground))',
        },
        formatter: (params: any) => {
          const data = params.data;
          if (!data || !data.value) {
            return `<strong>${params.name}</strong><br/>Sem leads convertidos`;
          }

          let tooltipContent = `<strong>${params.name}</strong><br/>${data.value} ${metric === 'converted' ? 'Leads Convertidos' : 'Leads'}<br/><br/>`;

          if (data.sources) {
            Object.entries(data.sources).forEach(([source, count]) => {
              tooltipContent += `${source}: ${count}<br/>`;
            });
          }

          return tooltipContent;
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['Alto', 'Baixo'],
        textStyle: {
          color: 'hsl(var(--muted-foreground))',
        },
        inRange: {
          color: [
            '#1a2e25', // Very dark green (almost black/slate) for 0/low
            '#2d4a3e',
            '#4a7a5e',
            '#6ee7b7', // Bright lime/mint green for high
          ],
        },
        calculable: true,
      },
      series: [
        {
          name: metric === 'converted' ? 'Leads Convertidos' : 'Total de Leads',
          type: 'map',
          map: 'Brazil',
          roam: true,
          emphasis: {
            label: {
              show: true,
              color: '#ffffff',
              fontWeight: 'bold',
            },
            itemStyle: {
              areaColor: '#10b981', // Emerald 500
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          },
          select: {
            label: {
              show: true,
              color: '#ffffff',
              fontWeight: 'bold',
            },
            itemStyle: {
              areaColor: '#059669', // Emerald 600
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          },
          itemStyle: {
            borderColor: '#1e293b', // Slate 800
            borderWidth: 1,
            areaColor: '#0f172a', // Slate 900 (Base dark color)
          },
          label: {
            show: true,
            color: '#e2e8f0', // Slate 200 (Bright grey/white)
            fontSize: 10,
            fontWeight: 500,
            textBorderColor: '#0f172a', // Dark outline for readability
            textBorderWidth: 2,
          },
          data: mapData.map(item => ({
            name: item.name,
            value: item.value,
            uf: item.uf,
            sources: item.sources,
            leads: item.leads,
          })),
        },
      ],
    };

    chartInstance.current.setOption(option);

    // Handle click events
    chartInstance.current.on('click', (params: any) => {
      if (params.data && onStateClick) {
        onStateClick(params.data.uf, params.data.leads || []);
      }
    });

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [mapData, onStateClick, geoJson, metric]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Distribuição Geográfica</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={metric === 'leads' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('leads')}
            >
              Todos Leads
            </Button>
            <Button
              variant={metric === 'converted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('converted')}
            >
              Convertidos
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-[600px]" />
      </CardContent>
    </Card>
  );
}
