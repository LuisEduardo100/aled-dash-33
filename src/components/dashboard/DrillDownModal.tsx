import React, { useState, useMemo, useCallback } from 'react';
import { ExternalLink, MessageSquare, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SegmentedLead, SegmentedDeal, DealsByStatus } from '@/types/dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HoverScrollContainer } from './HoverScrollContainer';

const ITEMS_PER_PAGE = 50;

// ========== TYPES ==========
type ModalDataType = 'lead' | 'deal' | 'deal-segmented';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  // For simple lists (leads or single deal array)
  data?: SegmentedLead[] | SegmentedDeal[];
  type?: 'lead' | 'deal';
  // For segmented views with tabs (Varejo, Projeto)
  segmentedData?: DealsByStatus;
  // Show specific columns
  showDiscardReason?: boolean;
  showSource?: boolean;
}

// ========== UTILITY FUNCTIONS ==========
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
};

const isLead = (item: SegmentedLead | SegmentedDeal): item is SegmentedLead => {
  return 'nome' in item && !('valor' in item);
};

// ========== LEAD ROW COMPONENT ==========
const LeadRow = React.memo(({
  lead,
  showDiscardReason,
  showSource,
  index
}: {
  lead: SegmentedLead;
  showDiscardReason: boolean;
  showSource: boolean;
  index: number;
}) => (
  <TableRow className="hover:bg-muted/30 whitespace-nowrap">
    <TableCell className="w-[50px] text-muted-foreground text-center font-mono text-xs">
      {index + 1}
    </TableCell>
    <TableCell className="font-medium max-w-[300px] truncate" title={lead.nome}>{lead.nome}</TableCell>
    <TableCell className="text-muted-foreground">{lead.telefone || '-'}</TableCell>
    <TableCell>{lead.responsavel_nome || '-'}</TableCell>
    {showSource && (
      <TableCell className="text-muted-foreground text-sm">{lead.fonte || '-'}</TableCell>
    )}
    {showDiscardReason && (
      <TableCell className="text-muted-foreground text-sm">{lead.motivo_descarte || '-'}</TableCell>
    )}
    <TableCell className="text-muted-foreground">
      {format(new Date(lead.data_criacao), 'dd/MM/yyyy', { locale: ptBR })}
    </TableCell>
    <TableCell>
      <div className="flex justify-end gap-2">
        {lead.link_kinbox && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(lead.link_kinbox, '_blank')}
            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Kinbox
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(lead.link_bitrix, '_blank')}
          className="h-8 px-2 hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Bitrix
        </Button>
      </div>
    </TableCell>
  </TableRow>
));
LeadRow.displayName = 'LeadRow';

// ========== DEAL ROW COMPONENT ==========
const DealRow = React.memo(({
  deal,
  showSource,
  index
}: {
  deal: SegmentedDeal;
  showSource: boolean;
  index: number;
}) => (
  <TableRow className="hover:bg-muted/30 whitespace-nowrap">
    <TableCell className="w-[50px] text-muted-foreground text-center font-mono text-xs">
      {index + 1}
    </TableCell>
    <TableCell className="font-medium max-w-[300px] truncate" title={deal.titulo}>{deal.titulo}</TableCell>
    <TableCell className="text-foreground font-medium">{formatCurrency(deal.valor)}</TableCell>
    <TableCell>
      <Badge variant={
        deal.status_nome === 'Ganho' ? 'default' :
          deal.status_nome === 'Perdido' ? 'destructive' : 'secondary'
      }>
        {deal.status_nome}
      </Badge>
    </TableCell>
    <TableCell>{deal.responsavel_nome || '-'}</TableCell>
    {showSource && (
      <TableCell className="text-muted-foreground text-sm">{deal.fonte || '-'}</TableCell>
    )}
    <TableCell className="text-muted-foreground">{deal.funil || '-'}</TableCell>
    <TableCell className="text-muted-foreground">{deal.uf || '-'}</TableCell>
    <TableCell className="text-muted-foreground text-sm">
      {deal.status_nome === 'Perdido' ? (deal.motivo_perda || '-') : '-'}
    </TableCell>
    <TableCell className="text-muted-foreground">
      {deal.data_fechamento
        ? format(new Date(deal.data_fechamento), 'dd/MM/yyyy', { locale: ptBR })
        : format(new Date(deal.data_criacao), 'dd/MM/yyyy', { locale: ptBR })
      }
    </TableCell>
    <TableCell>
      <div className="flex justify-end gap-2">
        {deal.link_kinbox && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(deal.link_kinbox, '_blank')}
            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Kinbox
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(deal.link_bitrix, '_blank')}
          className="h-8 px-2 hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          Bitrix
        </Button>
      </div>
    </TableCell>
  </TableRow>
));
DealRow.displayName = 'DealRow';

