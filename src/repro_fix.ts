
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// Simulation of the issue - NOW FIXED
const now = new Date(); // Current time (Client context)

// "Hoje" Filter construction
const startDate = startOfDay(now);
const endDate = endOfDay(now);

// Sample Deal Data (Today)
const dealNow = {
    id: 1,
    data_criacao: new Date(now.getTime() - 1000 * 60 * 60).toISOString(), // Created 1 hour ago
};

// Sample Deal Data (Start of Day Boundary)
const dealStart = {
    id: 2,
    data_criacao: startDate.toISOString(),
};

// Sample Deal Data (End of Day Boundary)
const dealEnd = {
    id: 3,
    data_criacao: endDate.toISOString(),
};


const filterDeal = (deal: any, start: Date | null, end: Date | null) => {
    // OLD LOGIC: if (date < start || date > end) return false;
    // NEW LOGIC: isWithinInterval
    if (deal.data_criacao && start && end) {
        const date = new Date(deal.data_criacao);
        const inInterval = isWithinInterval(date, { start, end });
        console.log(`Deal ${deal.id} (${date.toISOString()}): In Interval [${start.toISOString()} - ${end.toISOString()}]? ${inInterval}`);
        if (!inInterval) return false;
    }
    return true;
};

console.log("Testing with isWithinInterval:");
filterDeal(dealNow, startDate, endDate);
filterDeal(dealStart, startDate, endDate);
filterDeal(dealEnd, startDate, endDate);
