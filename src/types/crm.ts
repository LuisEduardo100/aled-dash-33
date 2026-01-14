// CRM Lead interface based on Bitrix24 payload
export interface CRMLead {
  id: string;
  title: string;
  source_id: string; // Ex: 'WEBFORM', 'CALLBACK', 'UC_HCJB1D'
  status_id: string; // 'NEW', 'IN_PROCESS', etc.
  date_create: string;
  kinbox_url: string; // From field UF_CRM_1763749259586
  discard_reason?: string; // From field UF_CRM_1764102259164
  phone?: string;
  uf?: string; // Estado (UF) para mapa de calor
}

// CRM Deal interface based on Bitrix24 payload
export interface CRMDeal {
  id: string;
  title: string;
  opportunity: number;
  stage_id: string; // 'C8:WON', 'C8:LOSE', 'C134:UC_IMRQ16'
  category_id: string; // '8' = Varejo, '126' or '134' = Projeto
  date_create: string;
  kinbox_url: string; // From field UF_CRM_690B56170F2F9
  lead_id?: string; // Reference to original lead
  source_id?: string; // Origem do negócio
}

// Lead status mapping
export const LEAD_STATUS_MAP: Record<string, { label: string; color: string }> = {
  'NEW': { label: 'Novo', color: 'info' },
  'IN_PROCESS': { label: 'Em Atendimento', color: 'warning' },
  'PROCESSED': { label: 'Processado', color: 'success' },
  'CONVERTED': { label: 'Convertido', color: 'success' },
  'JUNK': { label: 'Descartado', color: 'destructive' },
};

// Deal category mapping
export const DEAL_CATEGORY_MAP: Record<string, string> = {
  '8': 'Varejo',
  '126': 'Projeto',
  '134': 'Projeto',
  '298': 'Projeto',
};

// Source mapping - fontes reais do Bitrix
export const SOURCE_MAP: Record<string, string> = {
  'UC_HCJB1D': 'Meta Ads',
  'FB_': 'Meta Ads',
  'IG_': 'Meta Ads',
  'META_': 'Meta Ads',
  'FACEBOOK': 'Meta Ads',
  'INSTAGRAM': 'Meta Ads',
  'GOOGLE_': 'Google Ads',
  'GADS_': 'Google Ads',
  'UC_GOOGLE': 'Google Ads',
  // Fontes detalhadas
  'PROSPECCAO': 'Prospecção',
  'INDICACAO_AMIGO': 'Indicação Amigo',
  'INDICACAO_PROFISSIONAL': 'Indicação Profissional',
  'CFA': 'CFA',
  'YOUTUBE': 'Youtube',
  'VITRINE': 'Vitrine/Carro',
  'ENCARTE': 'Encarte/Outdoor',
  'EVENTOS': 'Eventos',
  'ATIVACAO': 'Ativação Relac.',
  'CORPORATIVO': 'Corporativo',
  'SITE': 'Site',
  'LTV': 'LTV',
  'ORGANIC': 'Busca orgânica',
  'WEBFORM': 'Site',
  'CALLBACK': 'Busca orgânica',
  'REFERRAL': 'Indicação Amigo',
};

// All available sources for filter
export const ALL_SOURCES = [
  'Todos',
  'Prospecção',
  'Google',
  'Instagram',
  'Indicação Amigo',
  'Indicação Profissional',
  'CFA',
  'Youtube',
  'Vitrine/Carro',
  'Encarte/Outdoor',
  'Eventos',
  'Facebook',
  'Ativação Relac.',
  'Corporativo',
  'Site',
  'LTV',
  'Busca orgânica',
  'Meta Ads',
  'Google Ads',
];

// Source attribution
export const SOURCE_ATTRIBUTION = {
  META_ADS: ['UC_HCJB1D', 'FB_', 'IG_', 'META_', 'FACEBOOK', 'INSTAGRAM'],
  GOOGLE_ADS: ['GOOGLE_', 'GADS_', 'UC_GOOGLE'],
};

// Helper functions
export const isMetaAds = (sourceId: string): boolean => {
  return SOURCE_ATTRIBUTION.META_ADS.some(prefix => 
    sourceId.toUpperCase().includes(prefix) || sourceId === prefix
  );
};

export const isGoogleAds = (sourceId: string): boolean => {
  return SOURCE_ATTRIBUTION.GOOGLE_ADS.some(prefix => 
    sourceId.toUpperCase().includes(prefix)
  );
};

export const getSourceAttribution = (sourceId: string): string => {
  if (isMetaAds(sourceId)) return 'Meta Ads';
  if (isGoogleAds(sourceId)) return 'Google Ads';
  return 'Orgânico/Outros';
};

export const getDetailedSource = (sourceId: string): string => {
  // Check exact match first
  if (SOURCE_MAP[sourceId]) return SOURCE_MAP[sourceId];
  
  // Check prefix matches
  for (const [prefix, label] of Object.entries(SOURCE_MAP)) {
    if (sourceId.toUpperCase().includes(prefix)) {
      return label;
    }
  }
  
  return 'Orgânico/Outros';
};

export const getDealCategory = (categoryId: string): string => {
  return DEAL_CATEGORY_MAP[categoryId] || 'Outros';
};

export const getLeadStatusInfo = (statusId: string) => {
  return LEAD_STATUS_MAP[statusId] || { label: statusId, color: 'muted' };
};

// Brazilian states for heat map
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins',
};
