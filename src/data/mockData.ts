import { CRMLead, CRMDeal, BRAZILIAN_STATES } from '@/types/crm';

// Generate realistic dates within the last 3 months
const generateDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Random UF assignment for geographic distribution
const getRandomUF = (): string => {
  const weights = {
    'CE': 25, 'SP': 15, 'RJ': 10, 'MG': 10, 'BA': 8, 
    'PE': 7, 'PR': 5, 'RS': 5, 'GO': 4, 'DF': 4,
    'PA': 3, 'MA': 2, 'PI': 2,
  };
  const weighted: string[] = [];
  Object.entries(weights).forEach(([state, weight]) => {
    for (let i = 0; i < weight; i++) weighted.push(state);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
};

// Detailed source IDs for variety
const detailedSourceIds = [
  'UC_HCJB1D', 'FB_CAMPANHA_01', 'IG_STORIES_02', 'GOOGLE_SEARCH', 
  'GADS_DISPLAY', 'PROSPECCAO', 'INDICACAO_AMIGO', 'INDICACAO_PROFISSIONAL',
  'CFA', 'YOUTUBE', 'VITRINE', 'ENCARTE', 'EVENTOS', 'FACEBOOK',
  'ATIVACAO', 'CORPORATIVO', 'SITE', 'LTV', 'ORGANIC', 'WEBFORM'
];

const getRandomSource = (): string => {
  return detailedSourceIds[Math.floor(Math.random() * detailedSourceIds.length)];
};

// Mock Leads Data (50+ records)
export const mockLeads: CRMLead[] = [
  // Meta Ads Leads
  { id: '1001', title: 'João Silva', source_id: 'UC_HCJB1D', status_id: 'CONVERTED', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1001', phone: '(85) 99999-1001', uf: 'CE' },
  { id: '1002', title: 'Maria Santos', source_id: 'FB_CAMPANHA_01', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1002', phone: '(85) 99999-1002', uf: 'CE' },
  { id: '1003', title: 'Pedro Oliveira', source_id: 'IG_STORIES_02', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1003', phone: '(11) 99999-1003', uf: 'SP' },
  { id: '1004', title: 'Ana Costa', source_id: 'UC_HCJB1D', status_id: 'JUNK', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1004', phone: '(21) 99999-1004', discard_reason: 'Sem interesse', uf: 'RJ' },
  { id: '1005', title: 'Carlos Ferreira', source_id: 'INDICACAO_AMIGO', status_id: 'CONVERTED', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1005', phone: '(85) 99999-1005', uf: 'CE' },
  { id: '1006', title: 'Lucia Mendes', source_id: 'FB_REMARKETING', status_id: 'IN_PROCESS', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1006', phone: '(31) 99999-1006', uf: 'MG' },
  { id: '1007', title: 'Roberto Lima', source_id: 'INSTAGRAM', status_id: 'JUNK', date_create: generateDate(10), kinbox_url: 'https://app.kinbox.com.br/chat/1007', phone: '(71) 99999-1007', discard_reason: 'Número errado', uf: 'BA' },
  { id: '1008', title: 'Fernanda Rocha', source_id: 'UC_HCJB1D', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1008', phone: '(85) 99999-1008', uf: 'CE' },
  
  // Google Ads Leads
  { id: '1009', title: 'Marcos Souza', source_id: 'GOOGLE_SEARCH', status_id: 'CONVERTED', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1009', phone: '(85) 99999-1009', uf: 'CE' },
  { id: '1010', title: 'Patricia Alves', source_id: 'GADS_DISPLAY', status_id: 'IN_PROCESS', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1010', phone: '(11) 99999-1010', uf: 'SP' },
  { id: '1011', title: 'Ricardo Barbosa', source_id: 'UC_GOOGLE', status_id: 'NEW', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1011', phone: '(81) 99999-1011', uf: 'PE' },
  { id: '1012', title: 'Camila Dias', source_id: 'GOOGLE_SHOPPING', status_id: 'JUNK', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/1012', phone: '(41) 99999-1012', discard_reason: 'Fora da área', uf: 'PR' },
  { id: '1013', title: 'Bruno Martins', source_id: 'GADS_YOUTUBE', status_id: 'CONVERTED', date_create: generateDate(9), kinbox_url: 'https://app.kinbox.com.br/chat/1013', phone: '(85) 99999-1013', uf: 'CE' },
  { id: '1014', title: 'Juliana Castro', source_id: 'GOOGLE_SEARCH', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1014', phone: '(51) 99999-1014', uf: 'RS' },
  
  // Prospecção
  { id: '1015', title: 'Felipe Nunes', source_id: 'PROSPECCAO', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1015', phone: '(85) 99999-1015', uf: 'CE' },
  { id: '1016', title: 'Beatriz Ramos', source_id: 'PROSPECCAO', status_id: 'CONVERTED', date_create: generateDate(11), kinbox_url: 'https://app.kinbox.com.br/chat/1016', phone: '(62) 99999-1016', uf: 'GO' },
  { id: '1017', title: 'Gustavo Pereira', source_id: 'INDICACAO_PROFISSIONAL', status_id: 'IN_PROCESS', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1017', phone: '(61) 99999-1017', uf: 'DF' },
  { id: '1018', title: 'Amanda Ribeiro', source_id: 'SITE', status_id: 'JUNK', date_create: generateDate(15), kinbox_url: 'https://app.kinbox.com.br/chat/1018', phone: '(91) 99999-1018', discard_reason: 'Spam', uf: 'PA' },
  { id: '1019', title: 'Thiago Cardoso', source_id: 'ORGANIC', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1019', phone: '(85) 99999-1019', uf: 'CE' },
  { id: '1020', title: 'Vanessa Moreira', source_id: 'CFA', status_id: 'CONVERTED', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1020', phone: '(85) 99999-1020', uf: 'CE' },
  
  // More Meta Ads
  { id: '1021', title: 'Leonardo Freitas', source_id: 'UC_HCJB1D', status_id: 'IN_PROCESS', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1021', phone: '(86) 99999-1021', uf: 'PI' },
  { id: '1022', title: 'Isabela Gomes', source_id: 'FB_LOOKALIKE', status_id: 'CONVERTED', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1022', phone: '(85) 99999-1022', uf: 'CE' },
  { id: '1023', title: 'Rafael Azevedo', source_id: 'IG_REELS', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1023', phone: '(98) 99999-1023', uf: 'MA' },
  { id: '1024', title: 'Natalia Teixeira', source_id: 'UC_HCJB1D', status_id: 'JUNK', date_create: generateDate(20), kinbox_url: 'https://app.kinbox.com.br/chat/1024', phone: '(85) 99999-1024', discard_reason: 'Concorrência', uf: 'CE' },
  { id: '1025', title: 'Diego Campos', source_id: 'YOUTUBE', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1025', phone: '(11) 99999-1025', uf: 'SP' },
  
  // More Google Ads
  { id: '1026', title: 'Larissa Vieira', source_id: 'GOOGLE_SEARCH', status_id: 'CONVERTED', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1026', phone: '(85) 99999-1026', uf: 'CE' },
  { id: '1027', title: 'Henrique Cunha', source_id: 'GADS_REMARKETING', status_id: 'NEW', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1027', phone: '(21) 99999-1027', uf: 'RJ' },
  { id: '1028', title: 'Priscila Lopes', source_id: 'UC_GOOGLE', status_id: 'IN_PROCESS', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1028', phone: '(31) 99999-1028', uf: 'MG' },
  { id: '1029', title: 'Eduardo Nascimento', source_id: 'GOOGLE_PMAX', status_id: 'JUNK', date_create: generateDate(18), kinbox_url: 'https://app.kinbox.com.br/chat/1029', phone: '(71) 99999-1029', discard_reason: 'Orçamento insuficiente', uf: 'BA' },
  { id: '1030', title: 'Aline Monteiro', source_id: 'GADS_SEARCH', status_id: 'CONVERTED', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1030', phone: '(85) 99999-1030', uf: 'CE' },
  
  // More Prospecção/Indicação
  { id: '1031', title: 'Vinicius Araujo', source_id: 'VITRINE', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1031', phone: '(85) 99999-1031', uf: 'CE' },
  { id: '1032', title: 'Gabriela Pinto', source_id: 'INDICACAO_AMIGO', status_id: 'IN_PROCESS', date_create: generateDate(9), kinbox_url: 'https://app.kinbox.com.br/chat/1032', phone: '(81) 99999-1032', uf: 'PE' },
  { id: '1033', title: 'Marcelo Correia', source_id: 'EVENTOS', status_id: 'CONVERTED', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1033', phone: '(85) 99999-1033', uf: 'CE' },
  { id: '1034', title: 'Renata Farias', source_id: 'ENCARTE', status_id: 'JUNK', date_create: generateDate(14), kinbox_url: 'https://app.kinbox.com.br/chat/1034', phone: '(41) 99999-1034', discard_reason: 'Não respondeu', uf: 'PR' },
  { id: '1035', title: 'Fabio Santos', source_id: 'ATIVACAO', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1035', phone: '(85) 99999-1035', uf: 'CE' },
  
  // Additional variety
  { id: '1036', title: 'Claudia Reis', source_id: 'UC_HCJB1D', status_id: 'IN_PROCESS', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1036', phone: '(11) 99999-1036', uf: 'SP' },
  { id: '1037', title: 'Anderson Silva', source_id: 'CORPORATIVO', status_id: 'CONVERTED', date_create: generateDate(10), kinbox_url: 'https://app.kinbox.com.br/chat/1037', phone: '(85) 99999-1037', uf: 'CE' },
  { id: '1038', title: 'Monica Duarte', source_id: 'GOOGLE_SEARCH', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1038', phone: '(21) 99999-1038', uf: 'RJ' },
  { id: '1039', title: 'Paulo Henrique', source_id: 'IG_DM', status_id: 'JUNK', date_create: generateDate(25), kinbox_url: 'https://app.kinbox.com.br/chat/1039', phone: '(31) 99999-1039', discard_reason: 'Duplicado', uf: 'MG' },
  { id: '1040', title: 'Sandra Machado', source_id: 'GADS_DISPLAY', status_id: 'IN_PROCESS', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1040', phone: '(85) 99999-1040', uf: 'CE' },
  { id: '1041', title: 'Rodrigo Ferraz', source_id: 'LTV', status_id: 'CONVERTED', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1041', phone: '(85) 99999-1041', uf: 'CE' },
  { id: '1042', title: 'Tatiane Borges', source_id: 'UC_HCJB1D', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1042', phone: '(71) 99999-1042', uf: 'BA' },
  { id: '1043', title: 'Alexandre Moura', source_id: 'INDICACAO_PROFISSIONAL', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1043', phone: '(85) 99999-1043', uf: 'CE' },
  { id: '1044', title: 'Daniela Andrade', source_id: 'GOOGLE_SEARCH', status_id: 'JUNK', date_create: generateDate(16), kinbox_url: 'https://app.kinbox.com.br/chat/1044', phone: '(81) 99999-1044', discard_reason: 'Fora do perfil', uf: 'PE' },
  { id: '1045', title: 'Leandro Costa', source_id: 'FACEBOOK', status_id: 'CONVERTED', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1045', phone: '(85) 99999-1045', uf: 'CE' },
  { id: '1046', title: 'Simone Oliveira', source_id: 'FB_LEAD', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1046', phone: '(51) 99999-1046', uf: 'RS' },
  { id: '1047', title: 'Caio Barros', source_id: 'GADS_VIDEO', status_id: 'IN_PROCESS', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1047', phone: '(85) 99999-1047', uf: 'CE' },
  { id: '1048', title: 'Elaine Souza', source_id: 'ORGANIC', status_id: 'CONVERTED', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/1048', phone: '(62) 99999-1048', uf: 'GO' },
  { id: '1049', title: 'Hugo Fernandes', source_id: 'UC_HCJB1D', status_id: 'JUNK', date_create: generateDate(22), kinbox_url: 'https://app.kinbox.com.br/chat/1049', phone: '(85) 99999-1049', discard_reason: 'Desistiu', uf: 'CE' },
  { id: '1050', title: 'Adriana Lima', source_id: 'INDICACAO_AMIGO', status_id: 'NEW', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1050', phone: '(85) 99999-1050', uf: 'CE' },
];

// Mock Deals Data (30+ records)
export const mockDeals: CRMDeal[] = [
  // Varejo (category_id = 8) - WON
  { id: '2001', title: 'Venda João Silva', opportunity: 1500, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1001', lead_id: '1001', source_id: 'UC_HCJB1D' },
  { id: '2002', title: 'Venda Carlos Ferreira', opportunity: 2200, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1005', lead_id: '1005', source_id: 'INDICACAO_AMIGO' },
  { id: '2003', title: 'Venda Marcos Souza', opportunity: 1800, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1009', lead_id: '1009', source_id: 'GOOGLE_SEARCH' },
  { id: '2004', title: 'Venda Bruno Martins', opportunity: 3500, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(9), kinbox_url: 'https://app.kinbox.com.br/chat/1013', lead_id: '1013', source_id: 'GADS_YOUTUBE' },
  { id: '2005', title: 'Venda Beatriz Ramos', opportunity: 1200, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(11), kinbox_url: 'https://app.kinbox.com.br/chat/1016', lead_id: '1016', source_id: 'PROSPECCAO' },
  { id: '2006', title: 'Venda Vanessa Moreira', opportunity: 2800, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1020', lead_id: '1020', source_id: 'CFA' },
  { id: '2007', title: 'Venda Isabela Gomes', opportunity: 1900, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1022', lead_id: '1022', source_id: 'FB_LOOKALIKE' },
  { id: '2008', title: 'Venda Larissa Vieira', opportunity: 2100, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1026', lead_id: '1026', source_id: 'GOOGLE_SEARCH' },
  { id: '2009', title: 'Venda Aline Monteiro', opportunity: 1650, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1030', lead_id: '1030', source_id: 'GADS_SEARCH' },
  { id: '2010', title: 'Venda Anderson Silva', opportunity: 2400, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(10), kinbox_url: 'https://app.kinbox.com.br/chat/1037', lead_id: '1037', source_id: 'CORPORATIVO' },
  { id: '2011', title: 'Venda Rodrigo Ferraz', opportunity: 1750, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1041', lead_id: '1041', source_id: 'LTV' },
  { id: '2012', title: 'Venda Elaine Souza', opportunity: 2050, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/1048', lead_id: '1048', source_id: 'ORGANIC' },
  
  // Projeto (category_id = 126, 134, 298) - WON
  { id: '2013', title: 'Projeto Marcelo Correia', opportunity: 15000, stage_id: 'C126:WON', category_id: '126', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1033', lead_id: '1033', source_id: 'EVENTOS' },
  { id: '2014', title: 'Projeto Leandro Costa', opportunity: 22000, stage_id: 'C134:WON', category_id: '134', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1045', lead_id: '1045', source_id: 'FACEBOOK' },
  { id: '2015', title: 'Projeto Enterprise A', opportunity: 45000, stage_id: 'C126:IN_PROGRESS', category_id: '126', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/2015', source_id: 'GOOGLE_SEARCH' },
  { id: '2016', title: 'Projeto Enterprise B', opportunity: 32000, stage_id: 'C134:WON', category_id: '134', date_create: generateDate(15), kinbox_url: 'https://app.kinbox.com.br/chat/2016', source_id: 'INDICACAO_PROFISSIONAL' },
  { id: '2017', title: 'Projeto Corporativo X', opportunity: 28000, stage_id: 'C298:WON', category_id: '298', date_create: generateDate(20), kinbox_url: 'https://app.kinbox.com.br/chat/2017', source_id: 'CORPORATIVO' },
  { id: '2018', title: 'Projeto Integração Y', opportunity: 18500, stage_id: 'C126:WON', category_id: '126', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/2018', source_id: 'PROSPECCAO' },
  { id: '2019', title: 'Projeto Automação Z', opportunity: 55000, stage_id: 'C134:IN_PROGRESS', category_id: '134', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/2019', source_id: 'GADS_DISPLAY' },
  { id: '2020', title: 'Projeto Escalabilidade', opportunity: 38000, stage_id: 'C298:WON', category_id: '298', date_create: generateDate(18), kinbox_url: 'https://app.kinbox.com.br/chat/2020', source_id: 'UC_HCJB1D' },
  
  // Lost deals
  { id: '2021', title: 'Negócio Perdido 1', opportunity: 5000, stage_id: 'C8:LOSE', category_id: '8', date_create: generateDate(25), kinbox_url: 'https://app.kinbox.com.br/chat/2021', source_id: 'GOOGLE_SEARCH' },
  { id: '2022', title: 'Negócio Perdido 2', opportunity: 12000, stage_id: 'C126:LOSE', category_id: '126', date_create: generateDate(30), kinbox_url: 'https://app.kinbox.com.br/chat/2022', source_id: 'FB_CAMPANHA_01' },
  { id: '2023', title: 'Negócio Perdido 3', opportunity: 3200, stage_id: 'C8:LOSE', category_id: '8', date_create: generateDate(22), kinbox_url: 'https://app.kinbox.com.br/chat/2023', source_id: 'INDICACAO_AMIGO' },
  { id: '2024', title: 'Negócio Perdido 4', opportunity: 8500, stage_id: 'C134:LOSE', category_id: '134', date_create: generateDate(19), kinbox_url: 'https://app.kinbox.com.br/chat/2024', source_id: 'VITRINE' },
  
  // In progress / Pipeline
  { id: '2025', title: 'Em Negociação 1', opportunity: 4500, stage_id: 'C8:NEGOTIATION', category_id: '8', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/2025', source_id: 'UC_HCJB1D' },
  { id: '2026', title: 'Em Negociação 2', opportunity: 8900, stage_id: 'C126:PROPOSAL', category_id: '126', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/2026', source_id: 'GOOGLE_SEARCH' },
  { id: '2027', title: 'Em Negociação 3', opportunity: 2100, stage_id: 'C8:CONTACT', category_id: '8', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/2027', source_id: 'PROSPECCAO' },
  { id: '2028', title: 'Em Negociação 4', opportunity: 15000, stage_id: 'C134:PROPOSAL', category_id: '134', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/2028', source_id: 'EVENTOS' },
  { id: '2029', title: 'Em Negociação 5', opportunity: 3800, stage_id: 'C8:NEGOTIATION', category_id: '8', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/2029', source_id: 'CFA' },
  { id: '2030', title: 'Em Negociação 6', opportunity: 6200, stage_id: 'C126:CONTACT', category_id: '126', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/2030', source_id: 'INDICACAO_PROFISSIONAL' },
  
  // Zero value deals (orçados sem valor ainda)
  { id: '2031', title: 'Orçamento Pendente 1', opportunity: 0, stage_id: 'C8:CONTACT', category_id: '8', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/2031', source_id: 'SITE' },
  { id: '2032', title: 'Orçamento Pendente 2', opportunity: 0, stage_id: 'C126:CONTACT', category_id: '126', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/2032', source_id: 'YOUTUBE' },
];
