import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { DateFilter, SegmentedDeal } from '@/types/dashboard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Link2Off, Wallet, Loader2, User, ArrowRight, CheckCircle2, HelpCircle, TrendingUp, DollarSign, Users, ChevronLeft, ChevronRight, ExternalLink, Tag } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { bitrixService, BitrixLead } from '@/services/bitrixService';
import { getFriendlySourceName } from '@/utils/sourceMapping';

export default function LeadConversionReport() {
    const [dateFilter, setDateFilter] = useState<DateFilter>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
    });
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [ufFilter, setUfFilter] = useState('Todos');

    const {
        leads,
        deals,
        availableSources,
        availableUfs,
        isLoading,
        refetch
    } = useFilteredDashboard(
        dateFilter,
        sourceFilter === 'Todos' ? null : sourceFilter,
        ufFilter === 'Todos' ? null : ufFilter,
        null,
        null
    );

    // Combine all deals from por_status
    const allDeals = useMemo(() => {
        return [
            ...deals.por_status.ganhos,
            ...deals.por_status.perdidos,
            ...deals.por_status.andamento
        ];
    }, [deals]);

    // Calculate total leads
    const totalLeads = useMemo(() => {
        return leads.em_atendimento.length + leads.convertidos.length + leads.descartados.length;
    }, [leads]);

    // Get all leads for phone matching
    const allLeadsArray = useMemo(() => {
        return [...leads.em_atendimento, ...leads.convertidos, ...leads.descartados];
    }, [leads]);

    // Phone normalization function - removes all non-digit characters
    const normalizePhone = (phone: string | undefined | null): string => {
        if (!phone) return '';
        const digitsOnly = phone.replace(/\D/g, '');
        // Keep last 11 digits (DDD + number) or last 10 if no country code
        return digitsOnly.slice(-11);
    };

    // Check if a string looks like a phone number (mostly digits, right length)
    const isLikelyPhone = (value: string | undefined | null): boolean => {
        if (!value) return false;
        const digitsOnly = value.replace(/\D/g, '');
        // Phone should have at least 10 digits and be mostly numeric
        return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    };

    // Extract all phone numbers from a lead (checks telefone field and PHONE array)
    const extractPhonesFromLead = (lead: any): string[] => {
        const phones: string[] = [];

        // 1. Check simple telefone field
        if (lead.telefone && isLikelyPhone(lead.telefone)) {
            phones.push(normalizePhone(lead.telefone));
        }

        // 2. Check PHONE array (Bitrix format)
        if (Array.isArray(lead.PHONE)) {
            lead.PHONE.forEach((entry: any) => {
                // Check VALUE field
                if (entry.VALUE && isLikelyPhone(entry.VALUE)) {
                    phones.push(normalizePhone(entry.VALUE));
                }
                // Check VALUE_TYPE field (sometimes phone is here due to data inversion)
                if (entry.VALUE_TYPE && isLikelyPhone(entry.VALUE_TYPE)) {
                    phones.push(normalizePhone(entry.VALUE_TYPE));
                }
            });
        }

        return phones.filter(p => p.length >= 10);
    };

    // Extract phone from a deal
    const extractPhoneFromDeal = (deal: any): string => {
        if (deal.telefone && isLikelyPhone(deal.telefone)) {
            return normalizePhone(deal.telefone);
        }
        return '';
    };

    // Build a set of normalized lead phones for quick lookup
    const leadPhoneSet = useMemo(() => {
        const set = new Set<string>();
        allLeadsArray.forEach(lead => {
            const phones = extractPhonesFromLead(lead);
            phones.forEach(p => set.add(p));
        });
        return set;
    }, [allLeadsArray]);

    const stats = useMemo(() => {
        // By ID_LEAD
        const linkedByIdDeals = allDeals.filter(d => !!d.id_lead);
        const unlinkedByIdDeals = allDeals.filter(d => !d.id_lead);

        // By Contact (Phone)
        const linkedByPhoneDeals = allDeals.filter(d => {
            const dealPhone = extractPhoneFromDeal(d);
            return dealPhone.length >= 10 && leadPhoneSet.has(dealPhone);
        });
        const unlinkedByPhoneDeals = allDeals.filter(d => {
            const dealPhone = extractPhoneFromDeal(d);
            return dealPhone.length < 10 || !leadPhoneSet.has(dealPhone);
        });

        const wonDeals = deals.por_status.ganhos;

        const sumValue = (arr: SegmentedDeal[]) => arr.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

        return {
            total: {
                count: allDeals.length,
                value: sumValue(allDeals),
            },
            // By ID_LEAD
            linkedById: {
                count: linkedByIdDeals.length,
                value: sumValue(linkedByIdDeals),
                deals: linkedByIdDeals,
            },
            unlinkedById: {
                count: unlinkedByIdDeals.length,
                value: sumValue(unlinkedByIdDeals),
                deals: unlinkedByIdDeals,
            },
            // By Contact (Phone)
            linkedByPhone: {
                count: linkedByPhoneDeals.length,
                value: sumValue(linkedByPhoneDeals),
                deals: linkedByPhoneDeals,
            },
            unlinkedByPhone: {
                count: unlinkedByPhoneDeals.length,
                value: sumValue(unlinkedByPhoneDeals),
                deals: unlinkedByPhoneDeals,
            },
            won: {
                count: wonDeals.length,
                value: sumValue(wonDeals),
            }
        };
    }, [allDeals, deals.por_status.ganhos, leadPhoneSet]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="p-8 flex items-center justify-center h-full">
                    <span className="animate-pulse">Carregando dados de auditoria...</span>
                </div>
            </DashboardLayout>
        );
    }

    // Funnel percentages
    const conversionRate = totalLeads > 0 ? ((leads.convertidos.length / totalLeads) * 100).toFixed(1) : '0';
    const wonRate = stats.total.count > 0 ? ((stats.won.count / stats.total.count) * 100).toFixed(1) : '0';

    return (
        <DashboardLayout>
            <TooltipProvider>
                <div className="p-6 space-y-6 overflow-y-auto h-full">
                    <div className="flex flex-col gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Relatório de Conversão Lead-Deal</h1>
                            <p className="text-muted-foreground">Auditoria de vínculo entre Leads e Negócios (Deals).</p>
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
                            onRefresh={refetch}
                            isLoading={isLoading}
                        />
                    </div>

                    {/* ========== CONVERSION FUNNEL (Best Practice Dashboard Visual) ========== */}
                    <Card className="bg-gradient-to-r from-card to-muted/20 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Funil de Conversão
                            </CardTitle>
                            <CardDescription>Visão macro da jornada do lead até a receita gerada.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                {/* Stage 1: Leads */}
                                <div className="flex-1 text-center p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
                                    <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                                    <div className="text-3xl font-bold text-blue-500">{totalLeads}</div>
                                    <div className="text-sm text-muted-foreground">Leads Captados</div>
                                </div>

                                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                                <div className="md:hidden text-xs text-muted-foreground">↓ {conversionRate}% converteram</div>

                                {/* Stage 2: Converted to Deals */}
                                <div className="flex-1 text-center p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                    <Wallet className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                                    <div className="text-3xl font-bold text-amber-500">{stats.total.count}</div>
                                    <div className="text-sm text-muted-foreground">Negócios Gerados</div>
                                    <div className="text-xs text-muted-foreground mt-1">{conversionRate}% dos Leads</div>
                                </div>

                                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                                <div className="md:hidden text-xs text-muted-foreground">↓ {wonRate}% fecharam</div>

                                {/* Stage 3: Won Deals / Revenue */}
                                <div className="flex-1 text-center p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                    <DollarSign className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                                    <div className="text-3xl font-bold text-emerald-500">{formatCurrency(stats.won.value)}</div>
                                    <div className="text-sm text-muted-foreground">Receita Fechada</div>
                                    <div className="text-xs text-muted-foreground mt-1">{stats.won.count} negócios ({wonRate}%)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ========== TRACEABILITY CARDS ========== */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Negócios</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total.count}</div>
                                <p className="text-xs text-muted-foreground">{formatCurrency(stats.total.value)} em pipeline total</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-emerald-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Com Vínculo (id_lead)</CardTitle>
                                <Link2 className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.linkedById.count}</div>
                                <p className="text-xs text-muted-foreground">{formatCurrency(stats.linkedById.value)} rastreáveis</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-500">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Sem Vínculo</CardTitle>
                                <Link2Off className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.unlinkedById.count}</div>
                                <p className="text-xs text-muted-foreground">{formatCurrency(stats.unlinkedById.value)} sem origem direta</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                            <TabsTrigger value="linked">Deals Vinculados ({stats.linkedById.count})</TabsTrigger>
                            <TabsTrigger value="unlinked">Deals Sem Vínculo ({stats.unlinkedById.count})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Resumo da Auditoria</CardTitle>
                                    <CardDescription>Comparativo entre métodos de rastreabilidade</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {/* BY ID_LEAD SECTION */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                                                <Link2 className="h-4 w-4" /> Por ID do Lead (id_lead)
                                            </h4>
                                            <div className="space-y-2 pl-6">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>Taxa de Rastreabilidade (Volume)</span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p><strong>O que é?</strong> Porcentagem de negócios que possuem o campo id_lead preenchido, permitindo rastrear qual Lead originou a venda.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <span className="font-bold">
                                                        {stats.total.count > 0 ? ((stats.linkedById.count / stats.total.count) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>Taxa de Rastreabilidade (Valor)</span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p><strong>O que é?</strong> Porcentagem do valor financeiro total cujos negócios possuem id_lead preenchido.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <span className="font-bold">
                                                        {stats.total.value > 0 ? ((stats.linkedById.value / stats.total.value) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* BY PHONE SECTION */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-500 mb-3 flex items-center gap-2">
                                                📱 Por Contato (Telefone)
                                            </h4>
                                            <div className="space-y-2 pl-6">
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>Taxa de Rastreabilidade (Volume)</span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p><strong>O que é?</strong> Porcentagem de negócios cujo telefone de contato corresponde a um Lead existente no sistema.</p>
                                                                <p className="mt-1 text-muted-foreground">Negócios sem telefone (parceiros) não são contabilizados.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <span className="font-bold text-blue-500">
                                                        {stats.total.count > 0 ? ((stats.linkedByPhone.count / stats.total.count) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span>Taxa de Rastreabilidade (Valor)</span>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-xs">
                                                                <p><strong>O que é?</strong> Porcentagem do valor financeiro total cujos negócios têm telefone vinculado a um Lead.</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <span className="font-bold text-blue-500">
                                                        {stats.total.value > 0 ? ((stats.linkedByPhone.value / stats.total.value) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* COMPARISON INSIGHT */}
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <h4 className="text-sm font-semibold mb-2">📊 Insight Comparativo</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {stats.linkedByPhone.count > stats.linkedById.count ? (
                                                    <>
                                                        Rastrear pelo <strong className="text-blue-500">Telefone</strong> aumenta a rastreabilidade em{' '}
                                                        <strong className="text-emerald-500">{stats.linkedByPhone.count - stats.linkedById.count} negócios</strong>{' '}
                                                        ({formatCurrency(stats.linkedByPhone.value - stats.linkedById.value)} a mais em valor).
                                                    </>
                                                ) : stats.linkedByPhone.count === stats.linkedById.count ? (
                                                    <>Ambos os métodos têm a mesma cobertura. O campo id_lead está bem preenchido!</>
                                                ) : (
                                                    <>
                                                        O campo <strong className="text-primary">id_lead</strong> oferece melhor rastreabilidade neste período.
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="linked">
                            <DealList deals={stats.linkedById.deals} showTimeline />
                        </TabsContent>

                        <TabsContent value="unlinked">
                            <DealList deals={stats.unlinkedById.deals} />
                        </TabsContent>
                    </Tabs>
                </div>
            </TooltipProvider>
        </DashboardLayout>
    );
}

// ========== DEAL LIST WITH PAGINATION ==========
const ITEMS_PER_PAGE = 10;

function DealList({ deals, showTimeline = false }: { deals: SegmentedDeal[], showTimeline?: boolean }) {
    const [selectedDeal, setSelectedDeal] = useState<SegmentedDeal | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(deals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDeals = deals.slice(startIndex, endIndex);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (deals.length === 0) return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                Nenhum registro encontrado para o filtro atual.
            </CardContent>
        </Card>
    );

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Listagem de Negócios</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        Exibindo <span className="font-bold text-foreground">{startIndex + 1}-{Math.min(endIndex, deals.length)}</span> de <span className="font-bold text-foreground">{deals.length}</span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-8">#</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Título</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Valor</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Fonte</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Data Criação</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID Lead</th>
                                    {showTimeline && <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {paginatedDeals.map((deal, index) => (
                                    <tr key={deal.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle text-muted-foreground text-xs">{startIndex + index + 1}</td>
                                        <td className="p-4 align-middle font-medium">{deal.titulo}</td>
                                        <td className="p-4 align-middle text-emerald-500 font-semibold">{formatCurrency(Number(deal.valor))}</td>
                                        <td className="p-4 align-middle">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-muted">
                                                <Tag className="h-3 w-3" /> {deal.fonte}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">{deal.status_nome}</td>
                                        <td className="p-4 align-middle">{format(new Date(deal.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{deal.id_lead || 'N/A'}</td>
                                        {showTimeline && (
                                            <td className="p-4 align-middle text-right">
                                                <button
                                                    onClick={() => setSelectedDeal(deal)}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
                                                >
                                                    Ver Jornada
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                Página {currentPage} de {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                >
                                    Próximo <ChevronRight className="h-4 w-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedDeal && (
                <TimelineSheet deal={selectedDeal} open={!!selectedDeal} onOpenChange={(open) => !open && setSelectedDeal(null)} />
            )}
        </>
    );
}

// ========== TIMELINE SHEET (Enhanced UI/UX) ==========
function TimelineSheet({ deal, open, onOpenChange }: { deal: SegmentedDeal, open: boolean, onOpenChange: (o: boolean) => void }) {
    const [lead, setLead] = useState<BitrixLead | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchMethod, setSearchMethod] = useState<'id' | 'phone' | 'none'>('none');

    useEffect(() => {
        const fetchLead = async () => {
            if (!open) {
                setLead(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setSearchMethod('none');

            try {
                // Strategy 1: Try by id_lead if available
                if (deal?.id_lead) {
                    const leadById = await bitrixService.getLead(deal.id_lead);
                    if (leadById) {
                        setLead(leadById);
                        setSearchMethod('id');
                        setLoading(false);
                        return;
                    }
                }

                // Strategy 2: Try by phone number
                // Use the deal's telefone field to search for the lead
                if (deal?.telefone) {
                    const leadByPhone = await bitrixService.searchLeadByPhone(deal.telefone);
                    if (leadByPhone) {
                        setLead(leadByPhone);
                        setSearchMethod('phone');
                        setLoading(false);
                        return;
                    }
                }

                // No lead found
                setLead(null);
                setSearchMethod('none');
            } catch (error) {
                console.error('Error fetching lead:', error);
                setLead(null);
            } finally {
                setLoading(false);
            }
        };

        fetchLead();
    }, [deal, open]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Determine if source changed during conversion
    const leadSource = lead?.SOURCE_ID || 'Desconhecido';
    const dealSource = deal.fonte || 'Desconhecido';
    const sourceChanged = leadSource !== dealSource && lead;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[540px] overflow-y-auto bg-gradient-to-b from-background to-muted/20">
                <SheetHeader className="mb-6 pb-4 border-b">
                    <SheetTitle className="text-xl flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Jornada do Cliente
                    </SheetTitle>
                    <SheetDescription>Rastreabilidade completa do Lead ao Negócio fechado.</SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* ========== 1. LEAD ORIGIN ========== */}
                    <div className="relative pl-10 pb-6">
                        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-primary to-primary/30" />
                        <div className="absolute left-[-4px] top-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">1</div>

                        <div className="mb-2 text-sm font-bold text-primary flex items-center gap-2">
                            <User className="h-4 w-4" /> Origem (Lead)
                        </div>

                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm p-4 rounded-lg bg-muted/30">
                                <Loader2 className="h-4 w-4 animate-spin" /> Buscando dados no Bitrix...
                            </div>
                        ) : lead ? (
                            <Card className="bg-muted/30 border-primary/20">
                                <CardContent className="p-4 space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-base">{lead.TITLE}</div>
                                        {searchMethod === 'phone' && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-500">
                                                📱 Encontrado por Telefone
                                            </span>
                                        )}
                                        {searchMethod === 'id' && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                                                🔗 Vínculo id_lead
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground text-xs">
                                        <div className="flex items-center gap-1"><span className="opacity-60">Criação:</span></div>
                                        <div className="font-medium text-foreground">{format(new Date(lead.DATE_CREATE), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                                        <div className="flex items-center gap-1"><Tag className="h-3 w-3 opacity-60" /><span className="opacity-60">Fonte:</span></div>
                                        <div className="font-medium text-foreground">{getFriendlySourceName(lead.SOURCE_ID)}</div>
                                        <div className="flex items-center gap-1"><span className="opacity-60">ID Bitrix:</span></div>
                                        <div className="font-mono">{lead.ID}</div>
                                    </div>
                                    <a href={`https://atacadaoled.bitrix24.com.br/crm/lead/details/${lead.ID}/`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                                        <ExternalLink className="h-3 w-3" /> Abrir no Bitrix
                                    </a>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-sm p-4 rounded-lg bg-muted/30 border border-muted">
                                <p className="text-muted-foreground mb-2">
                                    Não foi possível localizar o Lead de origem.
                                </p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    {deal.id_lead && <p>✗ Busca por id_lead ({deal.id_lead}): não encontrado</p>}
                                    {deal.telefone && <p>✗ Busca por telefone ({deal.telefone}): não encontrado</p>}
                                    {!deal.id_lead && !deal.telefone && <p>✗ Negócio sem id_lead e sem telefone (possível parceiro)</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ========== 2. CONVERSION ========== */}
                    <div className="relative pl-10 pb-6">
                        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-primary/30 to-amber-500" />
                        <div className="absolute left-[-4px] top-0 h-6 w-6 rounded-full bg-primary/50 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg">2</div>

                        <div className="mb-2 text-sm font-bold text-foreground flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" /> Conversão
                        </div>
                        <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/20">
                            O lead foi qualificado e convertido em negócio comercial.
                            {sourceChanged && (
                                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs">
                                    <strong>Nota:</strong> A fonte mudou de <strong>{getFriendlySourceName(leadSource)}</strong> → <strong>{dealSource}</strong>.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ========== 3. DEAL GENERATED ========== */}
                    <div className="relative pl-10 pb-6">
                        <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-amber-500 to-emerald-500" />
                        <div className="absolute left-[-4px] top-0 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">3</div>

                        <div className="mb-2 text-sm font-bold text-amber-500 flex items-center gap-2">
                            <Wallet className="h-4 w-4" /> Negócio Gerado
                        </div>
                        <Card className="bg-muted/30 border-amber-500/20">
                            <CardContent className="p-4 space-y-3 text-sm">
                                <div className="font-semibold text-base">{deal.titulo}</div>
                                <div className="text-2xl font-bold text-emerald-500">{formatCurrency(Number(deal.valor))}</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground text-xs">
                                    <div><span className="opacity-60">Criação Deal:</span></div>
                                    <div className="font-medium text-foreground">{format(new Date(deal.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                                    <div className="flex items-center gap-1"><Tag className="h-3 w-3 opacity-60" /><span className="opacity-60">Fonte:</span></div>
                                    <div className="font-medium text-foreground">{deal.fonte}</div>
                                    <div><span className="opacity-60">Responsável:</span></div>
                                    <div className="font-medium text-foreground">{deal.responsavel_nome}</div>
                                    <div><span className="opacity-60">Segmento:</span></div>
                                    <div className="font-medium text-foreground">{deal.segmento}</div>
                                </div>
                                <a href={deal.link_bitrix} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                                    <ExternalLink className="h-3 w-3" /> Abrir Negócio no Bitrix
                                </a>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ========== 4. CLOSING ========== */}
                    <div className="relative pl-10 pb-2">
                        <div className={`absolute left-[-4px] top-0 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${deal.status_nome === 'Ganho' ? 'bg-emerald-500' : deal.status_nome === 'Perdido' ? 'bg-red-500' : 'bg-amber-500'}`}>4</div>

                        <div className={`mb-2 text-sm font-bold flex items-center gap-2 ${deal.status_nome === 'Ganho' ? 'text-emerald-500' : deal.status_nome === 'Perdido' ? 'text-red-500' : 'text-amber-500'}`}>
                            <CheckCircle2 className="h-4 w-4" /> {deal.status_nome === 'Ganho' || deal.status_nome === 'Perdido' ? 'Fechamento' : 'Em Andamento'}
                        </div>
                        {deal.data_fechamento ? (
                            <Card className={`bg-muted/30 ${deal.status_nome === 'Ganho' ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                                <CardContent className="p-4 space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-semibold text-lg ${deal.status_nome === 'Ganho' ? 'text-emerald-500' : 'text-red-500'}`}>{deal.status_nome}</span>
                                        {deal.status_nome === 'Ganho' && (
                                            <span className="text-lg font-bold text-emerald-500">{formatCurrency(Number(deal.valor))}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Data de Fechamento: <span className="font-medium text-foreground">{format(new Date(deal.data_fechamento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                    </div>
                                    {deal.status_nome === 'Perdido' && deal.motivo_perda && (
                                        <div className="text-xs text-red-400 mt-2 p-2 rounded bg-red-500/10">
                                            Motivo da Perda: {deal.motivo_perda}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-sm text-muted-foreground p-4 rounded-lg bg-muted/20">
                                Negócio ainda em andamento. Valor potencial: <strong className="text-amber-500">{formatCurrency(Number(deal.valor))}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
