import { useState, useMemo } from 'react';
import { ExternalLink, MessageSquare, Search, ArrowUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedLead, SegmentedDeal } from '@/types/dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HoverScrollContainer } from './HoverScrollContainer';

interface AdvancedLeadsTableProps {
    leads: {
        em_atendimento: SegmentedLead[];
        descartados: SegmentedLead[];
        convertidos: SegmentedLead[];
    };
    deals: {
        por_status: {
            ganhos: SegmentedDeal[];
            perdidos: SegmentedDeal[];
            andamento: SegmentedDeal[];
        };
    };
}

type UnifiedRow = {
    id: string;
    originalId: string;
    type: 'lead' | 'deal';
    nome: string; // Lead Name or Deal Title
    status: string;
    statusLabel: string;
    valor: number | null;
    fonte: string;
    uf: string;
    responsavel: string;
    segmento: string;
    funil: string;
    data: string; // Created or Closed date
    link_bitrix: string;
    link_kinbox?: string;
    raw: SegmentedLead | SegmentedDeal;
};

type FilterType = 'all' | 'attending' | 'in_progress' | 'won' | 'lost' | 'retail' | 'project' | 'new_clients';
type SortConfig = { key: keyof UnifiedRow | 'data_parsed'; direction: 'asc' | 'desc' };

