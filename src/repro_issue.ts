
import { startOfDay, endOfDay } from 'date-fns';

// Simulation of the issue
const now = new Date(); // Current time (Client context)

// "Hoje" Filter construction
const startDate = startOfDay(now);
const endDate = endOfDay(now);

// Sample Deal Data (from Backend -> DB -> API -> Frontend)
// Assuming DB stores correct ISO string from bitrixService.js (normalizarDataFuso returns toISOString())
const deal = {
    id: 1,
    data_criacao: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // Created 1 hour ago
};

const filterDeal = (deal: any, start: Date | null, end: Date | null) => {
    // 1. Date Filter (Creation Date)
    if (deal.data_criacao && start && end) {
        const date = new Date(deal.data_criacao);

        console.log("Filter Range:", startDate.toString(), " - ", endDate.toString());
        console.log("Deal Date Raw:", deal.data_criacao);
        console.log("Deal Date Parsed:", date.toString());
        console.log("Is After Start?", date >= startDate);
        console.log("Is Before End?", date <= endDate);

        if (date < startDate || date > endDate) return false;
    }
    return true;
};

const result = filterDeal(deal, startDate, endDate);
console.log("Included in Filter?", result);
