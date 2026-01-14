import { ExternalLink, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CRMLead, CRMDeal, getLeadStatusInfo, getDealCategory, getSourceAttribution } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: (CRMLead | CRMDeal)[];
  type: 'lead' | 'deal';
  showDiscardReason?: boolean;
  showSource?: boolean;
}

export function DrillDownModal({ 
  isOpen, 
  onClose, 
  title, 
  data, 
  type,
  showDiscardReason = false,
  showSource = false,
}: DrillDownModalProps) {
  const isLead = (item: CRMLead | CRMDeal): item is CRMLead => {
    return 'status_id' in item;
  };

  const openKinbox = (url: string) => {
    window.open(url, '_blank');
  };

  const openBitrix = (id: string, itemType: 'lead' | 'deal') => {
    const path = itemType === 'lead' ? 'lead' : 'deal';
    window.open(`https://aled.bitrix24.com.br/crm/${path}/details/${id}/`, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <Badge variant="secondary">{data.length} registros</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>{type === 'lead' ? 'Telefone' : 'Valor'}</TableHead>
                <TableHead>{type === 'lead' ? 'Status' : 'Categoria'}</TableHead>
                {showSource && <TableHead>Fonte</TableHead>}
                {showDiscardReason && <TableHead>Motivo Descarte</TableHead>}
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>
                    {isLead(item) 
                      ? (item.phone || '-') 
                      : formatCurrency((item as CRMDeal).opportunity)
                    }
                  </TableCell>
                  <TableCell>
                    {isLead(item) ? (
                      <Badge variant={
                        item.status_id === 'CONVERTED' ? 'default' :
                        item.status_id === 'JUNK' ? 'destructive' : 'secondary'
                      }>
                        {getLeadStatusInfo(item.status_id).label}
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        {getDealCategory((item as CRMDeal).category_id)}
                      </Badge>
                    )}
                  </TableCell>
                  {showSource && (
                    <TableCell className="text-muted-foreground text-sm">
                      {isLead(item) 
                        ? getSourceAttribution(item.source_id)
                        : (item as CRMDeal).source_id ? getSourceAttribution((item as CRMDeal).source_id!) : '-'
                      }
                    </TableCell>
                  )}
                  {showDiscardReason && isLead(item) && (
                    <TableCell className="text-muted-foreground text-sm">
                      {item.discard_reason || '-'}
                    </TableCell>
                  )}
                  {showDiscardReason && !isLead(item) && (
                    <TableCell>-</TableCell>
                  )}
                  <TableCell className="text-muted-foreground">
                    {format(new Date(item.date_create), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openKinbox(item.kinbox_url)}
                        className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Kinbox
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openBitrix(item.id, type)}
                        className="h-8 px-2 hover:bg-accent"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Bitrix
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
