import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoverScrollContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const HoverScrollContainer: React.FC<HoverScrollContainerProps> = ({ children, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [arrowTop, setArrowTop] = useState('50%');
    const scrollIntervalRef = useRef<number | null>(null);

    const checkScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }, []);

    // Calcula a posição vertical das setas baseado na parte visível do container
    const updateArrowPosition = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Limites visíveis do container na viewport
        const visibleTop = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, viewportHeight);
        
        // Centro da área visível, relativo ao container
        const centerInViewport = (visibleTop + visibleBottom) / 2;
        const centerRelativeToContainer = centerInViewport - rect.top;
        
        // Garante que fica dentro do container (com padding)
        const minTop = 30;
        const maxTop = rect.height - 30;
        const clampedTop = Math.max(minTop, Math.min(maxTop, centerRelativeToContainer));
        
        setArrowTop(`${clampedTop}px`);
    }, []);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        
        checkScroll();
        updateArrowPosition();
        
        container.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        window.addEventListener('resize', updateArrowPosition);
        
        // Listener de scroll em TODOS os scroll contexts (page, modal, etc)
        const handleScroll = () => {
            updateArrowPosition();
        };
        window.addEventListener('scroll', handleScroll, true);
        
        const resizeObserver = new ResizeObserver(() => {
            checkScroll();
            updateArrowPosition();
        });
        resizeObserver.observe(container);

        const t1 = setTimeout(checkScroll, 100);
        const t2 = setTimeout(updateArrowPosition, 100);

        return () => {
            container.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            window.removeEventListener('resize', updateArrowPosition);
            window.removeEventListener('scroll', handleScroll, true);
            resizeObserver.disconnect();
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [children, checkScroll, updateArrowPosition]);

    // Atualiza posição continuamente enquanto hover
    useEffect(() => {
        if (!isHovered) return;
        
        updateArrowPosition();
        const interval = setInterval(updateArrowPosition, 50);
        return () => clearInterval(interval);
    }, [isHovered, updateArrowPosition]);

    const startScrolling = (direction: 'left' | 'right') => {
        stopScrolling();
        const container = scrollContainerRef.current;
        if (!container) return;
        const scrollAmount = direction === 'left' ? -20 : 20;
        
        const animate = () => {
            if (container) {
                container.scrollLeft += scrollAmount;
                checkScroll();
                scrollIntervalRef.current = requestAnimationFrame(animate);
            }
        };
        scrollIntervalRef.current = requestAnimationFrame(animate);
    };

    const stopScrolling = () => {
        if (scrollIntervalRef.current) {
            cancelAnimationFrame(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    const arrowButtonClass = "h-11 w-11 rounded-full bg-slate-900/95 border border-slate-600 shadow-xl flex items-center justify-center text-white hover:scale-110 hover:bg-slate-800 transition-all cursor-pointer";

    return (
        <div 
            ref={containerRef}
            className={cn("relative", className)}
            onMouseEnter={() => { setIsHovered(true); checkScroll(); updateArrowPosition(); }}
            onMouseLeave={() => { setIsHovered(false); stopScrolling(); }}
        >
            {/* SETA ESQUERDA */}
            {isHovered && canScrollLeft && (
                <button
                    onMouseEnter={() => startScrolling('left')}
                    onMouseLeave={stopScrolling}
                    className={cn(arrowButtonClass, "absolute left-2 z-50")}
                    style={{ 
                        top: arrowTop, 
                        transform: 'translateY(-50%)',
                        transition: 'top 0.1s ease-out'
                    }}
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
            )}

            {/* CONTEÚDO */}
            <div
                ref={scrollContainerRef}
                className="overflow-x-auto w-full [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>

            {/* SETA DIREITA */}
            {isHovered && canScrollRight && (
                <button
                    onMouseEnter={() => startScrolling('right')}
                    onMouseLeave={stopScrolling}
                    className={cn(arrowButtonClass, "absolute right-2 z-50")}
                    style={{ 
                        top: arrowTop, 
                        transform: 'translateY(-50%)',
                        transition: 'top 0.1s ease-out'
                    }}
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            )}
        </div>
    );
};