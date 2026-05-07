import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, UserX, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { DateFilter, SegmentedLead } from '@/types/dashboard';

type SeriesKey = 'total' | 'em_atendimento' | 'descartados' | 'convertidos';

interface SeriesMeta {
    key: SeriesKey;
    label: string;
    icon: React.ReactNode;
    color: string;
    gradientId: string;
    activeClass: string;
}

const SERIES: SeriesMeta[] = [
    {
        key: 'total',
        label: 'Total',
        icon: <Users className="h-3.5 w-3.5" />,
        color: 'hsl(var(--info))',
        gradientId: 'colorTimelineTotal',
        activeClass: 'data-[state=on]:bg-info/15 data-[state=on]:text-info data-[state=on]:border-info/60',
    },
    {
        key: 'em_atendimento',
        label: 'Em Atendimento',
        icon: <TrendingUp className="h-3.5 w-3.5" />,
        color: 'hsl(var(--warning))',
        gradientId: 'colorTimelineAtendimento',
        activeClass: 'data-[state=on]:bg-warning/15 data-[state=on]:text-warning data-[state=on]:border-warning/60',
    },
    {
        key: 'descartados',
        label: 'Descartados',
        icon: <UserX className="h-3.5 w-3.5" />,
        color: 'hsl(var(--destructive))',
        gradientId: 'colorTimelineDescartados',
        activeClass: 'data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive data-[state=on]:border-destructive/60',
    },
    {
        key: 'convertidos',
        label: 'Convertidos',
        icon: <UserCheck className="h-3.5 w-3.5" />,
        color: 'hsl(var(--success))',
        gradientId: 'colorTimelineConvertidos',
        activeClass: 'data-[state=on]:bg-success/15 data-[state=on]:text-success data-[state=on]:border-success/60',
    },
];

interface LeadTimelineChartProps {
    leads: {
        em_atendimento: SegmentedLead[];
        descartados: SegmentedLead[];
        convertidos: SegmentedLead[];
    };
    dateFilter: DateFilter;
}

type Granularity = 'hour' | 'day';

interface TimelinePoint {
    bucketKey: string;
    label: string;
    total: number;
    em_atendimento: number;
    descartados: number;
    convertidos: number;
}

// Bitrix returns timestamps normalized to UTC ("...Z"). We must bucket leads
// by Brazil local time (America/Sao_Paulo, UTC-3, no DST since 2019) — otherwise
// the hourly view shows leads at off-hours that look like late-night activity.
const BR_TZ = 'America/Sao_Paulo';

const BR_PARTS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
    timeZone: BR_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
});

interface BRParts {
    year: number;
    month: number;
    day: number;
    hour: number;
}

function parseToInstant(raw: string): Date | null {
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}

function getBRParts(date: Date): BRParts {
    const parts = BR_PARTS_FORMATTER.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '0';
    return {
        year: parseInt(get('year'), 10),
        month: parseInt(get('month'), 10),
        day: parseInt(get('day'), 10),
        hour: parseInt(get('hour'), 10),
    };
}

function dateKey({ year, month, day }: BRParts | { year: number; month: number; day: number }) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Build BR-aware day list across [start, end]. We iterate by absolute 24h steps
// from the BR-day of `start` to the BR-day of `end`, so the returned days reflect
// what a Brazilian user actually sees on the calendar regardless of browser TZ.
function eachBRDay(start: Date, end: Date): BRParts[] {
    const startParts = getBRParts(start);
    const endParts = getBRParts(end);
    const days: BRParts[] = [];
    // Use UTC arithmetic on the BR date components to avoid local-DST drift.
    const cursor = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day));
    const last = new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day));
    while (cursor.getTime() <= last.getTime()) {
        days.push({
            year: cursor.getUTCFullYear(),
            month: cursor.getUTCMonth() + 1,
            day: cursor.getUTCDate(),
            hour: 0,
        });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return days;
}

function buildHourlyBuckets(start: Date, end: Date): TimelinePoint[] {
    const days = eachBRDay(start, end);
    const buckets: TimelinePoint[] = [];
    const showDayPrefix = days.length > 1;
    days.forEach((day) => {
        const dStr = dateKey(day);
        for (let h = 0; h < 24; h++) {
            const hh = String(h).padStart(2, '0');
            const bucketKey = `${dStr}T${hh}`;
            // Render label using a UTC reference Date so date-fns formats the BR day correctly.
            const refDate = new Date(Date.UTC(day.year, day.month - 1, day.day));
            const label = showDayPrefix
                ? `${format(refDate, 'dd/MM', { locale: ptBR })} ${hh}h`
                : `${hh}h`;
            buckets.push({ bucketKey, label, total: 0, em_atendimento: 0, descartados: 0, convertidos: 0 });
        }
    });
    return buckets;
}

function buildDailyBuckets(start: Date, end: Date): TimelinePoint[] {
    const days = eachBRDay(start, end);
    return days.map((day) => {
        const refDate = new Date(Date.UTC(day.year, day.month - 1, day.day));
        return {
            bucketKey: dateKey(day),
            label: format(refDate, 'dd/MM', { locale: ptBR }),
            total: 0,
            em_atendimento: 0,
            descartados: 0,
            convertidos: 0,
        };
    });
}

function bucketKeyFor(parts: BRParts, granularity: Granularity): string {
    const dStr = dateKey(parts);
    if (granularity === 'hour') {
        return `${dStr}T${String(parts.hour).padStart(2, '0')}`;
    }
    return dStr;
}

