
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
     * Uses crm.lead.list with PHONE filter and returns only necessary fields
     */
    searchLeadByPhone: async (phone: string): Promise<BitrixLead | null> => {
        try {
            const normalizedPhone = normalizePhone(phone);
            if (normalizedPhone.length < 10) {
                console.warn('Invalid phone number for search:', phone);
                return null;
            }

            // Build the API URL with filter and select parameters
            // Filter by PHONE field, select only needed fields
            const params = new URLSearchParams();
            params.append('filter[PHONE]', phone);
            params.append('select[]', 'ID');
            params.append('select[]', 'TITLE');
            params.append('select[]', 'DATE_CREATE');
            params.append('select[]', 'STATUS_ID');
            params.append('select[]', 'SOURCE_ID');
            params.append('select[]', 'ASSIGNED_BY_ID');
            params.append('select[]', 'PHONE');
            params.append('select[]', 'UF_CRM_1763496046795');
            params.append('order[DATE_CREATE]', 'DESC'); // Get most recent first
            params.append('start', '0');

            const response = await fetch(`${BITRIX_WEBHOOK_URL}/crm.lead.list?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Bitrix API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.result && Array.isArray(data.result) && data.result.length > 0) {
                // Return the first (most recent) matching lead
                return data.result[0] as BitrixLead;
            }

            // If no results with exact match, try with normalized phone
            // Sometimes Bitrix stores with country code, sometimes without
            const altParams = new URLSearchParams();
            altParams.append('filter[PHONE]', normalizedPhone);
            altParams.append('select[]', 'ID');
            altParams.append('select[]', 'TITLE');
            altParams.append('select[]', 'DATE_CREATE');
            altParams.append('select[]', 'STATUS_ID');
            altParams.append('select[]', 'SOURCE_ID');
            altParams.append('select[]', 'ASSIGNED_BY_ID');
            altParams.append('select[]', 'PHONE');
            altParams.append('select[]', 'UF_CRM_1763496046795');
            altParams.append('order[DATE_CREATE]', 'DESC');
            altParams.append('start', '0');

            const altResponse = await fetch(`${BITRIX_WEBHOOK_URL}/crm.lead.list?${params.toString()}`);

            if (!altResponse.ok) {
                return null;
            }

            const altData = await altResponse.json();

            if (altData.result && Array.isArray(altData.result) && altData.result.length > 0) {
                return altData.result[0] as BitrixLead;
            }

            return null;
        } catch (error) {
            console.error('Error searching Bitrix lead by phone:', error);
            return null;
        }
    }
};
