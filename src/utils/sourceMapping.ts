// Bitrix Source Code to Friendly Name Mapping
export const MAPA_FONTES: Record<string, string> = {
    "UC_JKGTUC": "Prospecção",
    "WEBFORM": "Google",
    "CALLBACK": "Instagram",
    "STORE": "Indicação Amigo",
    "RC_GENERATOR": "Indicação Profissional",
    "CALL": "CFA",
    "UC_H0VN85": "Youtube",
    "UC_F445HA": "Vitrine/Carro",
    "UC_8OOM1P": "Encarte/Outdoor",
    "UC_GG87LP": "Eventos",
    "UC_HCJB1D": "Facebook",
    "UC_N35K7E": "Ativação Relac.",
    "REPEAT_SALE": "Corporativo",
    "UC_Y1DNMP": "Site",
    "Google": "Google",
    "Facebook": "Facebook",
    "Instagram": "Instagram",
    "Indicação": "Indicação Amigo",
    "WEB": "Site",
    "UC_JNSE1L": "LTV",
    "UC_6F33AS": "Busca orgânica"
};

/**
 * Get friendly source name from Bitrix source code
 */
export const getFriendlySourceName = (sourceCode: string | undefined): string => {
    if (!sourceCode) return 'Desconhecido';
    return MAPA_FONTES[sourceCode] || sourceCode;
};

/**
 * Check if a source is part of Meta (Facebook or Instagram)
 */
export const isMetaSource = (source: string | undefined): boolean => {
    if (!source) return false;
    const normalized = source.toLowerCase();
    // Check both the code and friendly names
    const metaCodes = ['CALLBACK', 'UC_HCJB1D', 'Facebook', 'Instagram'];
    const metaNames = ['facebook', 'instagram', 'meta'];

    return metaCodes.includes(source) ||
        metaNames.some(name => normalized.includes(name));
};

/**
 * Get the list of Meta source codes
 */
export const META_SOURCE_CODES = ['CALLBACK', 'UC_HCJB1D', 'Facebook', 'Instagram'];
