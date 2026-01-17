import { useMemo } from 'react';
import { getDaysInMonth, getDate } from 'date-fns';
import { SegmentedDeal } from '@/types/dashboard';
import { DemandGoals, ChannelGoals } from './useDemandGoals';

export interface ChannelMetrics {
    channel: string;
    channelKey: keyof ChannelGoals;
    faturamentoMeta: number;
    faturamentoRealizado: number;
    oportunidadesMeta: number;
    oportunidadesRealizado: number;
    percentAtingido: number;
    gap: number;
    trend: 'up' | 'down' | 'neutral';
}

export interface DemandMetrics {
    // Totals
    faturamentoRealizado: number;
    faturamentoMeta: number;
    faturamentoProgress: number;
    oportunidadesRealizado: number;
    oportunidadesMeta: number;
    oportunidadesProgress: number;
    
    // Pacing
    expectedProgress: number;
    faturamentoPacing: number;
    oportunidadesPacing: number;
    
    // Projection
    faturamentoProjection: number;
    oportunidadesProjection: number;
    
    // Daily required
    faturamentoDailyRequired: number;
    oportunidadesDailyRequired: number;
    
    // Time info
    currentDay: number;
    daysInMonth: number;
    daysRemaining: number;
    
    // Per channel breakdown
    channelMetrics: ChannelMetrics[];
    
    // Daily data for charts
    dailyData: { day: number; faturamento: number; oportunidades: number }[];
}

function mapSourceToChannel(fonte: string): keyof ChannelGoals {
    const fonteLower = (fonte || '').toLowerCase();
    
    if (fonteLower.includes('google')) return 'google';
    
    if (fonteLower.includes('meta') || fonteLower.includes('facebook') || fonteLower.includes('instagram')) return 'meta';
    
    if (fonteLower.includes('amigo') || (fonteLower.includes('indica') && !fonteLower.includes('profissional'))) return 'indicacaoAmigo';
    
    if (fonteLower.includes('profissional') || fonteLower.includes('prospecç')) return 'indicacaoProfissional';
    
    if (fonteLower.includes('ltv') || fonteLower.includes('recompra')) return 'ltv';
    
    return 'outros';
}

