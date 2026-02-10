const fs = require('fs');
const { startOfDay, endOfDay } = require('date-fns');

const normalizarDataFuso = (dataIso) => {
    if (!dataIso) return null;
    const d = new Date(dataIso);
    // d.setHours(d.getHours() + 4); // Match backend fix
    return d.toISOString();
};

const filterDeal = (dealDateStr, start, end) => {
    const date = new Date(dealDateStr);
    return date >= start && date <= end;
};

const run = () => {
    const now = new Date(); // Brazil time (system)
    const log = [];
    
    log.push(`System Time: ${now.toString()}`);
    log.push(`Start of Today: ${startOfDay(now).toString()}`);
    log.push(`End of Today: ${endOfDay(now).toString()}`);
    
    [0, 8, 10, 12, 16, 20, 23].forEach(hour => {
        const dealTime = new Date(now);
        dealTime.setHours(hour, 0, 0, 0); // Local time
        
        const originalIso = dealTime.toISOString();
        const storedIso = normalizarDataFuso(originalIso);
        
        const start = startOfDay(now);
        const end = endOfDay(now);
        
        const result = filterDeal(storedIso, start, end);
        
        log.push(`\n--- Hour: ${hour}:00 ---`);
        log.push(`Original Local: ${dealTime.toString()}`);
        log.push(`Original ISO: ${originalIso}`);
        log.push(`Stored ISO (+4h): ${storedIso}`);
        log.push(`Included? ${result}`);
        
        const storedDate = new Date(storedIso);
        log.push(`Stored Date (Local): ${storedDate.toString()}`);
        log.push(`Start Date (Local): ${start.toString()}`);
        log.push(`End Date (Local): ${end.toString()}`);
    });
    
    fs.writeFileSync('debug_output.txt', log.join('\n'));
};

run();
