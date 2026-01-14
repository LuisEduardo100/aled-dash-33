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

export const getDealCategory = (categoryId: string): string => {
  return DEAL_CATEGORY_MAP[categoryId] || 'Outros';
};

export const getLeadStatusInfo = (statusId: string) => {
  return LEAD_STATUS_MAP[statusId] || { label: statusId, color: 'muted' };
};
