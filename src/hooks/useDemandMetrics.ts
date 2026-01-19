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

function mapSourceToChannel(fonte: string): keyof ChannelGoals | 'outros' {
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
        
        // Initialize channel accumulators (Removed 'outros', Added 'novosLeads')
        const channelFaturamento: Record<keyof ChannelGoals, number> = {
            google: 0, meta: 0, indicacaoAmigo: 0, indicacaoProfissional: 0, ltv: 0, novosLeads: 0
        };
        const channelOportunidades: Record<keyof ChannelGoals, number> = {
            google: 0, meta: 0, indicacaoAmigo: 0, indicacaoProfissional: 0, ltv: 0, novosLeads: 0
        };
        
        // Daily accumulator for chart
        const dailyFaturamento: Record<number, number> = {};
        const dailyOportunidades: Record<number, number> = {};
        
        let totalRealizedFat = 0;
        let totalRealizedOpp = 0;

        // Process ganhos (Faturamento + Oportunidades contribution)
        deals.ganhos.forEach(deal => {
            const channel = mapSourceToChannel(deal.fonte);
            
            // Faturamento: based on CLOSE DATE
            if (deal.data_fechamento) {
                try {
                    const closeDate = new Date(deal.data_fechamento);
                    if (closeDate.getMonth() === currentM && closeDate.getFullYear() === currentY) {
                         const val = Number(deal.valor) || 0;
                         
                         // Update Channel Bucket
                         if (channel !== 'outros') {
                             channelFaturamento[channel] += val;
                         }
                         
                         // Update Novos Leads Bucket
                         if (deal.is_novo) {
                             channelFaturamento['novosLeads'] += val;
                         }

                         // Update Total (Actual Revenue)
                         totalRealizedFat += val;
                         
                         const day = getDate(closeDate);
                         dailyFaturamento[day] = (dailyFaturamento[day] || 0) + val;
                    }
                } catch(e) {}
            }
            
            // Oportunidades contribution (from Won deals): based on CREATION DATE
            if (deal.data_criacao) {
                try {
                     const createDate = new Date(deal.data_criacao);
                     if (createDate.getMonth() === currentM && createDate.getFullYear() === currentY) {
                         const val = Number(deal.valor) || 0;

                         // Update Channel Bucket
                         if (channel !== 'outros') {
                             channelOportunidades[channel] += val;
                         }

                         // Update Novos Leads Bucket
                         if (deal.is_novo) {
                             channelOportunidades['novosLeads'] += val;
                         }

                         // Update Total
                         totalRealizedOpp += val;
                         
                         const day = getDate(createDate);
                         dailyOportunidades[day] = (dailyOportunidades[day] || 0) + val;
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
                         const val = Number(deal.valor) || 0;
                         
                         // Update Channel Bucket
                         if (channel !== 'outros') {
                             channelOportunidades[channel] += val;
                         }

                         // Update Novos Leads Bucket
                         if (deal.is_novo) {
                             channelOportunidades['novosLeads'] += val;
                         }

                         // Update Total
                         totalRealizedOpp += val;
                         
                         const day = getDate(createDate);
                         dailyOportunidades[day] = (dailyOportunidades[day] || 0) + val;
                     }
                 } catch(e) {}
            }
        });

        // Use the explicitly calculated totals
        const faturamentoRealizado = totalRealizedFat;
        const oportunidadesRealizado = totalRealizedOpp;
        
        // Correctly calculate Meta Total: LTV + Novos Leads (since Novos Leads already subsumes acq channels in global total logic)
        const faturamentoMeta = (goals.faturamento.ltv || 0) + (goals.faturamento.novosLeads || 0);
        
        const oportunidadesMeta = (goals.oportunidades.ltv || 0) + (goals.oportunidades.novosLeads || 0);
        
        // Progress calculations
        const faturamentoProgress = faturamentoMeta > 0 ? (faturamentoRealizado / faturamentoMeta) * 100 : 0;
        const oportunidadesProgress = oportunidadesMeta > 0 ? (oportunidadesRealizado / oportunidadesMeta) * 100 : 0;
        const expectedProgress = (currentDay / daysInMonth) * 100;
        
        // Pacing
        const faturamentoPacing = faturamentoProgress - expectedProgress;
        const oportunidadesPacing = oportunidadesProgress - expectedProgress;
        
        // Projection
        const conversionRate = goals.conversionRate || 20; // Default 20%
        const faturamentoProjection = (oportunidadesRealizado * conversionRate) / 100;
        
        // Oportunidades Projection
        const dailyAvgOportunidades = currentDay > 0 ? oportunidadesRealizado / currentDay : 0;
        const oportunidadesProjection = dailyAvgOportunidades * daysInMonth;
        
        // Daily required
        const faturamentoDailyRequired = (faturamentoMeta - faturamentoRealizado) / daysRemaining;
        const oportunidadesDailyRequired = (oportunidadesMeta - oportunidadesRealizado) / daysRemaining;
        
        // Build channel metrics
        // We exclude 'novosLeads' from the list because it is an aggregate of the acquisition channels (Google, Meta, etc.)
        // Including it would cause double counting in the table totals.
        const channelLabels: Partial<Record<keyof ChannelGoals, string>> = {
            google: 'Google Ads',
            meta: 'Meta Ads',
            indicacaoAmigo: 'Indicação Amigo',
            indicacaoProfissional: 'Indicação Profissional',
            ltv: 'LTV / Recompra',
            // novosLeads excluded from visual table
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
