import { useState, useEffect, useCallback } from 'react';

export interface ChannelGoals {
    google: number;
    meta: number;
    indicacaoAmigo: number;
    indicacaoProfissional: number;
    ltv: number;
    outros: number;
}

export interface DemandGoals {
    faturamento: ChannelGoals;
    oportunidades: ChannelGoals;
    conversionRate: number; // Taxa de conversão em percentual (ex: 20 = 20%)
}

const DEFAULT_GOALS: DemandGoals = {
    faturamento: {
        google: 300000,
        meta: 100000,
        indicacaoAmigo: 200000,
        indicacaoProfissional: 170000,
        ltv: 330000,
        outros: 0,
    },
    oportunidades: {
        google: 1500000,
        meta: 500000,
        indicacaoAmigo: 1000000,
        indicacaoProfissional: 850000,
        ltv: 1650000,
        outros: 0,
    },
    conversionRate: 20, // 20% default
};

const STORAGE_KEY = 'demand-generation-goals';

export function useDemandGoals() {
    const [goals, setGoals] = useState<DemandGoals>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                
                // Helper to ensure number
                const sanitize = (val: any) => {
                    const num = Number(val);
                    return isNaN(num) ? 0 : num;
                };

                const fatur = parsed.faturamento || {};
                const oport = parsed.oportunidades || {};

                return {
                    faturamento: {
                        google: sanitize(fatur.google ?? DEFAULT_GOALS.faturamento.google),
                        meta: sanitize(fatur.meta ?? DEFAULT_GOALS.faturamento.meta),
                        indicacaoAmigo: sanitize(fatur.indicacaoAmigo ?? DEFAULT_GOALS.faturamento.indicacaoAmigo),
                        indicacaoProfissional: sanitize(fatur.indicacaoProfissional ?? DEFAULT_GOALS.faturamento.indicacaoProfissional),
                        ltv: sanitize(fatur.ltv ?? DEFAULT_GOALS.faturamento.ltv),
                        outros: sanitize(fatur.outros ?? DEFAULT_GOALS.faturamento.outros),
                    },
                    oportunidades: {
                        google: sanitize(oport.google ?? DEFAULT_GOALS.oportunidades.google),
                        meta: sanitize(oport.meta ?? DEFAULT_GOALS.oportunidades.meta),
                        indicacaoAmigo: sanitize(oport.indicacaoAmigo ?? DEFAULT_GOALS.oportunidades.indicacaoAmigo),
                        indicacaoProfissional: sanitize(oport.indicacaoProfissional ?? DEFAULT_GOALS.oportunidades.indicacaoProfissional),
                        ltv: sanitize(oport.ltv ?? DEFAULT_GOALS.oportunidades.ltv),
                        outros: sanitize(oport.outros ?? DEFAULT_GOALS.oportunidades.outros),
                    },
                    conversionRate: sanitize(parsed.conversionRate ?? DEFAULT_GOALS.conversionRate),
                };
            }
        } catch (e) {
            console.error('Error loading goals from localStorage:', e);
        }
        return DEFAULT_GOALS;
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
        } catch (e) {
            console.error('Error saving goals to localStorage:', e);
        }
    }, [goals]);

    const updateGoals = useCallback((newGoals: DemandGoals) => {
        setGoals(newGoals);
    }, []);

    const resetToDefaults = useCallback(() => {
        setGoals(DEFAULT_GOALS);
    }, []);

    const totalFaturamentoMeta = 
        goals.faturamento.google + 
        goals.faturamento.meta + 
        goals.faturamento.indicacaoAmigo + 
        goals.faturamento.indicacaoProfissional + 
        goals.faturamento.ltv +
        goals.faturamento.outros;

    const totalOportunidadesMeta = 
        goals.oportunidades.google + 
        goals.oportunidades.meta + 
        goals.oportunidades.indicacaoAmigo + 
        goals.oportunidades.indicacaoProfissional + 
        goals.oportunidades.ltv +
        goals.oportunidades.outros;

    return {
        goals,
        updateGoals,
        resetToDefaults,
        totalFaturamentoMeta,
        totalOportunidadesMeta,
    };
}

