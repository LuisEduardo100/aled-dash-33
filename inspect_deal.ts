
const BITRIX_WEBHOOK_URL = 'https://atacadaoled.bitrix24.com.br/rest/2647/vaoafc68g9602xzh';

async function scanDealsForPhone() {
    try {
        console.log('Fetching deals to scan for phone 99199040...');

        let found = false;
        let start = 0;

        // Fetch up to 10 pages (500 deals)
        for (let i = 0; i < 10; i++) {
            const params = new URLSearchParams();
            params.append('select[]', '*');
            params.append('select[]', 'UF_*');
            params.append('order[DATE_CREATE]', 'DESC');
            params.append('start', start.toString());

            const response = await fetch(`${BITRIX_WEBHOOK_URL}/crm.deal.list?${params.toString()}`);
            const data = await response.json();

            if (!data.result || data.result.length === 0) break;

            console.log(`Scanning batch ${i + 1} (${data.result.length} deals)...`);

            for (const d of data.result) {
                const str = JSON.stringify(d);
                if (str.includes('99199040')) {
                    console.log('!!! MATCH FOUND !!!');
                    console.log(`ID: ${d.ID} | Title: ${d.TITLE}`);
                    console.log(JSON.stringify(d, null, 2));

                    // Identify the field holding the phone
                    Object.keys(d).forEach(key => {
                        const val = JSON.stringify(d[key]);
                        if (val && val.includes('99199040')) {
                            console.log(`>>> PHONE FOUND IN FIELD: ${key} <<<`);
                        }
                    });

                    found = true;
                    // We can stop after finding one, or keep going if multiple. Let's stop.
                    return;
                }
            }

            start += 50;
            if (data.next) {
                start = data.next;
            } else {
                break;
            }
        }

        if (!found) console.log('Phone number not found in recent deals.');

    } catch (error) {
        console.error('[Bitrix] Error scanning deals:', error);
    }
}

scanDealsForPhone();
