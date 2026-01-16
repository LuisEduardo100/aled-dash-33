import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { RawLead, RawDeal } from '@/types/dashboard';

interface DataListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: (RawLead | RawDeal)[];
    type: 'lead' | 'deal';
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

export const DataListModal: React.FC<DataListModalProps> = ({
    isOpen,
    onClose,
    title,
    data,
    type,
}) => {
    const isLead = type === 'lead';
    const [sortConfig, setSortConfig] = React.useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const sortedData = React.useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (isLead) {
                    const leadA = a as RawLead;
                    const leadB = b as RawLead;
                    switch (sortConfig.key) {
                        case 'nome': aValue = leadA.nome; bValue = leadB.nome; break;
                        case 'status': aValue = leadA.status; bValue = leadB.status; break;
                        case 'fonte': aValue = leadA.fonte; bValue = leadB.fonte; break;
                        case 'data': aValue = leadA.data_criacao; bValue = leadB.data_criacao; break;
                        default: return 0;
                    }
                } else {
                    const dealA = a as RawDeal;
                    const dealB = b as RawDeal;
                    switch (sortConfig.key) {
                        case 'titulo': aValue = dealA.titulo; bValue = dealB.titulo; break;
                        case 'valor': aValue = dealA.valor; bValue = dealB.valor; break;
                        case 'uf': aValue = dealA.uf; bValue = dealB.uf; break;
                        case 'data': aValue = dealA.data_fechamento || dealA.data_criacao; bValue = dealB.data_fechamento || dealB.data_criacao; break;
                        default: return 0;
                    }
                }

                if (aValue === undefined || aValue === null) return 1;
                if (bValue === undefined || bValue === null) return -1;

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig, isLead]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-50" />;
        return (
            <span className="ml-1 text-xs">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
        );
    };

    const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
        <TableHead
            className="text-gray-400 cursor-pointer hover:text-white transition-colors group"
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center">
                {label}
                <SortIcon columnKey={sortKey} />
            </div>
        </TableHead>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto bg-gray-900 border-gray-700">
                <DialogHeader>
                    <DialogTitle className="text-white">{title}</DialogTitle>
                </DialogHeader>

                <div className="text-sm text-gray-400 mb-4">
                    {data.length} {isLead ? 'leads' : 'negócios'} encontrados
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-gray-700">
                            {isLead ? (
                                <>
                                    <SortableHeader label="Nome" sortKey="nome" />
                                    <SortableHeader label="Status" sortKey="status" />
                                    <SortableHeader label="Fonte" sortKey="fonte" />
                                    <SortableHeader label="Data" sortKey="data" />
                                    <TableHead className="text-gray-400">Ações</TableHead>
                                </>
                            ) : (
                                <>
                                    <SortableHeader label="Título" sortKey="titulo" />
                                    <SortableHeader label="Valor" sortKey="valor" />
                                    <SortableHeader label="UF" sortKey="uf" />
                                    <SortableHeader label="Data" sortKey="data" />
                                    <TableHead className="text-gray-400">Ações</TableHead>
                                </>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedData.map((item) => {
                            if (isLead) {
                                const lead = item as RawLead;
                                return (
                                    <TableRow key={lead.id} className="border-gray-700 hover:bg-gray-800">
                                        <TableCell className="text-white font-medium">{lead.nome}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${lead.status === 'CONVERTED' ? 'bg-green-500/20 text-green-400' :
                                                lead.status === 'JUNK' ? 'bg-red-500/20 text-red-400' :
                                                    lead.status === 'IN_PROCESS' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {lead.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-300">{lead.fonte}</TableCell>
                                        <TableCell className="text-gray-300">{formatDate(lead.data_criacao)}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {lead.link_kinbox && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-cyan-400 hover:text-cyan-300"
                                                        onClick={() => window.open(lead.link_kinbox, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-1" />
                                                        Kinbox
                                                    </Button>
                                                )}
                                                {lead.link_bitrix && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-orange-400 hover:text-orange-300"
                                                        onClick={() => window.open(lead.link_bitrix, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-1" />
                                                        Bitrix
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            } else {
                                const deal = item as RawDeal;
                                return (
                                    <TableRow key={deal.id} className="border-gray-700 hover:bg-gray-800">
                                        <TableCell className="text-white font-medium">{deal.titulo}</TableCell>
                                        <TableCell className="text-green-400 font-semibold">
                                            {formatCurrency(deal.valor)}
                                        </TableCell>
                                        <TableCell className="text-gray-300">{deal.uf}</TableCell>
                                        <TableCell className="text-gray-300">
                                            {formatDate(deal.data_fechamento || deal.data_criacao)}
                                        </TableCell>
                                        <TableCell>
                                            {deal.link_bitrix && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-orange-400 hover:text-orange-300"
                                                    onClick={() => window.open(deal.link_bitrix, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    Bitrix
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            }
                        })}
                    </TableBody>
                </Table>
            </DialogContent>
        </Dialog>
    );
};

export default DataListModal;
