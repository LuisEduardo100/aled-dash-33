
const BITRIX_WEBHOOK_URL = 'https://atacadaoled.bitrix24.com.br/rest/2647/vaoafc68g9602xzh';

export interface BitrixPhoneEntry {
    ID?: string;
    VALUE_TYPE?: string;
    VALUE?: string;
    TYPE_ID?: string;
}

export interface BitrixLead {
    ID: string;
    TITLE: string;
    DATE_CREATE: string;
    STATUS_ID: string;
    SOURCE_ID: string;
    ASSIGNED_BY_ID: string;
    PHONE?: BitrixPhoneEntry[];
    UF_CRM_1763496046795?: string; // Custom phone field
}

// Normalize phone number for comparison
const normalizePhone = (phone: string | undefined | null): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '').slice(-11);
};

export const bitrixService = {
    getLead: async (leadId: string): Promise<BitrixLead | null> => {
        try {
            // Ensure leadId is clean (no extra characters)
            const cleanId = leadId.toString().trim();
            console.log(`[Bitrix] Fetching lead ID: ${cleanId}`);

            const url = `${BITRIX_WEBHOOK_URL}/crm.lead.get?ID=${cleanId}`;
            console.log(`[Bitrix] URL: ${url}`);

            const response = await fetch(url);
            const data = await response.json();

            console.log(`[Bitrix] Response status: ${response.status}`, data);

            // Check for Bitrix error in response body
            if (data.error) {
                console.error(`[Bitrix] API Error: ${data.error} - ${data.error_description || ''}`);
                return null;
            }

            if (!response.ok) {
                console.error(`[Bitrix] HTTP Error: ${response.status}`);
                return null;
            }

            if (data.result) {
                console.log(`[Bitrix] Lead found:`, data.result);
                return data.result as BitrixLead;
            }

            console.warn(`[Bitrix] No result in response for lead ID: ${cleanId}`);
            return null;
        } catch (error) {
            console.error('[Bitrix] Error fetching lead:', error);
            return null;
        }
    },

    /**
     * Search for a lead by phone number
     * Uses crm.lead.list with PHONE filter and multiple fallback strategies
     */
    searchLeadByPhone: async (phone: string): Promise<BitrixLead | null> => {
        try {
            const normalizedPhone = normalizePhone(phone);
            if (normalizedPhone.length < 8) {
                return null;
            }

            // Last 8 and 9 digits for partial matching
            const last8 = normalizedPhone.slice(-8);
            const last9 = normalizedPhone.slice(-9);

            // FIELDS TO SELECT
            const selectFields = [
                'ID', 'TITLE', 'DATE_CREATE', 'STATUS_ID', 'SOURCE_ID',
                'ASSIGNED_BY_ID', 'PHONE', 'UF_CRM_1763496046795'
            ];

            const trySearch = async (filterKey: string, filterValue: string): Promise<BitrixLead | null> => {
                const params = new URLSearchParams();
                params.append(`filter[${filterKey}]`, filterValue);
                selectFields.forEach(f => params.append('select[]', f));
                params.append('order[DATE_CREATE]', 'DESC');

                const res = await fetch(`${BITRIX_WEBHOOK_URL}/crm.lead.list?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.result && data.result.length > 0) return data.result[0];
                }
                return null;
            };

            // Strategy 1: Exact PHONE match with original value
            let result = await trySearch('PHONE', phone);
            if (result) return result;

            // Strategy 2: Exact PHONE match with normalized value
            if (normalizedPhone !== phone) {
                result = await trySearch('PHONE', normalizedPhone);
                if (result) return result;
            }

            // Strategy 3: PHONE match with %LIKE% pattern (contains)
            result = await trySearch('%PHONE', `%${last8}%`);
            if (result) return result;

            // Strategy 4: Custom field exact match
            result = await trySearch('UF_CRM_1763496046795', phone);
            if (result) return result;

            // Strategy 5: Custom field with normalized value
            if (normalizedPhone !== phone) {
                result = await trySearch('UF_CRM_1763496046795', normalizedPhone);
                if (result) return result;
            }

            // Strategy 6: Custom field LIKE match
            result = await trySearch('%UF_CRM_1763496046795', `%${last8}%`);
            if (result) return result;

            // Strategy 7: Try last 9 digits on custom field
            result = await trySearch('%UF_CRM_1763496046795', `%${last9}%`);
            if (result) return result;

            return null;
        } catch (error) {
            console.error('Error searching Bitrix lead by phone:', error);
            return null;
        }
    },

    getDeal: async (dealId: string): Promise<any | null> => {
        try {
            const url = `${BITRIX_WEBHOOK_URL}/crm.deal.get?ID=${dealId}`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.result) return data.result;
            return null;
        } catch (error) {
            console.error('[Bitrix] Error fetching deal:', error);
            return null;
        }
    },

    searchDealByTitle: async (title: string): Promise<any | null> => {
        try {
            const params = new URLSearchParams();
            params.append('filter[TITLE]', title);
            // Select all fields (*) to find the custom one
            params.append('select[]', '*');
            params.append('select[]', 'UF_*'); // Try to select user fields

            const response = await fetch(`${BITRIX_WEBHOOK_URL}/crm.deal.list?${params.toString()}`);
            const data = await response.json();

            if (data.result && data.result.length > 0) {
                return data.result[0];
            }
            return null;
        } catch (error) {
            console.error('[Bitrix] Error searching deal:', error);
            return null;
        }
    }
};