export function LeadTimelineChart({ leads, dateFilter }: LeadTimelineChartProps) {
    const [selected, setSelected] = useState<SeriesKey[]>(['total']);

    const { data, granularity } = useMemo(() => {
        const allLeads = [...leads.em_atendimento, ...leads.descartados, ...leads.convertidos];

        // Determine effective range. Fall back to min/max of available creation dates if filter is open.
        let start = dateFilter.startDate;
        let end = dateFilter.endDate;
        if (!start || !end) {
            const ts = allLeads
                .map((l) => parseToInstant(l.data_criacao))
                .filter((d): d is Date => !!d);
            if (ts.length === 0) {
                return { data: [] as TimelinePoint[], granularity: 'day' as Granularity };
            }
            const min = new Date(Math.min(...ts.map((d) => d.getTime())));
            const max = new Date(Math.max(...ts.map((d) => d.getTime())));
            start = start || min;
            end = end || max;
        }

        // Compute granularity in BR calendar terms so "hoje" / "hoje + ontem" trigger the hourly view.
        const startParts = getBRParts(start!);
        const endParts = getBRParts(end!);
        const startUTC = Date.UTC(startParts.year, startParts.month - 1, startParts.day);
        const endUTC = Date.UTC(endParts.year, endParts.month - 1, endParts.day);
        const dayDiff = Math.round((endUTC - startUTC) / 86400000);
        const gran: Granularity = dayDiff <= 1 ? 'hour' : 'day';

        const buckets = gran === 'hour' ? buildHourlyBuckets(start!, end!) : buildDailyBuckets(start!, end!);
        const byKey = new Map<string, TimelinePoint>();
        buckets.forEach((b) => byKey.set(b.bucketKey, b));

        const accumulate = (list: SegmentedLead[], field: Exclude<SeriesKey, 'total'>) => {
            list.forEach((lead) => {
                const dt = parseToInstant(lead.data_criacao);
                if (!dt) return;
                const key = bucketKeyFor(getBRParts(dt), gran);
                const point = byKey.get(key);
                if (!point) return;
                point[field] += 1;
                point.total += 1;
            });
        };

        accumulate(leads.em_atendimento, 'em_atendimento');
        accumulate(leads.descartados, 'descartados');
        accumulate(leads.convertidos, 'convertidos');

        return { data: buckets, granularity: gran };
    }, [leads, dateFilter]);

    const visibleSeries = SERIES.filter((s) => selected.includes(s.key));
    const granularityLabel = granularity === 'hour' ? 'Agrupado por hora' : 'Agrupado por dia';

    const yMax = useMemo(() => {
        if (visibleSeries.length === 0) return 0;
        let m = 0;
        data.forEach((p) => {
            visibleSeries.forEach((s) => {
                if (p[s.key] > m) m = p[s.key];
            });
        });
        return m;
    }, [data, visibleSeries]);

    const hasData = data.some((p) => p.total > 0);

    const handleToggle = (next: string[]) => {
        // Keep at least one series active so the chart never goes blank.
        if (next.length === 0) return;
        setSelected(next as SeriesKey[]);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[160px]">
                <p className="font-semibold text-foreground text-sm mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any) => {
                        const meta = SERIES.find((s) => s.key === entry.dataKey);
                        if (!meta) return null;
                        return (
                            <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-block h-2.5 w-2.5 rounded-full"
                                        style={{ background: meta.color }}
                                        aria-hidden
                                    />
                                    <span className="text-muted-foreground">{meta.label}</span>
                                </div>
                                <span className="font-semibold text-foreground tabular-nums">{entry.value}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">Entrada de Leads (Temporal)</CardTitle>
                        <p className="text-xs text-muted-foreground">{granularityLabel}</p>
                    </div>

                    <ToggleGroup
                        type="multiple"
                        value={selected}
                        onValueChange={handleToggle}
                        className="flex flex-wrap justify-start gap-1.5 sm:justify-end"
                        aria-label="Filtrar séries do gráfico"
                    >
                        {SERIES.map((s) => (
                            <ToggleGroupItem
                                key={s.key}
                                value={s.key}
                                aria-label={s.label}
                                className={cn(
                                    'h-8 gap-1.5 rounded-full border border-border bg-background/50 px-3 text-xs font-medium text-muted-foreground transition-all',
                                    'hover:bg-muted/70 hover:text-foreground',
                                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                    s.activeClass,
                                )}
                            >
                                {s.icon}
                                <span>{s.label}</span>
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </CardHeader>

            <CardContent>
                <div className="h-[280px] w-full sm:h-[320px]">
                    {!hasData ? (
                        <div className="flex h-full flex-col items-center justify-center text-center">
                            <p className="text-sm text-muted-foreground">Sem dados no período selecionado.</p>
                            <p className="mt-1 text-xs text-muted-foreground/70">
                                Ajuste o filtro de data para visualizar a evolução.
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                                <defs>
                                    {SERIES.map((s) => (
                                        <linearGradient key={s.gradientId} id={s.gradientId} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={s.color} stopOpacity={0.45} />
                                            <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={granularity === 'hour' ? 24 : 12}
                                />
                                <YAxis
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    tickLine={false}
                                    allowDecimals={false}
                                    domain={[0, yMax === 0 ? 1 : 'auto']}
                                    width={36}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
                                {visibleSeries.map((s) => (
                                    <Area
                                        key={s.key}
                                        type="monotone"
                                        dataKey={s.key}
                                        name={s.label}
                                        stroke={s.color}
                                        strokeWidth={2}
                                        fill={`url(#${s.gradientId})`}
                                        fillOpacity={1}
                                        activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                                        isAnimationActive
                                        animationDuration={250}
                                    />
                                ))}
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
