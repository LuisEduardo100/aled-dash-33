import { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CRMLead, STATE_NAMES } from '@/types/crm';

// Brazil GeoJSON (simplified coordinates for each state)
const brazilGeoJson = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'Acre', sigla: 'AC' }, geometry: { type: 'Polygon', coordinates: [[[-70.5, -8], [-67, -8], [-67, -11], [-70.5, -11], [-70.5, -8]]] } },
    { type: 'Feature', properties: { name: 'Alagoas', sigla: 'AL' }, geometry: { type: 'Polygon', coordinates: [[[-36, -9], [-35, -9], [-35, -10.5], [-36, -10.5], [-36, -9]]] } },
    { type: 'Feature', properties: { name: 'Amapá', sigla: 'AP' }, geometry: { type: 'Polygon', coordinates: [[[-52, 2], [-50, 2], [-50, -1], [-52, -1], [-52, 2]]] } },
    { type: 'Feature', properties: { name: 'Amazonas', sigla: 'AM' }, geometry: { type: 'Polygon', coordinates: [[[-73, 2], [-60, 2], [-60, -8], [-73, -8], [-73, 2]]] } },
    { type: 'Feature', properties: { name: 'Bahia', sigla: 'BA' }, geometry: { type: 'Polygon', coordinates: [[[-46, -9], [-38, -9], [-38, -18], [-46, -18], [-46, -9]]] } },
    { type: 'Feature', properties: { name: 'Ceará', sigla: 'CE' }, geometry: { type: 'Polygon', coordinates: [[[-41, -3], [-37, -3], [-37, -8], [-41, -8], [-41, -3]]] } },
    { type: 'Feature', properties: { name: 'Distrito Federal', sigla: 'DF' }, geometry: { type: 'Polygon', coordinates: [[[-48.5, -15], [-47, -15], [-47, -16.5], [-48.5, -16.5], [-48.5, -15]]] } },
    { type: 'Feature', properties: { name: 'Espírito Santo', sigla: 'ES' }, geometry: { type: 'Polygon', coordinates: [[[-41, -18], [-39.5, -18], [-39.5, -21.5], [-41, -21.5], [-41, -18]]] } },
    { type: 'Feature', properties: { name: 'Goiás', sigla: 'GO' }, geometry: { type: 'Polygon', coordinates: [[[-52, -13], [-46, -13], [-46, -19], [-52, -19], [-52, -13]]] } },
    { type: 'Feature', properties: { name: 'Maranhão', sigla: 'MA' }, geometry: { type: 'Polygon', coordinates: [[[-48, -1], [-42, -1], [-42, -10], [-48, -10], [-48, -1]]] } },
    { type: 'Feature', properties: { name: 'Mato Grosso', sigla: 'MT' }, geometry: { type: 'Polygon', coordinates: [[[-61, -7], [-51, -7], [-51, -18], [-61, -18], [-61, -7]]] } },
    { type: 'Feature', properties: { name: 'Mato Grosso do Sul', sigla: 'MS' }, geometry: { type: 'Polygon', coordinates: [[[-58, -18], [-53, -18], [-53, -24], [-58, -24], [-58, -18]]] } },
    { type: 'Feature', properties: { name: 'Minas Gerais', sigla: 'MG' }, geometry: { type: 'Polygon', coordinates: [[[-51, -14], [-40, -14], [-40, -23], [-51, -23], [-51, -14]]] } },
    { type: 'Feature', properties: { name: 'Pará', sigla: 'PA' }, geometry: { type: 'Polygon', coordinates: [[[-58, 2], [-47, 2], [-47, -9], [-58, -9], [-58, 2]]] } },
    { type: 'Feature', properties: { name: 'Paraíba', sigla: 'PB' }, geometry: { type: 'Polygon', coordinates: [[[-38.5, -6], [-35, -6], [-35, -8], [-38.5, -8], [-38.5, -6]]] } },
    { type: 'Feature', properties: { name: 'Paraná', sigla: 'PR' }, geometry: { type: 'Polygon', coordinates: [[[-54.5, -22.5], [-48, -22.5], [-48, -26.5], [-54.5, -26.5], [-54.5, -22.5]]] } },
    { type: 'Feature', properties: { name: 'Pernambuco', sigla: 'PE' }, geometry: { type: 'Polygon', coordinates: [[[-41, -7], [-35, -7], [-35, -9.5], [-41, -9.5], [-41, -7]]] } },
    { type: 'Feature', properties: { name: 'Piauí', sigla: 'PI' }, geometry: { type: 'Polygon', coordinates: [[[-46, -3], [-41, -3], [-41, -11], [-46, -11], [-46, -3]]] } },
    { type: 'Feature', properties: { name: 'Rio de Janeiro', sigla: 'RJ' }, geometry: { type: 'Polygon', coordinates: [[[-44.5, -21], [-41, -21], [-41, -23.5], [-44.5, -23.5], [-44.5, -21]]] } },
    { type: 'Feature', properties: { name: 'Rio Grande do Norte', sigla: 'RN' }, geometry: { type: 'Polygon', coordinates: [[[-38, -5], [-35, -5], [-35, -7], [-38, -7], [-38, -5]]] } },
    { type: 'Feature', properties: { name: 'Rio Grande do Sul', sigla: 'RS' }, geometry: { type: 'Polygon', coordinates: [[[-57, -27], [-49.5, -27], [-49.5, -33.5], [-57, -33.5], [-57, -27]]] } },
    { type: 'Feature', properties: { name: 'Rondônia', sigla: 'RO' }, geometry: { type: 'Polygon', coordinates: [[[-66, -8], [-60, -8], [-60, -13], [-66, -13], [-66, -8]]] } },
    { type: 'Feature', properties: { name: 'Roraima', sigla: 'RR' }, geometry: { type: 'Polygon', coordinates: [[[-64, 5], [-59, 5], [-59, -1], [-64, -1], [-64, 5]]] } },
    { type: 'Feature', properties: { name: 'Santa Catarina', sigla: 'SC' }, geometry: { type: 'Polygon', coordinates: [[[-53.5, -26], [-48.5, -26], [-48.5, -29.5], [-53.5, -29.5], [-53.5, -26]]] } },
    { type: 'Feature', properties: { name: 'São Paulo', sigla: 'SP' }, geometry: { type: 'Polygon', coordinates: [[[-53, -20], [-44.5, -20], [-44.5, -25], [-53, -25], [-53, -20]]] } },
    { type: 'Feature', properties: { name: 'Sergipe', sigla: 'SE' }, geometry: { type: 'Polygon', coordinates: [[[-38, -9.5], [-36.5, -9.5], [-36.5, -11.5], [-38, -11.5], [-38, -9.5]]] } },
    { type: 'Feature', properties: { name: 'Tocantins', sigla: 'TO' }, geometry: { type: 'Polygon', coordinates: [[[-50, -5], [-46, -5], [-46, -13], [-50, -13], [-50, -5]]] } },
  ],
};

