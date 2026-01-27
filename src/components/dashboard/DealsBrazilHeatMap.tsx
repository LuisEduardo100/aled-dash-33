import { useEffect, useRef, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SegmentedDeal } from '@/types/dashboard';
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

interface DealsBrazilHeatMapProps {
  deals: SegmentedDeal[];
  onStateClick?: (uf: string, deals: SegmentedDeal[]) => void;
}

export function DealsBrazilHeatMap({ deals, onStateClick }: DealsBrazilHeatMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [geoJson, setGeoJson] = useState<any>(null);

  // Fetch GeoJSON
  useEffect(() => {
    const baseUrl = API_CONFIG.DASHBOARD_ENDPOINT.replace(/\/api\/dashboard\/?$/, '');
    const url = `${baseUrl}/api/dashboard/geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => setGeoJson(data))
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);

  const mapData = useMemo(() => {
    const stateMap = new Map<string, { total: number; valor: number; deals: SegmentedDeal[] }>();

    deals.forEach(deal => {
      const uf = deal.uf || 'N/A';
      if (uf === 'N/A') return;

      if (!stateMap.has(uf)) {
        stateMap.set(uf, { total: 0, valor: 0, deals: [] });
      }
      const entry = stateMap.get(uf)!;
      entry.total++;
      entry.valor += deal.valor || 0;
      entry.deals.push(deal);
    });

    return Array.from(stateMap.entries()).map(([uf, data]) => ({
      name: STATE_NAMES[uf] || uf,
      value: data.valor,
      uf,
      total: data.total,
      deals: data.deals,
    }));
  }, [deals]);

  const maxValue = useMemo(() => {
    return Math.max(...mapData.map(d => d.value), 1);
  }, [mapData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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
            return `<strong>${params.name}</strong><br/>Sem negócios`;
          }
          return `<strong>${params.name}</strong><br/>
            ${data.total} Negócios<br/>
            ${formatCurrency(data.value)} em receita`;
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
          color: ['#1a2e25', '#2d4a3e', '#4a7a5e', '#6ee7b7'],
        },
        calculable: true,
      },
      series: [
        {
          name: 'Negócios',
          type: 'map',
          map: 'Brazil',
          roam: true,
          emphasis: {
            label: { show: true, color: '#ffffff', fontWeight: 'bold' },
            itemStyle: { areaColor: '#10b981', borderColor: '#ffffff', borderWidth: 2 },
          },
          select: {
            label: { show: true, color: '#ffffff', fontWeight: 'bold' },
            itemStyle: { areaColor: '#059669', borderColor: '#ffffff', borderWidth: 2 },
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
            total: item.total,
            deals: item.deals,
          })),
        },
      ],
    };

    chartInstance.current.setOption(option);

    chartInstance.current.on('click', (params: any) => {
      if (params.data && onStateClick) {
        onStateClick(params.data.uf, params.data.deals || []);
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
        <CardTitle className="text-lg">Distribuição Geográfica - Negócios</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-[500px]" />
      </CardContent>
    </Card>
  );
}