export function useDemandMetrics(
    deals: {
        ganhos: SegmentedDeal[];
        perdidos: SegmentedDeal[];
        andamento: SegmentedDeal[];
    },
    goals: DemandGoals
): DemandMetrics {
    return useMemo(() => {
        const today = new Date();
        const currentM = today.getMonth();
        const currentY = today.getFullYear();
        const currentDay = getDate(today);
        const daysInMonth = getDaysInMonth(today);
        const daysRemaining = Math.max(1, daysInMonth - currentDay);
        
        console.log('DemandMetrics Input:', { 
            ganhos: deals.ganhos.length, 
            andamento: deals.andamento.length,
            perdidos: deals.perdidos.length,
            currentMonth: currentM,
            currentYear: currentY
        });

        // Initialize channel accumulators
        const channelFaturamento: Record<keyof ChannelGoals, number> = {
            google: 0, meta: 0, indicacaoAmigo: 0, indicacaoProfissional: 0, ltv: 0, outros: 0
        };
        const channelOportunidades: Record<keyof ChannelGoals, number> = {
            google: 0, meta: 0, indicacaoAmigo: 0, indicacaoProfissional: 0, ltv: 0, outros: 0
        };
        
        // Daily accumulator for chart
        const dailyFaturamento: Record<number, number> = {};
        const dailyOportunidades: Record<number, number> = {};
        
        // Process ganhos (Faturamento + Oportunidades contribution)
        deals.ganhos.forEach(deal => {
            const channel = mapSourceToChannel(deal.fonte);
            
            // Faturamento: based on CLOSE DATE
            if (deal.data_fechamento) {
                try {
                    const closeDate = new Date(deal.data_fechamento);
                    if (closeDate.getMonth() === currentM && closeDate.getFullYear() === currentY) {
                         const val = deal.valor || 0;
                         channelFaturamento[channel] += val;
                         
                         const day = getDate(closeDate);
                         dailyFaturamento[day] = (dailyFaturamento[day] || 0) + val;
                    }
                } catch(e) {}
            }
            
            // Oportunidades contribution (from Won deals): based on CREATION DATE
            // "Demand Created This Month" includes Won deals created this month
            if (deal.data_criacao) {
                try {
                     const createDate = new Date(deal.data_criacao);
                     if (createDate.getMonth() === currentM && createDate.getFullYear() === currentY) {
                         const val = deal.valor || 0;
                         channelOportunidades[channel] += val;
                         
                         // Note: dailyOportunidades is based on CREATION date
                         const day = getDate(createDate);
                         dailyOportunidades[day] = (dailyOportunidades[day] || 0) + val;
                     } else {
                         // Debug log for date mismatch if needed
                         // if (deals.ganhos.length < 5) console.log('Skipped Won Deal (Date):', deal.titulo, deal.data_criacao);
                     }
                } catch(e) {}
            }
        });
        
        // Process andamento (Oportunidades only)
        deals.andamento.forEach(deal => {
            const channel = mapSourceToChannel(deal.fonte);
            
            if (deal.data_criacao) {
                 try {
                     const createDate = new Date(deal.data_criacao);
                     if (createDate.getMonth() === currentM && createDate.getFullYear() === currentY) {
                         const val = deal.valor || 0;
                         channelOportunidades[channel] += val;
                         
                         const day = getDate(createDate);
                         dailyOportunidades[day] = (dailyOportunidades[day] || 0) + val;
                     }
                 } catch(e) {}
            }
        });

        // Debug output
        const totalFat = Object.values(channelFaturamento).reduce((a, b) => a + b, 0);
        const totalOpp = Object.values(channelOportunidades).reduce((a, b) => a + b, 0);
        console.log('Calculated Totals:', { totalFat, totalOpp });

        
        // Calculate totals
        const faturamentoRealizado = totalFat;
        const oportunidadesRealizado = totalOpp;
        
        const faturamentoMeta = 
            goals.faturamento.google + goals.faturamento.meta + 
            goals.faturamento.indicacaoAmigo + goals.faturamento.indicacaoProfissional + goals.faturamento.ltv + goals.faturamento.outros;
        const oportunidadesMeta = 
            goals.oportunidades.google + goals.oportunidades.meta + 
            goals.oportunidades.indicacaoAmigo + goals.oportunidades.indicacaoProfissional + goals.oportunidades.ltv + goals.oportunidades.outros;
        
        // Progress calculations
        const faturamentoProgress = faturamentoMeta > 0 ? (faturamentoRealizado / faturamentoMeta) * 100 : 0;
        const oportunidadesProgress = oportunidadesMeta > 0 ? (oportunidadesRealizado / oportunidadesMeta) * 100 : 0;
        const expectedProgress = (currentDay / daysInMonth) * 100;
        
        // Pacing
        const faturamentoPacing = faturamentoProgress - expectedProgress;
        const oportunidadesPacing = oportunidadesProgress - expectedProgress;
        
        // Projection (Revised: Pipeline Based for Revenue)
        // If conversionRate is set, use Pipeline Created * Conversion Rate
        // If not, fall back to linear extrapolation of Realized Revenue? 
        // Logic: "Projected Revenue" = Realized Revenue + (Open Qualified Pipeline * Conversion Rate)?
        // Wait, 'oportunidadesRealizado' includes 'ganhos'. So 'Pipeline Total' = 'Realized' + 'Open'.
        // So 'Projected' = 'Pipeline Total' * 'Conversion'.
        const conversionRate = goals.conversionRate || 20; // Default 20%
        const faturamentoProjection = (oportunidadesRealizado * conversionRate) / 100;
        
        // Oportunidades Projection (Linear extrapolation of pipeline creation volume)
        const dailyAvgOportunidades = currentDay > 0 ? oportunidadesRealizado / currentDay : 0;
        const oportunidadesProjection = dailyAvgOportunidades * daysInMonth;
        
        // Daily required
        const faturamentoDailyRequired = (faturamentoMeta - faturamentoRealizado) / daysRemaining;
        const oportunidadesDailyRequired = (oportunidadesMeta - oportunidadesRealizado) / daysRemaining;
        
        // Build channel metrics
        const channelLabels: Record<keyof ChannelGoals, string> = {
            google: 'Google Ads',
            meta: 'Meta Ads',
            indicacaoAmigo: 'Indicação Amigo',
            indicacaoProfissional: 'Indicação Profissional',
            ltv: 'LTV / Recompra',
            outros: 'Outros',
        };
        
        const channelMetrics: ChannelMetrics[] = (Object.keys(channelLabels) as (keyof ChannelGoals)[]).map(key => {
            const faturamentoMeta = goals.faturamento[key];
            const faturamentoRealizado = channelFaturamento[key];
            const oportunidadesMeta = goals.oportunidades[key];
            const oportunidadesRealizado = channelOportunidades[key];
            const percentAtingido = oportunidadesMeta > 0 ? (oportunidadesRealizado / oportunidadesMeta) * 100 : 0;
            const gap = oportunidadesMeta - oportunidadesRealizado;
            const trend = percentAtingido >= expectedProgress ? 'up' : percentAtingido >= expectedProgress - 10 ? 'neutral' : 'down';
            
            return {
                channel: channelLabels[key],
                channelKey: key,
                faturamentoMeta,
                faturamentoRealizado,
                oportunidadesMeta,
                oportunidadesRealizado,
                percentAtingido,
                gap,
                trend,
            };
        });
        
        // Build daily data for charts
        const dailyData: { day: number; faturamento: number; oportunidades: number }[] = [];
        for (let i = 1; i <= currentDay; i++) {
            dailyData.push({
                day: i,
                faturamento: dailyFaturamento[i] || 0,
                oportunidades: dailyOportunidades[i] || 0,
            });
        }
        
        return {
            faturamentoRealizado,
            faturamentoMeta,
            faturamentoProgress,
            oportunidadesRealizado,
            oportunidadesMeta,
            oportunidadesProgress,
            expectedProgress,
            faturamentoPacing,
            oportunidadesPacing,
            faturamentoProjection,
            oportunidadesProjection,
            faturamentoDailyRequired,
            oportunidadesDailyRequired,
            currentDay,
            daysInMonth,
            daysRemaining,
            channelMetrics,
            dailyData,
        };
    }, [deals, goals]);
}
