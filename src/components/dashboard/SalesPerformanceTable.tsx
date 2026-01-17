import { useState, useMemo } from 'react';
import { ExternalLink, MessageSquare, Search, ArrowUpDown, Calendar, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedDeal } from '@/types/dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HoverScrollContainer } from './HoverScrollContainer';

interface SalesPerformanceTableProps {
    deals: SegmentedDeal[];
}

type SortConfig = { key: keyof SegmentedDeal | 'data_fechamento_parsed'; direction: 'asc' | 'desc' };

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
        return '-';
    }
};

export function SalesPerformanceTable({ deals }: SalesPerformanceTableProps) {
    const [search, setSearch] = useState('');
    const [repFilter, setRepFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'valor', direction: 'desc' });
    const [limit, setLimit] = useState(50);

    // Dynamic Filter Options
    const availableReps = useMemo(() => {
        const reps = new Set<string>();
        deals.forEach(d => {
            if (d.responsavel_nome) reps.add(d.responsavel_nome);
        });
        return ['all', ...Array.from(reps).sort()];
    }, [deals]);

    // Filter & Sort
    const processedData = useMemo(() => {
        let filtered = deals.filter(deal => {
            // Search (Rep, Title, ID)
            const searchLower = search.toLowerCase();
            const matchesSearch =
                searchLower === '' ||
                (deal.titulo && deal.titulo.toLowerCase().includes(searchLower)) ||
                (deal.responsavel_nome && deal.responsavel_nome.toLowerCase().includes(searchLower)) ||
                (deal.id && deal.id.toString().includes(searchLower));

            if (!matchesSearch) return false;

            // Rep Filter
            if (repFilter !== 'all' && deal.responsavel_nome !== repFilter) return false;

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof SegmentedDeal];
            let valB: any = b[sortConfig.key as keyof SegmentedDeal];

            // Handle dates / special keys
            if (sortConfig.key === 'data_fechamento_parsed') {
                valA = a.data_fechamento ? new Date(a.data_fechamento).getTime() : 0;
                valB = b.data_fechamento ? new Date(b.data_fechamento).getTime() : 0;
            }

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [deals, search, repFilter, sortConfig]);

    const visibleData = processedData.slice(0, limit);

    const handleSort = (key: keyof SegmentedDeal | 'data_fechamento_parsed') => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortableHead = ({ label, colKey, className = "" }: { label: string, colKey: keyof SegmentedDeal | 'data_fechamento_parsed', className?: string }) => (
        <TableHead
            className={`cursor-pointer hover:text-foreground group ${className}`}
            onClick={() => handleSort(colKey)}
        >
            <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''}`}>
                {label}
                <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig.key === colKey ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
            </div>
        </TableHead>
    );

    return (
        <Card className="border-none bg-card/50">
            <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Detalhamento de Negócios Ganhos</CardTitle>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar: Título, ID, Responsável..."
                                className="pl-9 w-full sm:w-[300px]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={repFilter} onValueChange={setRepFilter}>
                            <SelectTrigger className="w-[200px]">
                                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Filtrar Vendedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableReps.map(rep => (
                                    <SelectItem key={rep} value={rep}>
                                        {rep === 'all' ? 'Todos os Vendedores' : rep}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <HoverScrollContainer className="rounded-md border bg-card">
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[50px] text-center">#</TableHead>
                                <SortableHead label="ID" colKey="id" className="text-center" />
                                <SortableHead label="Cliente / Título" colKey="titulo" />
                                <SortableHead label="Valor" colKey="valor" />
                                <SortableHead label="Responsável" colKey="responsavel_nome" />
                                <SortableHead label="Fonte" colKey="fonte" />
                                <SortableHead label="Segmento" colKey="segmento" />
                                <SortableHead label="UF" colKey="uf" />
                                <SortableHead label="Data Fechamento" colKey="data_fechamento_parsed" />
                                <TableHead className="text-right">Links</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleData.length > 0 ? (
                                visibleData.map((deal, index) => (
                                    <TableRow key={deal.id} className="hover:bg-muted/50">
                                        <TableCell className="text-center text-muted-foreground text-xs">{index + 1}</TableCell>
                                        <TableCell className="text-center font-mono text-xs text-muted-foreground">{deal.id}</TableCell>
                                        <TableCell className="font-medium text-sm">{deal.titulo}</TableCell>
                                        <TableCell className="font-semibold text-emerald-500 text-sm">{formatCurrency(deal.valor)}</TableCell>
                                        <TableCell className="text-sm">
                                            <Badge variant="secondary" className="font-normal bg-secondary/50">
                                                {deal.responsavel_nome}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{deal.fonte}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{deal.segmento || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{deal.uf || '-'}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {formatDate(deal.data_fechamento || deal.data_criacao)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                {deal.link_kinbox && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10" onClick={() => window.open(deal.link_kinbox, '_blank')} title="Abrir no Kinbox">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {deal.link_bitrix && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10" onClick={() => window.open(deal.link_bitrix, '_blank')} title="Abrir no Bitrix">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                        Nenhum negócio encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </HoverScrollContainer>

                {visibleData.length < processedData.length && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={() => setLimit(prev => prev + 50)}>
                            Carregar mais ({processedData.length - visibleData.length} restantes)
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
