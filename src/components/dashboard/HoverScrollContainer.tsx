import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HoverScrollContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const HoverScrollContainer = ({ children, className }: HoverScrollContainerProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollInterval = useRef<NodeJS.Timeout | null>(null);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    useEffect(() => {
        const observer = new MutationObserver(checkScroll);
        if (scrollRef.current) {
            observer.observe(scrollRef.current, { childList: true, subtree: true });
        }
        return () => observer.disconnect();
    }, [children]);

    const startScrolling = (direction: 'left' | 'right') => {
        stopScrolling();
        scrollInterval.current = setInterval(() => {
            if (scrollRef.current) {
                // Increased scroll speed for better feel
                const scrollAmount = direction === 'left' ? -20 : 20;
                scrollRef.current.scrollLeft += scrollAmount;
            }
        }, 10); // ~100fps smoother
    };

    const stopScrolling = () => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    };

    return (
        <div className={cn("relative group isolation-auto", className)} onMouseLeave={stopScrolling}>
            {canScrollLeft && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-16 z-20 flex items-center justify-start cursor-pointer group/arrow"
                    onMouseEnter={() => startScrolling('left')}
                    onMouseLeave={stopScrolling}
                >
                    {/* Half-circle arrow on the left */}
                    <div className="absolute left-0 bg-background/80 hover:bg-background border-r border-y border-border rounded-r-full p-2 py-8 shadow-sm transition-all opacity-50 group-hover/arrow:opacity-100 flex items-center justify-center -ml-2 hover:ml-0 duration-300">
                        <ChevronLeft className="h-6 w-6 text-muted-foreground/70" />
                    </div>
                </div>
            )}

            <div
                ref={scrollRef}
                className="overflow-x-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
                onScroll={checkScroll}
            >
                {children}
            </div>

            {canScrollRight && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-16 z-20 flex items-center justify-end cursor-pointer group/arrow"
                    onMouseEnter={() => startScrolling('right')}
                    onMouseLeave={stopScrolling}
                >
                    {/* Half-circle arrow on the right */}
                    <div className="absolute right-0 bg-background/80 hover:bg-background border-l border-y border-border rounded-l-full p-2 py-8 shadow-sm transition-all opacity-50 group-hover/arrow:opacity-100 flex items-center justify-center -mr-2 hover:mr-0 duration-300">
                        <ChevronRight className="h-6 w-6 text-muted-foreground/70" />
                    </div>
                </div>
            )}
        </div>
    );
};