// ========== LEADS TABLE ==========
const LeadsTable = ({
  leads,
  showDiscardReason,
  showSource,
  displayCount,
  onLoadMore
}: {
  leads: SegmentedLead[];
  showDiscardReason: boolean;
  showSource: boolean;
  displayCount: number;
  onLoadMore: () => void;
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedLeads = useMemo(() => {
    let sortableItems = [...leads];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        switch (sortConfig.key) {
          case 'nome': aValue = a.nome; bValue = b.nome; break;
          case 'telefone': aValue = a.telefone; bValue = b.telefone; break;
          case 'responsavel': aValue = a.responsavel_nome; bValue = b.responsavel_nome; break;
          case 'fonte': aValue = a.fonte; bValue = b.fonte; break;
          case 'motivo': aValue = a.motivo_descarte; bValue = b.motivo_descarte; break;
          case 'data': aValue = a.data_criacao; bValue = b.data_criacao; break;
          default: return 0;
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [leads, sortConfig]);

  const visibleLeads = sortedLeads.slice(0, displayCount);
  const hasMore = displayCount < sortedLeads.length;

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortHead = ({ label, sortKey, className = "" }: { label: string, sortKey: string, className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:text-foreground group ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''} ${className.includes('text-center') ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </TableHead>
  );

  return (
    <>
      <HoverScrollContainer className="rounded-md border">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="bg-muted/50 whitespace-nowrap">
              <TableHead className="w-[50px] text-center">#</TableHead>
              <SortHead label="Nome" sortKey="nome" />
              <SortHead label="Telefone" sortKey="telefone" />
              <SortHead label="Responsável" sortKey="responsavel" />
              {showSource && <SortHead label="Fonte" sortKey="fonte" />}
              {showDiscardReason && <SortHead label="Motivo Descarte" sortKey="motivo" />}
              <SortHead label="Data" sortKey="data" />
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleLeads.map((lead, index) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                index={index}
                showDiscardReason={showDiscardReason}
                showSource={showSource}
              />
            ))}
          </TableBody>
        </Table>
      </HoverScrollContainer>
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={onLoadMore} className="gap-2">
            <ChevronDown className="h-4 w-4" />
            Carregar mais ({leads.length - displayCount} restantes)
          </Button>
        </div>
      )}
    </>
  );
};

// ========== DEALS TABLE ==========
const DealsTable = ({
  deals,
  showSource,
  displayCount,
  onLoadMore
}: {
  deals: SegmentedDeal[];
  showSource: boolean;
  displayCount: number;
  onLoadMore: () => void;
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const sortedDeals = useMemo(() => {
    let sortableItems = [...deals];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        switch (sortConfig.key) {
          case 'titulo': aValue = a.titulo; bValue = b.titulo; break;
          case 'valor': aValue = a.valor; bValue = b.valor; break;
          case 'status': aValue = a.status_nome; bValue = b.status_nome; break;
          case 'responsavel': aValue = a.responsavel_nome; bValue = b.responsavel_nome; break;
          case 'fonte': aValue = a.fonte; bValue = b.fonte; break;
          case 'funil': aValue = a.funil; bValue = b.funil; break;
          case 'uf': aValue = a.uf; bValue = b.uf; break;
          case 'motivo': aValue = a.motivo_perda; bValue = b.motivo_perda; break;
          case 'data': aValue = a.data_fechamento || a.data_criacao; bValue = b.data_fechamento || b.data_criacao; break;
          default: return 0;
        }

        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [deals, sortConfig]);

  const visibleDeals = sortedDeals.slice(0, displayCount);
  const hasMore = displayCount < sortedDeals.length;

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortHead = ({ label, sortKey, className = "" }: { label: string, sortKey: string, className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:text-foreground group ${className}`}
      onClick={() => requestSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : ''} ${className.includes('text-center') ? 'justify-center' : ''}`}>
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </TableHead>
  );

  return (
    <>
      <HoverScrollContainer className="rounded-md border">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow className="bg-muted/50 whitespace-nowrap">
              <TableHead className="w-[50px] text-center">#</TableHead>
              <SortHead label="Título" sortKey="titulo" />
              <SortHead label="Valor" sortKey="valor" />
              <SortHead label="Status" sortKey="status" />
              <SortHead label="Responsável" sortKey="responsavel" />
              {showSource && <SortHead label="Fonte" sortKey="fonte" />}
              <SortHead label="Funil" sortKey="funil" />
              <SortHead label="UF" sortKey="uf" />
              <SortHead label="Motivo Perda" sortKey="motivo" />
              <SortHead label="Data" sortKey="data" />
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDeals.map((deal, index) => (
              <DealRow
                key={deal.id}
                deal={deal}
                index={index}
                showSource={showSource}
              />
            ))}
          </TableBody>
        </Table>
      </HoverScrollContainer>
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button variant="outline" onClick={onLoadMore} className="gap-2">
            <ChevronDown className="h-4 w-4" />
            Carregar mais ({deals.length - displayCount} restantes)
          </Button>
        </div>
      )}
    </>
  );
};

