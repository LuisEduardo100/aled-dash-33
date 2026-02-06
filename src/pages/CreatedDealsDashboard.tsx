import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { KPICard } from '@/components/dashboard/KPICard';
import { useCreatedDeals } from '@/hooks/useCreatedDeals';
import { DateFilter } from '@/types/dashboard';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Users, TrendingUp, BarChart4, DollarSign, Calendar,
    RefreshCw, Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Legend
} from 'recharts';

export default function CreatedDealsDashboard() {
    // Filters
    const [dateFilter, setDateFilter] = useState<DateFilter>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date())
    });
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [ufFilter, setUfFilter] = useState('Todos');
    const [regionalFilter, setRegionalFilter] = useState('Todos');

    const {
        metrics,
        metricsPrevious,
        wonLost,
        timeline,
        sourcesChart,
        varejo,
        projeto,
        sources: availableSources,
        ufs: availableUfs,
        regionals: availableRegionals,
        isLoading,
        isSyncing,
        error,
        refetch,
        syncData
    } = useCreatedDeals(dateFilter, sourceFilter, ufFilter, regionalFilter);

    // Format Helpers
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const calculateGrowth = (current: number, previous: number) => {
        if (!previous) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const renderGrowth = (current: number, previous: number) => {
        const growth = calculateGrowth(current, previous);
        const isPositive = growth >= 0;
        return (
            <span className={`text-xs font-medium ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                {isPositive ? '+' : ''}{growth.toFixed(1)}%
            </span>
        );
    };

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={refetch}>Tentar Novamente</Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="px-6 pt-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Análise de Negócios</h1>
                        <p className="text-muted-foreground">
                            Acompanhamento de novos negociações por data de criação (Funil Corporativo, SMB, Barão)
                        </p>
                    </div>
                </div>

                <FilterBar
                    dateFilter={dateFilter}
                    onDateFilterChange={setDateFilter}
                    sourceFilter={sourceFilter}
                    onSourceFilterChange={setSourceFilter}
                    availableSources={availableSources}
                    ufFilter={ufFilter}
                    onUfFilterChange={setUfFilter}
                    availableUfs={availableUfs}
                    regionalFilter={regionalFilter}
                    onRegionalFilterChange={setRegionalFilter}
                    availableRegionals={availableRegionals}
                    // Funnel filter disabled for this view as it's specific
                    funnelFilter="Todos"
                    onFunnelFilterChange={() => { }}
                    availableFunnels={[]}
                    onRefresh={refetch}
                    onSync={syncData}
                    isLoading={isLoading}
                    isSyncing={isSyncing}
                />
            </div>

            <div className="px-6 pb-8 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {isLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />) : (
                        <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total de Oportunidades</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{metrics.total}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {renderGrowth(metrics.total, metricsPrevious.total)}
                                        <span className="text-xs text-muted-foreground">vs. anterior</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Faturamento Potencial</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.valorTotal)}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {renderGrowth(metrics.valorTotal, metricsPrevious.valorTotal)}
                                        <span className="text-xs text-muted-foreground">vs. anterior</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Oportunidades Varejo</CardTitle>
                                    <BarChart4 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">{metrics.varejo}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {renderGrowth(metrics.varejo, metricsPrevious.varejo)}
                                        <span className="text-xs text-muted-foreground">vs. anterior</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Oportunidades Projetos</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">{metrics.projeto}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        {renderGrowth(metrics.projeto, metricsPrevious.projeto)}
                                        <span className="text-xs text-muted-foreground">vs. anterior</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Projetos Ganhos / Perdidos</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-green-500">{wonLost.won}</div>
                                            <div className="text-xs text-muted-foreground">Ganhos</div>
                                        </div>
                                        <div className="h-8 w-px bg-border" />
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-red-500">{wonLost.lost}</div>
                                            <div className="text-xs text-muted-foreground">Perdidos</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Charts: Timeline & Sources */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Negócios Criados por Dia</CardTitle>
                            <CardDescription>Evolução diária de novos negócios criados</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            {isLoading ? <Skeleton className="w-full h-full" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timeline}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(val) => format(new Date(val), 'dd/MM')}
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            labelFormatter={(val) => format(new Date(val), 'dd MMM yyyy', { locale: ptBR })}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#8884d8" fillOpacity={1} fill="url(#colorTotal)" name="Novos Negócios" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Fontes</CardTitle>
                            <CardDescription>Principais origens dos negócios</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            {isLoading ? <Skeleton className="w-full h-full" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={sourcesChart.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} name="Negócios" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* VAREJO LIST */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-blue-500">Oportunidades Varejo ({metrics.varejo})</CardTitle>
                            <CardDescription>Lista de novos deals Varejo</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[500px] overflow-auto">
                            {isLoading ? <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Negócio</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {varejo.map(d => (
                                            <TableRow key={d.id}>
                                                <TableCell className="text-xs">{format(new Date(d.data_criacao), 'dd/MM')}</TableCell>
                                                <TableCell className="font-medium text-xs">
                                                    <a href={d.link_bitrix} target="_blank" rel="noreferrer" className="hover:underline">
                                                        {d.titulo}
                                                    </a>
                                                    <div className="text-[10px] text-muted-foreground">{d.responsavel_nome}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{formatCurrency(d.valor)}</TableCell>
                                                <TableCell className='text-xs'>{d.status_nome}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    {/* PROJETO LIST */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-orange-500">Oportunidades Projetos ({metrics.projeto})</CardTitle>
                            <CardDescription>Lista de novos deals Projetos</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[500px] overflow-auto">
                            {isLoading ? <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Negócio</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projeto.map(d => (
                                            <TableRow key={d.id}>
                                                <TableCell className="text-xs">{format(new Date(d.data_criacao), 'dd/MM')}</TableCell>
                                                <TableCell className="font-medium text-xs">
                                                    <a href={d.link_bitrix} target="_blank" rel="noreferrer" className="hover:underline">
                                                        {d.titulo}
                                                    </a>
                                                    <div className="text-[10px] text-muted-foreground">{d.responsavel_nome}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{formatCurrency(d.valor)}</TableCell>
                                                <TableCell className='text-xs'>{d.status_nome}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
