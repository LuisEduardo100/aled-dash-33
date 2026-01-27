import React, { useEffect, useState } from 'react';
import { SellerDashboardCard } from './SellerDashboardCard';
import { X, Maximize2, RefreshCw, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SellerData {
    name: string;
    totalValue: number;
    count: number;
}

interface TVDashboardViewProps {
    sellers: SellerData[];
    onClose: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    lastUpdated?: Date;
}

export function TVDashboardView({
    sellers,
    onClose,
    onRefresh,
    isRefreshing = false,
    lastUpdated
}: TVDashboardViewProps) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [goalUpdateTrigger, setGoalUpdateTrigger] = useState(0);

    // Update time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (onRefresh) {
            const refreshTimer = setInterval(() => {
                onRefresh();
            }, 5 * 60 * 1000);
            return () => clearInterval(refreshTimer);
        }
    }, [onRefresh]);

    // Handle fullscreen
    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.warn('Fullscreen not supported:', err);
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Handle goal update (force re-render)
    const handleGoalUpdate = () => {
        setGoalUpdateTrigger(prev => prev + 1);
    };

    // Handle ESC key to exit
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !document.fullscreenElement) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-background overflow-auto">
            {/* Header bar */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Tv className="w-6 h-6 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Performance de Vendas</h1>
                        <p className="text-sm text-muted-foreground">
                            {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy - HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {lastUpdated && (
                        <span className="text-xs text-muted-foreground">
                            Atualizado: {format(lastUpdated, 'HH:mm')}
                        </span>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        title="Atualizar dados"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
                    >
                        <Maximize2 className="w-5 h-5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        title="Fechar modo TV"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Seller cards grid - take all available space */}
            <div className="p-3 md:p-4 lg:p-6 pb-14">
                <div
                    key={goalUpdateTrigger}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
                >
                    {sellers.map((seller, index) => (
                        <SellerDashboardCard
                            key={seller.name}
                            name={seller.name}
                            totalValue={seller.totalValue}
                            dealCount={seller.count}
                            isTopPerformer={index === 0}
                            rank={index + 1}
                            onGoalUpdate={handleGoalUpdate}
                        />
                    ))}
                </div>

                {sellers.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                        <Tv className="w-16 h-16 mb-4 opacity-50" />
                        <p className="text-lg">Nenhuma venda encontrada para o período selecionado.</p>
                    </div>
                )}
            </div>

            {/* Footer - compact bar fixed at bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t px-4 py-2 z-20">
                <div className="flex items-center justify-center gap-8 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground uppercase text-xs">Vendedores:</span>
                        <span className="font-bold text-foreground">{sellers.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground uppercase text-xs">Total Vendas:</span>
                        <span className="font-bold text-foreground">{sellers.reduce((acc, s) => acc + s.count, 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground uppercase text-xs">Total Faturado:</span>
                        <span className="font-bold text-emerald-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                sellers.reduce((acc, s) => acc + s.totalValue, 0)
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