// ========== MAIN COMPONENT ==========
export function DrillDownModal({
  isOpen,
  onClose,
  title,
  data,
  type = 'lead',
  segmentedData,
  showDiscardReason = false,
  showSource = true,
}: DrillDownModalProps) {
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [activeTab, setActiveTab] = useState<'ganhos' | 'andamento' | 'perdidos'>('ganhos');

  // Reset pagination when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDisplayCount(ITEMS_PER_PAGE);
      setActiveTab('ganhos');
    }
  }, [isOpen, data, segmentedData]);

  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  }, []);

  // Calculate total count for badge
  const totalCount = useMemo(() => {
    if (segmentedData) {
      return segmentedData.ganhos.length + segmentedData.andamento.length + segmentedData.perdidos.length;
    }
    return data?.length || 0;
  }, [data, segmentedData]);

  // Get current tab data
  const currentTabData = useMemo(() => {
    if (!segmentedData) return [];
    return segmentedData[activeTab];
  }, [segmentedData, activeTab]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary">{totalCount} registros</Badge>
          </DialogTitle>
          <div className="hidden" id="dialog-description">
            Detalhes da lista selecionada, incluindo informações de leads e negócios.
          </div>
        </DialogHeader>

        <div className="h-[65vh] overflow-y-auto overflow-x-hidden">
          {/* Segmented View with Tabs */}
          {segmentedData ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="ganhos" className="gap-2">
                  Ganhos
                  <Badge variant="outline" className="ml-1">{segmentedData.ganhos.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="andamento" className="gap-2">
                  Em Andamento
                  <Badge variant="outline" className="ml-1">{segmentedData.andamento.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="perdidos" className="gap-2">
                  Perdidos
                  <Badge variant="outline" className="ml-1">{segmentedData.perdidos.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ganhos">
                <DealsTable
                  deals={segmentedData.ganhos}
                  showSource={showSource}
                  displayCount={displayCount}
                  onLoadMore={loadMore}
                />
              </TabsContent>
              <TabsContent value="andamento">
                <DealsTable
                  deals={segmentedData.andamento}
                  showSource={showSource}
                  displayCount={displayCount}
                  onLoadMore={loadMore}
                />
              </TabsContent>
              <TabsContent value="perdidos">
                <DealsTable
                  deals={segmentedData.perdidos}
                  showSource={showSource}
                  displayCount={displayCount}
                  onLoadMore={loadMore}
                />
              </TabsContent>
            </Tabs>
          ) : (
            /* Simple List View */
            type === 'lead' ? (
              <LeadsTable
                leads={(data as SegmentedLead[]) || []}
                showDiscardReason={showDiscardReason}
                showSource={showSource}
                displayCount={displayCount}
                onLoadMore={loadMore}
              />
            ) : (
              <DealsTable
                deals={(data as SegmentedDeal[]) || []}
                showSource={showSource}
                displayCount={displayCount}
                onLoadMore={loadMore}
              />
            )
          )}

          {/* Empty State */}
          {!segmentedData && (!data || data.length === 0) && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhum registro encontrado
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DrillDownModal;
