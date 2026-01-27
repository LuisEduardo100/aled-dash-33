import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { useFilteredDashboard } from '@/hooks/useFilteredDashboard';
import { DateFilter, SegmentedDeal } from '@/types/dashboard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link2, Link2Off, Wallet, Loader2, User, ArrowRight, CheckCircle2, HelpCircle, TrendingUp, DollarSign, Users, ChevronLeft, ChevronRight, ExternalLink, Tag, Search, ArrowUpDown, ScanSearch, AlertCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { bitrixService, BitrixLead } from '@/services/bitrixService';
import { getFriendlySourceName } from '@/utils/sourceMapping';
import { LeadToCloseTimeChart } from '@/components/dashboard/LeadToCloseTimeChart';
import { HoverScrollContainer } from '@/components/dashboard/HoverScrollContainer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LeadConversionReport() {
    const [dateFilter, setDateFilter] = useState<DateFilter>({
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
    });
    const [sourceFilter, setSourceFilter] = useState('Todos');
    const [ufFilter, setUfFilter] = useState('Todos');
    const [timeRangeModalData, setTimeRangeModalData] = useState<{ range: string; deals: SegmentedDeal[] } | null>(null);
    const [selectedAuditDeal, setSelectedAuditDeal] = useState<{ deal: SegmentedDeal, type: 'lead' | 'deal' } | null>(null);

    // Cache key for localStorage (based on date range for freshness)
    const cacheKey = useMemo(() => {
        const start = dateFilter.startDate ? format(dateFilter.startDate, 'yyyy-MM-dd') : '';
        const end = dateFilter.endDate ? format(dateFilter.endDate, 'yyyy-MM-dd') : '';
        return `deepLinkedDeals_${start}_${end}`;
    }, [dateFilter]);

    // Deep Scan State - Initialize from localStorage cache for instant display
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [deepLinkedDeals, setDeepLinkedDeals] = useState<Set<string>>(() => {
        // Load from cache immediately on mount
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                console.log(`[Cache] Loaded ${parsed.length} cached deep-linked deals`);
                return new Set(parsed);
            }
        } catch (e) {
            console.warn('[Cache] Failed to load cache:', e);
        }
        return new Set();
    });
    const [scanResult, setScanResult] = useState<{ found: number, total: number } | null>(null);
    const [hasAutoScanned, setHasAutoScanned] = useState(false); // Track if auto-scan has run

    const {
        leads,
        deals,
        availableSources,
        availableUfs,
        isLoading,
        isSyncing,
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
                if (entry.VALUE && isLikelyPhone(entry.VALUE)) {
                    phones.push(normalizePhone(entry.VALUE));
                }
                // Check VALUE_TYPE field (sometimes phone is here due to data inversion)
                if (entry.VALUE_TYPE && isLikelyPhone(entry.VALUE_TYPE)) {
                    phones.push(normalizePhone(entry.VALUE_TYPE));
                }
            });
        }

        // 3. Check custom lead phone field
        if (lead.UF_CRM_1763496046795 && isLikelyPhone(lead.UF_CRM_1763496046795)) {
            phones.push(normalizePhone(lead.UF_CRM_1763496046795));
        }

        return phones.filter(p => p.length >= 10);
    };

    // Extract ALL phone numbers from a deal (returns array)
    const extractPhonesFromDeal = (deal: any): string[] => {
        const phones: string[] = [];
        const seen = new Set<string>();

        const addPhone = (value: string | undefined | null) => {
            if (value && isLikelyPhone(value)) {
                const normalized = normalizePhone(value);
                if (normalized.length >= 10 && !seen.has(normalized)) {
                    phones.push(normalized);
                    seen.add(normalized);
                }
            }
        };

        // 1. Check simple telefone field
        addPhone(deal.telefone);

        // 2. Check custom deal phone field (UF_CRM_1731350457664 = [ALED] Contato do Cliente)
        addPhone(deal.UF_CRM_1731350457664);

        // 3. Check PHONE array (Bitrix format, if present)
        if (Array.isArray(deal.PHONE)) {
            deal.PHONE.forEach((entry: any) => {
                addPhone(entry.VALUE);
                addPhone(entry.VALUE_TYPE); // Sometimes data is inverted
            });
        }

        // 4. Check contact_phone if present
        addPhone(deal.contact_phone);
        addPhone(deal.contato_telefone);

        return phones;
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

    // Helper to find phones in any object structure (for Deep Scan)
    const findPhonesInObject = (obj: any): string[] => {
        const phones: string[] = [];
        const seen = new Set<string>();

        const recurse = (current: any) => {
            if (!current) return;
            if (typeof current === 'string') {
                // Check if looks like phone
                const cleaned = current.replace(/\D/g, '');
                if (cleaned.length >= 10 && cleaned.length <= 15) {
                    const normalized = normalizePhone(current);
                    if (!seen.has(normalized)) {
                        phones.push(normalized);
                        seen.add(normalized);
                    }
                }
            } else if (typeof current === 'object') {
                Object.values(current).forEach(val => recurse(val));
            }
        };

        recurse(obj);
        return phones;
    };

    const handleDeepScan = async () => {
        if (!stats.unlinkedById.deals.length) return;

        setIsScanning(true);
        setScanProgress(0);
        setScanResult(null);
        let foundCount = 0;
        const newDeepLinks = new Set<string>(deepLinkedDeals);

        const dealsToScan = stats.unlinkedById.deals; // Scan all unlinked
        const total = dealsToScan.length;

        console.log(`[Deep Scan] Starting scan of ${total} unlinked deals...`);

        // Process in batches to avoid browser freeze
        for (let i = 0; i < total; i++) {
            const deal = dealsToScan[i];
            setScanProgress(Math.round(((i + 1) / total) * 100));

            try {
                // Fetch full deal from Bitrix to get all fields including custom ones
                const bitrixDeal = await bitrixService.getDeal(deal.id);

                if (bitrixDeal) {
                    // Extract all possible phones from the deal using enhanced function
                    const dealPhones = extractPhonesFromDeal(bitrixDeal);

                    // Also find phones recursively in case there are hidden fields
                    const recursivePhones = findPhonesInObject(bitrixDeal);

                    // Combine and deduplicate
                    const allPhones = [...new Set([...dealPhones, ...recursivePhones])];

                    console.log(`[Deep Scan] Deal ${deal.id}: Found ${allPhones.length} phones:`, allPhones);

                    // STRATEGY 1: Check against local leadPhoneSet
                    let hasMatch = allPhones.some(phone => leadPhoneSet.has(phone));

                    // STRATEGY 2: If no local match, try searching Bitrix directly using the custom field
                    if (!hasMatch && allPhones.length > 0) {
                        console.log(`[Deep Scan] Deal ${deal.id}: No local match, trying Bitrix search...`);

                        for (const phone of allPhones) {
                            try {
                                const foundLead = await bitrixService.searchLeadByPhone(phone);
                                if (foundLead) {
                                    console.log(`[Deep Scan] Deal ${deal.id}: Found lead via Bitrix search!`, foundLead.ID);
                                    hasMatch = true;
                                    break;
                                }
                            } catch (searchErr) {
                                console.warn(`[Deep Scan] Bitrix search error for phone ${phone}:`, searchErr);
                            }
                        }
                    }

                    if (hasMatch) {
                        newDeepLinks.add(deal.id);
                        foundCount++;
                        console.log(`[Deep Scan] Deal ${deal.id}: MATCHED! Total found: ${foundCount}`);
                    }
                }
            } catch (err) {
                console.error(`[Deep Scan] Error scanning deal ${deal.id}`, err);
            }

            // Small delay to let UI breathe and avoid API rate limiting
            if (i % 3 === 0) await new Promise(r => setTimeout(r, 50));
        }

        console.log(`[Deep Scan] Complete! Found ${foundCount} of ${total} deals.`);
        setDeepLinkedDeals(newDeepLinks);
        setScanResult({ found: foundCount, total });
        setIsScanning(false);
    };

    const stats = useMemo(() => {
        // By ID_LEAD
        const linkedByIdDeals = allDeals.filter(d => !!d.id_lead);
        const unlinkedByIdDeals = allDeals.filter(d => !d.id_lead);

        // DEBUG: Log phone matching info
        console.log('[Phone Matching] Lead phones available:', leadPhoneSet.size);
        console.log('[Phone Matching] Deep linked deals:', deepLinkedDeals.size);

        // Sample some deals to debug
        if (allDeals.length > 0) {
            const sampleDeal = allDeals[0];
            const samplePhones = extractPhonesFromDeal(sampleDeal);
            console.log('[Phone Matching] Sample deal:', sampleDeal.id, 'telefone:', sampleDeal.telefone, 'extracted phones:', samplePhones);
        }

        // By Contact (Phone) - check if ANY deal phone matches ANY lead phone
        // OR if the deal was found via Deep Scan (in deepLinkedDeals set)
        const linkedByPhoneDeals = allDeals.filter(d => {
            // First check if found via Deep Scan
            if (deepLinkedDeals.has(d.id)) return true;
            // Then check local phone match
            const dealPhones = extractPhonesFromDeal(d);
            const hasMatch = dealPhones.some(phone => leadPhoneSet.has(phone));
            if (hasMatch) {
                console.log('[Phone Matching] MATCH found for deal:', d.id, 'phones:', dealPhones);
            }
            return hasMatch;
        });
        const unlinkedByPhoneDeals = allDeals.filter(d => {
            // Exclude if found via Deep Scan
            if (deepLinkedDeals.has(d.id)) return false;
            // Then check local phone match
            const dealPhones = extractPhonesFromDeal(d);
            return dealPhones.length === 0 || !dealPhones.some(phone => leadPhoneSet.has(phone));
        });

        console.log('[Phone Matching] Results - Linked by phone:', linkedByPhoneDeals.length, 'Unlinked by phone:', unlinkedByPhoneDeals.length);

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
            // By Contact (Phone) - Now includes Deep Scan results
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
    }, [allDeals, deals.por_status.ganhos, leadPhoneSet, deepLinkedDeals]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Auto-scan on data load: Automatically run phone matching when data loads
    useEffect(() => {
        // Only run if: data loaded, has unlinked deals, hasn't auto-scanned yet, and not currently scanning
        const unlinkedCount = allDeals.filter(d => !d.id_lead).length;

        if (!isLoading && unlinkedCount > 0 && !hasAutoScanned && !isScanning && leadPhoneSet.size > 0) {
            console.log('[Auto-Scan] Starting automatic phone matching scan...');
            setHasAutoScanned(true);

            // Run the scan in background
            (async () => {
                setIsScanning(true);
                setScanProgress(0);
                let foundCount = 0;
                const newDeepLinks = new Set<string>();

                // Only scan deals that:
                // 1. Don't have id_lead
                // 2. Weren't already matched by local phone check
                const dealsToScan = allDeals.filter(d => {
                    if (d.id_lead) return false; // Already linked by ID
                    const dealPhones = extractPhonesFromDeal(d);
                    const hasLocalMatch = dealPhones.some(phone => leadPhoneSet.has(phone));
                    if (hasLocalMatch) {
                        // Already matched locally, no need for Bitrix search
                        return false;
                    }
                    return true; // Needs Bitrix search
                });

                const total = dealsToScan.length;
                console.log(`[Auto-Scan] Scanning ${total} deals that need Bitrix lookup...`);

                // Process in smaller batches to avoid API overload
                const BATCH_SIZE = 5;
                const DELAY_BETWEEN_BATCHES = 500; // 500ms between batches
                const DELAY_BETWEEN_CALLS = 100; // 100ms between individual calls

                for (let i = 0; i < total; i++) {
                    const deal = dealsToScan[i];
                    setScanProgress(Math.round(((i + 1) / total) * 100));

                    try {
                        // Try to get phones from deal in initial payload first
                        let allPhones = extractPhonesFromDeal(deal);

                        // Only fetch from Bitrix if we don't have phones in payload
                        if (allPhones.length === 0) {
                            try {
                                const bitrixDeal = await bitrixService.getDeal(deal.id);
                                if (bitrixDeal) {
                                    allPhones = [...extractPhonesFromDeal(bitrixDeal), ...findPhonesInObject(bitrixDeal)];
                                }
                            } catch {
                                // Skip this deal if fetch fails
                                continue;
                            }
                        }

                        // Search for lead in Bitrix using deal's phone(s)
                        if (allPhones.length > 0) {
                            // Only try first phone to reduce API calls
                            const phone = allPhones[0];
                            try {
                                const foundLead = await bitrixService.searchLeadByPhone(phone);
                                if (foundLead) {
                                    newDeepLinks.add(deal.id);
                                    foundCount++;
                                    console.log(`[Auto-Scan] Deal ${deal.id}: Found lead via Bitrix!`);
                                }
                            } catch {
                                // Ignore search errors, continue to next deal
                            }
                        }
                    } catch (err) {
                        // Silent fail - continue scanning
                    }

                    // Rate limiting
                    await new Promise(r => setTimeout(r, DELAY_BETWEEN_CALLS));

                    // Extra delay every batch
                    if ((i + 1) % BATCH_SIZE === 0) {
                        await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
                    }
                }

                console.log(`[Auto-Scan] Complete! Found ${foundCount} of ${total} deals.`);
                setDeepLinkedDeals(newDeepLinks);
                setScanResult({ found: foundCount, total });
                setIsScanning(false);

                // Save to localStorage for instant load next time
                try {
                    localStorage.setItem(cacheKey, JSON.stringify([...newDeepLinks]));
                    console.log(`[Cache] Saved ${newDeepLinks.size} deep-linked deals to cache`);
                } catch (e) {
                    console.warn('[Cache] Failed to save cache:', e);
                }
            })();
        }
    }, [isLoading, allDeals.length, hasAutoScanned, isScanning, leadPhoneSet.size, cacheKey]);

    // Reset scan state when date filter changes (so new scan runs)
    useEffect(() => {
        // When date filter changes, check if we have cached data for this range
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                setDeepLinkedDeals(new Set(parsed));
                setHasAutoScanned(true); // Don't re-scan if we have cache
                console.log(`[Cache] Loaded ${parsed.length} deals from cache for new date range`);
            } else {
                setDeepLinkedDeals(new Set());
                setHasAutoScanned(false); // Trigger new scan
            }
        } catch {
            setDeepLinkedDeals(new Set());
            setHasAutoScanned(false);
        }
    }, [cacheKey]);

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
    // Correção: Usar o total de negócios (stats.total.count) para o cálculo ficar coerente com o número exibido no card
    const conversionRate = totalLeads > 0 ? ((stats.total.count / totalLeads) * 100).toFixed(1) : '0';
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
                            isSyncing={isSyncing}
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
                                <div className="flex-1 text-center p-6 rounded-xl bg-blue-500/10 border border-blue-500/30 relative">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="absolute top-2 right-2 text-blue-500/60 hover:text-blue-500 transition-colors">
                                                <HelpCircle className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs bg-popover text-popover-foreground p-3">
                                            <p className="font-semibold mb-1">Leads Captados</p>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Volume total de leads que entraram no CRM dentro do <strong>período selecionado</strong> no filtro de data.
                                            </p>
                                            <ul className="text-xs list-disc pl-4 space-y-1 text-muted-foreground">
                                                <li>Inclui todos os status (Em atendimento, Convertidos, Descartados).</li>
                                                <li>Reflete o esforço de marketing/aquisição no período.</li>
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                                    <div className="text-3xl font-bold text-blue-500">{totalLeads}</div>
                                    <div className="text-sm text-muted-foreground">Leads Captados</div>
                                </div>

                                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                                <div className="md:hidden text-xs text-muted-foreground">↓ {conversionRate}% converteram</div>

                                {/* Stage 2: Converted to Deals */}
                                <div className="flex-1 text-center p-6 rounded-xl bg-amber-500/10 border border-amber-500/30 relative">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="absolute top-2 right-2 text-amber-500/60 hover:text-amber-500 transition-colors">
                                                <HelpCircle className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs bg-popover text-popover-foreground p-3">
                                            <p className="font-semibold mb-1">Negócios Gerados</p>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Volume total de negócios (Deals) criados no CRM dentro do <strong>período selecionado</strong>.
                                            </p>
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <p>
                                                    <strong>Sobre a porcentagem ({conversionRate}%):</strong><br />
                                                    Representa a eficiência bruta de criação de negócios em relação aos leads captados ({stats.total.count} ÷ {totalLeads}).
                                                </p>
                                                <p className="italic border-l-2 border-primary/30 pl-2">
                                                    Nota: Este número pode incluir negócios criados manualmente sem lead prévio, por isso a taxa serve como um indicador macro de volume.
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Wallet className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                                    <div className="text-3xl font-bold text-amber-500">{stats.total.count}</div>
                                    <div className="text-sm text-muted-foreground">Negócios Gerados</div>
                                    <div className="text-xs text-muted-foreground mt-1">{conversionRate}% dos Leads</div>
                                </div>

                                <ArrowRight className="h-6 w-6 text-muted-foreground hidden md:block" />
                                <div className="md:hidden text-xs text-muted-foreground">↓ {wonRate}% fecharam</div>

                                {/* Stage 3: Won Deals / Revenue */}
                                <div className="flex-1 text-center p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 relative">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="absolute top-2 right-2 text-emerald-500/60 hover:text-emerald-500 transition-colors">
                                                <HelpCircle className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs bg-popover text-popover-foreground p-3">
                                            <p className="font-semibold mb-1">Receita Fechada</p>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Soma do valor de todos os negócios marcados como "Ganho" dentro do período.
                                            </p>
                                            <div className="space-y-2 text-xs text-muted-foreground">
                                                <p>
                                                    <strong>Taxa de Fechamento ({wonRate}%):</strong><br />
                                                    De cada 100 negócios criados, quantos foram ganhos ({stats.won.count} de {stats.total.count}).
                                                </p>
                                                <p>
                                                    Isso mostra a eficiência comercial em transformar oportunidades (deals) em dinheiro no caixa.
                                                </p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                    <DollarSign className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                                    <div className="text-3xl font-bold text-emerald-500">{formatCurrency(stats.won.value)}</div>
                                    <div className="text-sm text-muted-foreground">Receita Fechada</div>
                                    <div className="text-xs text-muted-foreground mt-1">{stats.won.count} negócios ({wonRate}%)</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ========== LEAD TO CLOSE TIME CHART ========== */}
                    <LeadToCloseTimeChart
                        deals={allDeals}
                        onBarClick={(range, rangeDeals) => {
                            // Open a modal or sheet with the deals from this time range
                            setTimeRangeModalData({ range, deals: rangeDeals });
                        }}
                        onDealClick={(deal, type) => {
                            setSelectedAuditDeal({ deal, type });
                        }}
                    />

                    {/* Single Deal Audit Modal */}
                    {selectedAuditDeal && (
                        <Sheet open={!!selectedAuditDeal} onOpenChange={(open) => !open && setSelectedAuditDeal(null)}>
                            <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                                <SheetHeader className="mb-4">
                                    <SheetTitle className="flex items-center gap-2">
                                        {selectedAuditDeal.type === 'fastest' ? (
                                            <span className="text-emerald-500">⚡ Negócio Mais Rápido</span>
                                        ) : (
                                            <span className="text-amber-500">🐢 Negócio Mais Lento</span>
                                        )}
                                    </SheetTitle>
                                    <SheetDescription>
                                        Auditoria de tempo de fechamento
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-4">
                                    {/* Deal Title */}
                                    <div className="p-4 rounded-lg bg-muted/30 border">
                                        <div className="text-sm text-muted-foreground">Título do Negócio</div>
                                        <div className="text-lg font-semibold">{selectedAuditDeal.deal.titulo}</div>
                                    </div>

                                    {/* Value */}
                                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="text-sm text-muted-foreground">Valor</div>
                                        <div className="text-2xl font-bold text-emerald-500">
                                            {formatCurrency(Number(selectedAuditDeal.deal.valor))}
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <div className="text-sm text-muted-foreground">Data Criação</div>
                                            <div className="font-medium">
                                                {format(new Date(selectedAuditDeal.deal.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <div className="text-sm text-muted-foreground">Data Fechamento</div>
                                            <div className="font-medium">
                                                {selectedAuditDeal.deal.data_fechamento
                                                    ? format(new Date(selectedAuditDeal.deal.data_fechamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                                                    : 'N/A'
                                                }
                                            </div>
                                        </div>
                                    </div>

                                    {/* Other Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <div className="text-sm text-muted-foreground">Fonte</div>
                                            <div className="font-medium">{selectedAuditDeal.deal.fonte}</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <div className="text-sm text-muted-foreground">Responsável</div>
                                            <div className="font-medium">{selectedAuditDeal.deal.responsavel_nome}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <div className="text-sm text-muted-foreground">ID do Negócio</div>
                                            <div className="font-mono text-sm">{selectedAuditDeal.deal.id}</div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/30 border">
                                            <div className="text-sm text-muted-foreground">ID do Lead</div>
                                            <div className="font-mono text-sm">{selectedAuditDeal.deal.id_lead || 'N/A'}</div>
                                        </div>
                                    </div>

                                    {/* Bitrix Link */}
                                    {selectedAuditDeal.deal.link_bitrix && (
                                        <a
                                            href={selectedAuditDeal.deal.link_bitrix}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Abrir no Bitrix
                                        </a>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Time Range Deals Modal */}
                    {timeRangeModalData && (
                        <Sheet open={!!timeRangeModalData} onOpenChange={(open) => !open && setTimeRangeModalData(null)}>
                            <SheetContent className="sm:max-w-[700px] overflow-y-auto">
                                <SheetHeader className="mb-4">
                                    <SheetTitle>Negócios Fechados: {timeRangeModalData.range}</SheetTitle>
                                    <SheetDescription>
                                        {timeRangeModalData.deals.length} negócios fecharam neste período
                                    </SheetDescription>
                                </SheetHeader>
                                <DealList deals={timeRangeModalData.deals} showTimeline />
                            </SheetContent>
                        </Sheet>
                    )}

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

                        <TabsContent value="unlinked" className="space-y-4">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                                <Link2Off className="h-4 w-4 text-amber-500" /> Deals Sem Vínculo Direto
                                            </CardTitle>
                                            <CardDescription>
                                                Lista de negócios onde o campo <code>id_lead</code> está vazio e/ou o telefone padrão não bateu.
                                            </CardDescription>
                                        </div>
                                        {!isScanning && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDeepScan}
                                                className="gap-2 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-600"
                                            >
                                                <ScanSearch className="h-4 w-4" />
                                                Buscar Vínculos no Bitrix (Deep Scan)
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isScanning && (
                                        <div className="mb-4 space-y-2">
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Auditando negócios no Bitrix... Isso pode levar alguns segundos.</span>
                                                <span>{scanProgress}%</span>
                                            </div>
                                            <Progress value={scanProgress} className="h-2" />
                                        </div>
                                    )}

                                    {scanResult && (
                                        <Alert className="mb-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <AlertTitle>Varredura Concluída!</AlertTitle>
                                            <AlertDescription>
                                                Encontramos <strong>{scanResult.found}</strong> novos vínculos analisando campos customizados do Bitrix.
                                                Esses negócios agora estão marcados na lista abaixo.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <DealList
                                        deals={stats.unlinkedById.deals}
                                        highlightIds={deepLinkedDeals}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </TooltipProvider>
        </DashboardLayout>
    );
}

// ========== DEAL LIST WITH PAGINATION, SEARCH, AND SORTABLE HEADERS ==========
const ITEMS_PER_PAGE = 10;

type SortKey = 'titulo' | 'valor' | 'fonte' | 'status_nome' | 'data_criacao' | 'id_lead';
type SortDirection = 'asc' | 'desc';

interface DealListProps {
    deals: SegmentedDeal[];
    showTimeline?: boolean;
    highlightIds?: Set<string>; // IDs to highlight as found via Deep Scan
}

const DealList = ({ deals, showTimeline = false, highlightIds }: DealListProps) => {
    const [selectedDeal, setSelectedDeal] = useState<SegmentedDeal | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'data_criacao', direction: 'desc' });

    // Filter by search
    const filteredDeals = useMemo(() => {
        if (!searchQuery.trim()) return deals;
        const query = searchQuery.toLowerCase();
        return deals.filter(deal =>
            deal.titulo?.toLowerCase().includes(query) ||
            deal.id?.toString().includes(query) ||
            deal.id_lead?.toString().includes(query) ||
            deal.fonte?.toLowerCase().includes(query)
        );
    }, [deals, searchQuery]);

    // Sort deals
    const sortedDeals = useMemo(() => {
        const sorted = [...filteredDeals];
        sorted.sort((a, b) => {
            let valA: any = a[sortConfig.key];
            let valB: any = b[sortConfig.key];

            // Handle dates
            if (sortConfig.key === 'data_criacao') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            // Handle numbers
            if (sortConfig.key === 'valor') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            }

            // Handle nulls
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            // String comparison
            if (typeof valA === 'string' && typeof valB === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredDeals, sortConfig]);

    const totalPages = Math.ceil(sortedDeals.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedDeals = sortedDeals.slice(startIndex, endIndex);

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const SortableHeader = ({ label, sortKey, className = '' }: { label: string; sortKey: SortKey; className?: string }) => (
        <th
            className={`h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground group ${className}`}
            onClick={() => handleSort(sortKey)}
        >
            <div className="flex items-center gap-1">
                {label}
                <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig.key === sortKey ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-50'}`} />
            </div>
        </th>
    );

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

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
                <CardHeader className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>Listagem de Negócios</CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Exibindo <span className="font-bold text-foreground">{startIndex + 1}-{Math.min(endIndex, sortedDeals.length)}</span> de <span className="font-bold text-foreground">{sortedDeals.length}</span>
                        </div>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, ID ou fonte..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <HoverScrollContainer>
                        <table className="w-full caption-bottom text-sm text-left min-w-[900px]">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-8">#</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-8"></th> {/* Status Icon */}
                                    <SortableHeader label="Título" sortKey="titulo" />
                                    <SortableHeader label="Valor" sortKey="valor" />
                                    <SortableHeader label="Fonte" sortKey="fonte" />
                                    <SortableHeader label="Status" sortKey="status_nome" />
                                    <SortableHeader label="Data Criação" sortKey="data_criacao" />
                                    <SortableHeader label="ID Lead" sortKey="id_lead" />
                                    {showTimeline && <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Ações</th>}
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {paginatedDeals.map((deal, index) => {
                                    const isDeepLinked = highlightIds?.has(deal.id);

                                    return (
                                        <tr key={deal.id} className={`border-b transition-colors hover:bg-muted/50 ${isDeepLinked ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : ''}`}>
                                            <td className="p-4 align-middle text-muted-foreground text-xs">{startIndex + index + 1}</td>
                                            <td className="p-4 align-middle">
                                                {isDeepLinked && (
                                                    <Tooltip>
                                                        <TooltipTrigger>
                                                            <Link2 className="h-4 w-4 text-emerald-500 animate-pulse" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Vínculo encontrado via Deep Scan!
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle font-medium">
                                                {deal.titulo}
                                                {isDeepLinked && <span className="ml-2 text-xs font-normal text-emerald-600">(Vínculo Detectado)</span>}
                                            </td>
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
                                    )
                                })}
                            </tbody>
                        </table>
                    </HoverScrollContainer>

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
