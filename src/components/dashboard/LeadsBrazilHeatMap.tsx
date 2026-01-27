import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface LeadsBrazilHeatMapProps {
  stateData: Record<string, { total: number; sources: Record<string, number>; leads: SegmentedLead[] }>;
  onStateClick?: (uf: string, leads: SegmentedLead[]) => void;
}

export function LeadsBrazilHeatMap({ stateData, onStateClick }: LeadsBrazilHeatMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [geoJson, setGeoJson] = useState<any>(null);

  // Fetch GeoJSON from backend
  useEffect(() => {
    const baseUrl = API_CONFIG.DASHBOARD_ENDPOINT.replace(/\/api\/dashboard\/?$/, '');
    const url = `${baseUrl}/api/dashboard/geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => setGeoJson(data))
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  const mapData = useMemo(() => {
    return Object.entries(stateData).map(([uf, data]) => ({
      name: STATE_NAMES[uf] || uf,
      value: data.total,
      uf,
      sources: data.sources,
      leads: data.leads,
    }));
  }, [stateData]);

  const maxValue = useMemo(() => {
    return Math.max(...mapData.map(d => d.value), 1);
  }, [mapData]);

  useEffect(() => {
    if (!chartRef.current || !geoJson) return;

    echarts.registerMap('Brazil', geoJson);
    chartInstance.current = echarts.init(chartRef.current, 'dark');

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'hsl(var(--popover))',
        borderColor: 'hsl(var(--border))',
        textStyle: { color: 'hsl(var(--popover-foreground))' },
        formatter: (params: any) => {
          const data = params.data;
          if (!data || !data.value) {
            return `<strong>${params.name}</strong><br/>Sem leads`;
          }

          let content = `<strong>${params.name}</strong><br/>${data.value} Leads<br/><br/>`;
          if (data.sources) {
            Object.entries(data.sources).forEach(([source, count]) => {
              content += `${source}: ${count}<br/>`;
            });
          }
          return content;
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 'left',
        top: 'bottom',
        text: ['Alto', 'Baixo'],
        textStyle: { color: 'hsl(var(--muted-foreground))' },
        inRange: {
          color: ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa'],
        },
        calculable: true,
      },
      series: [
        {
          name: 'Leads',
          type: 'map',
          map: 'Brazil',
          roam: true,
          emphasis: {
            label: { show: true, color: '#ffffff', fontWeight: 'bold' },
            itemStyle: { areaColor: '#3b82f6', borderColor: '#ffffff', borderWidth: 2 },
          },
          select: {
            label: { show: true, color: '#ffffff', fontWeight: 'bold' },
            itemStyle: { areaColor: '#2563eb', borderColor: '#ffffff', borderWidth: 2 },
          },
          itemStyle: {
            borderColor: '#1e293b',
            borderWidth: 1,
            areaColor: '#0f172a',
          },
          label: {
            show: true,
            color: '#e2e8f0',
            fontSize: 10,
            fontWeight: 500,
            textBorderColor: '#0f172a',
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

    chartInstance.current.on('click', (params: any) => {
      if (params.data && onStateClick) {
        onStateClick(params.data.uf, params.data.leads || []);
      }
    });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [mapData, onStateClick, geoJson, maxValue]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Distribuição Geográfica - Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-[500px]" />
      </CardContent>
    </Card>
  );
}