const formatCurrency = (value: number | null) => {
    if (value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatDate = (dateStr: string) => {
    try {
        return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
        return '-';
    }
};

export function AdvancedLeadsTable({ leads, deals }: AdvancedLeadsTableProps) {
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [funilFilter, setFunilFilter] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'data', direction: 'desc' });
    const [limit, setLimit] = useState(50);

    // 1. Unify Data
    const unifiedData = useMemo(() => {
        const rows: UnifiedRow[] = [];

        // Helper to add leads
        const addLeads = (list: SegmentedLead[], statusLabel: string) => {
            list.forEach(l => {
                rows.push({
                    id: `lead-${l.id}`,
                    originalId: l.id,
                    type: 'lead',
                    nome: l.nome,
                    status: l.status_codigo || statusLabel,
                    statusLabel: statusLabel,
                    valor: null,
                    fonte: l.fonte,
                    uf: l.uf || '-',
                    responsavel: l.responsavel_nome,
                    segmento: '-',
                    funil: '-',
                    data: l.data_criacao,
                    link_bitrix: l.link_bitrix,
                    link_kinbox: l.link_kinbox,
                    raw: l,
                });
            });
        };

        // Helper to add deals
        const addDeals = (list: SegmentedDeal[], statusLabel: string) => {
            list.forEach(d => {
                rows.push({
                    id: `deal-${d.id}`,
                    originalId: d.id,
                    type: 'deal',
                    nome: d.titulo,
                    status: d.status_nome,
                    statusLabel: d.status_nome, // Or override if needed
                    valor: d.valor,
                    fonte: d.fonte,
                    uf: d.uf || '-',
                    responsavel: d.responsavel_nome,
                    segmento: d.segmento || '-',
                    funil: d.funil || '-',
                    data: d.data_criacao, // Or data_fechamento for closed deals? Keeping creation for consistency unless requested
                    link_bitrix: d.link_bitrix,
                    link_kinbox: d.link_kinbox,
                    raw: d,
                });
            });
        };

        addLeads(leads.em_atendimento, 'Em Atendimento');
        addLeads(leads.descartados, 'Descartado');
        addLeads(leads.convertidos, 'Convertido');

        addDeals(deals.por_status.andamento, 'Em Andamento');
        addDeals(deals.por_status.ganhos, 'Ganho');
        addDeals(deals.por_status.perdidos, 'Perdido');

        return rows;
    }, [leads, deals]);

    // Get available funnels from deals
    const availableFunnels = useMemo(() => {
        const funnels = new Set<string>();
        [...deals.por_status.ganhos, ...deals.por_status.perdidos, ...deals.por_status.andamento]
            .forEach(d => {
                if (d.funil && d.funil !== '-') funnels.add(d.funil);
            });
        return ['all', ...Array.from(funnels).sort()];
    }, [deals]);

    // 2. Filter & Search
    const filteredData = useMemo(() => {
        return unifiedData.filter(row => {
            // Text Search
            const searchLower = search.toLowerCase();
            const matchesSearch =
                searchLower === '' ||
                row.nome.toLowerCase().includes(searchLower) ||
                row.originalId.toString().includes(searchLower) ||
                row.responsavel.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Funil Filter
            if (funilFilter !== 'all' && row.funil !== funilFilter) return false;

            // Type Filter
            if (filterType === 'all') return true;

            // "Em Atendimento": Only Leads currently in service
            if (filterType === 'attending') return row.type === 'lead' && row.statusLabel === 'Em Atendimento';

            // "Em Progresso": Deals that are converted/in progress (not won/lost)
            if (filterType === 'in_progress') return row.type === 'deal' && row.statusLabel === 'Em Andamento';

            // "Ganhos": Deals Won + Leads Converted
            if (filterType === 'won') return row.statusLabel === 'Ganho' || row.statusLabel === 'Convertido';

            // "Perdidos": Deals Lost + Leads Discarded
            if (filterType === 'lost') return row.statusLabel === 'Perdido' || row.statusLabel === 'Descartado';
            if (filterType === 'retail') return row.type === 'deal' && row.segmento.toLowerCase().includes('varejo');
            if (filterType === 'project') return row.type === 'deal' && row.segmento.toLowerCase().includes('projeto');

            // "Novos Clientes"
            if (filterType === 'new_clients') {
                return (row.raw as any).is_novo === true;
            }

            return true;
        });
    }, [unifiedData, search, filterType, funilFilter]);

    // 3. Sort
    const sortedData = useMemo(() => {
        const sorted = [...filteredData];
        sorted.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof UnifiedRow];
            let valB: any = b[sortConfig.key as keyof UnifiedRow];

            // Handle dates specifically if strictly required, but ISO strings sort vaguely ok ideally
            // Best to use timestamps or new Date()
            if (sortConfig.key === 'data') {
                valA = new Date(a.data).getTime();
                valB = new Date(b.data).getTime();
            }

            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            // String comparison
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            }

            // Number comparison
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredData, sortConfig]);

    // 4. Pagination / Limit
    const visibleData = sortedData.slice(0, limit);

    // 5. Calculate Total Value of FILTERED items
    const totalValue = useMemo(() => {
        return filteredData.reduce((acc, row) => {
            return acc + (row.valor || 0);
        }, 0);
    }, [filteredData]);

    const handleSort = (key: keyof UnifiedRow) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortableHead = ({ label, colKey, className = "" }: { label: string, colKey: keyof UnifiedRow, className?: string }) => (
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

    const getStatusVariant = (label: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
        const l = label.toLowerCase();
        if (l.includes('ganho') || l.includes('convertido')) return 'success'; // Custom variant map in types/badge? Using standard for now, assumes extensions or mapped to valid types
        // Actually badge variants are standard: default, secondary, destructive, outline.
        // Let's stick to standard + manual classes if needed, or mapping.
        // Assuming user has customized badge or used standard. 
        if (l.includes('ganho') || l.includes('convertido')) return 'default'; // often green/primary
        if (l.includes('perdido') || l.includes('descartado')) return 'destructive';
        if (l.includes('atendimento') || l.includes('andamento')) return 'secondary';
        return 'outline';
    };

    // Manual color classes as fallback if variants aren't enough
    const getStatusColorClass = (label: string) => {
        const l = label.toLowerCase();
        if (l.includes('ganho') || l.includes('convertido')) return 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25';
        if (l.includes('perdido') || l.includes('descartado')) return 'bg-red-500/15 text-red-500 hover:bg-red-500/25';
        if (l.includes('atendimento') || l.includes('andamento') || l.includes('process')) return 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25';
        return 'bg-slate-500/15 text-slate-500';
    };

    return (
        <Card className="mt-8 border-none bg-card/50">
            <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <CardTitle className="text-xl">Listagem Avançada de Leads</CardTitle>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por Nome, ID ou Responsável..."
                                className="pl-9 w-full sm:w-[300px]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={funilFilter} onValueChange={setFunilFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Filtrar por Funil" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableFunnels.map(funil => (
                                    <SelectItem key={funil} value={funil}>
                                        {funil === 'all' ? 'Todos os Funis' : funil}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant={filterType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('all')}>Todos</Button>
                    <Button variant={filterType === 'attending' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('attending')}>Em Atendimento (Leads)</Button>
                    <Button variant={filterType === 'in_progress' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('in_progress')}>Em Progresso (Negócios)</Button>
                    <Button variant={filterType === 'won' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('won')}>Ganhos / Convertidos</Button>
                    <Button variant={filterType === 'lost' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('lost')}>Perdidos / Descartados</Button>
                    <Button variant={filterType === 'retail' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('retail')}>Varejo</Button>
                    <Button variant={filterType === 'project' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('project')}>Projeto</Button>
                    <Button variant={filterType === 'new_clients' ? 'default' : 'outline'} size="sm" onClick={() => setFilterType('new_clients')} className="border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-500">
                        ✨ Novos Clientes
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <HoverScrollContainer className="rounded-md border">
                    <Table className="min-w-max">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] text-center">#</TableHead>
                                <SortableHead label="ID" colKey="originalId" />
                                <SortableHead label="Cliente" colKey="nome" />
                                <SortableHead label="Status" colKey="status" />
                                <SortableHead label="Valor" colKey="valor" />
                                <SortableHead label="Fonte" colKey="fonte" />
                                <SortableHead label="UF" colKey="uf" />
                                <SortableHead label="Responsável" colKey="responsavel" />
                                <SortableHead label="Segmento" colKey="segmento" />
                                <SortableHead label="Funil" colKey="funil" />
                                <SortableHead label="Data" colKey="data" />
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {visibleData.length > 0 ? (
                                visibleData.map((row, index) => (
                                    <TableRow key={row.id} className="hover:bg-muted/50">
                                        <TableCell className="text-center text-muted-foreground text-xs">{index + 1}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{row.originalId}</TableCell>
                                        <TableCell className="font-medium">{row.nome}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`font-normal ${getStatusColorClass(row.statusLabel)}`}>
                                                {row.statusLabel}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(row.valor)}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.fonte}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.uf}</TableCell>
                                        <TableCell className="text-sm">{row.responsavel}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.segmento}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{row.funil}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{formatDate(row.data)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                {row.link_kinbox && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10"
                                                        onClick={() => window.open(row.link_kinbox, '_blank')}
                                                        title="Abrir no Kinbox"
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {row.link_bitrix && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                                        onClick={() => window.open(row.link_bitrix, '_blank')}
                                                        title="Abrir no Bitrix"
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-24 text-center">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>

                        <TableFooter className="bg-muted/50 font-medium">
                            <TableRow>
                                <TableCell colSpan={4} className="text-right pr-4">Total (Filtrado):</TableCell>
                                <TableCell className="text-left font-bold text-foreground">
                                    {formatCurrency(totalValue)}
                                </TableCell>
                                <TableCell colSpan={7}></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </HoverScrollContainer>
                {/* Load More Trigger */}
                {visibleData.length < filteredData.length && (
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={() => setLimit(prev => prev + 50)}>
                            Carregar mais ({filteredData.length - visibleData.length} restantes)
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