interface BrazilHeatMapProps {
  stateData: Record<string, { total: number; sources: Record<string, number>; leads: CRMLead[] }>;
  onStateClick?: (uf: string, leads: CRMLead[]) => void;
}

export function BrazilHeatMap({ stateData, onStateClick }: BrazilHeatMapProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

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
    if (!chartRef.current) return;

    // Register map
    echarts.registerMap('Brazil', brazilGeoJson as any);

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
          
          let tooltipContent = `<strong>${params.name}</strong><br/>${data.value} Leads Convertidos<br/><br/>`;
          
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
            'hsl(var(--muted))',
            'hsl(160, 60%, 30%)',
            'hsl(160, 70%, 40%)',
            'hsl(160, 84%, 39%)',
          ],
        },
        calculable: true,
      },
      series: [
        {
          name: 'Leads Convertidos',
          type: 'map',
          map: 'Brazil',
          roam: false,
          emphasis: {
            label: {
              show: true,
              color: 'hsl(var(--foreground))',
            },
            itemStyle: {
              areaColor: 'hsl(160, 84%, 50%)',
            },
          },
          select: {
            label: {
              show: true,
              color: 'hsl(var(--foreground))',
            },
            itemStyle: {
              areaColor: 'hsl(160, 84%, 45%)',
            },
          },
          itemStyle: {
            borderColor: 'hsl(var(--border))',
            borderWidth: 1,
          },
          label: {
            show: false,
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
  }, [mapData, maxValue, onStateClick]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Distribuição Geográfica - Leads Convertidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="w-full h-[400px]" />
        
        {/* Top states summary */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {mapData
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
            .map((item) => (
              <div
                key={item.uf}
                className="p-2 rounded-lg bg-secondary/50 text-center cursor-pointer hover:bg-secondary transition-colors"
                onClick={() => onStateClick?.(item.uf, item.leads)}
              >
                <p className="text-xs text-muted-foreground">{item.uf}</p>
                <p className="text-lg font-bold text-foreground">{item.value}</p>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
