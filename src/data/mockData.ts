import { CRMLead, CRMDeal } from '@/types/crm';

// Generate realistic dates within the last 3 months
const generateDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Mock Leads Data (50+ records)
export const mockLeads: CRMLead[] = [
  // Meta Ads Leads
  { id: '1001', title: 'João Silva', source_id: 'UC_HCJB1D', status_id: 'CONVERTED', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1001', phone: '(11) 99999-1001' },
  { id: '1002', title: 'Maria Santos', source_id: 'FB_CAMPANHA_01', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1002', phone: '(11) 99999-1002' },
  { id: '1003', title: 'Pedro Oliveira', source_id: 'IG_STORIES_02', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1003', phone: '(11) 99999-1003' },
  { id: '1004', title: 'Ana Costa', source_id: 'UC_HCJB1D', status_id: 'JUNK', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1004', phone: '(11) 99999-1004', discard_reason: 'Sem interesse' },
  { id: '1005', title: 'Carlos Ferreira', source_id: 'META_LEAD_03', status_id: 'CONVERTED', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1005', phone: '(11) 99999-1005' },
  { id: '1006', title: 'Lucia Mendes', source_id: 'FB_REMARKETING', status_id: 'IN_PROCESS', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1006', phone: '(11) 99999-1006' },
  { id: '1007', title: 'Roberto Lima', source_id: 'INSTAGRAM', status_id: 'JUNK', date_create: generateDate(10), kinbox_url: 'https://app.kinbox.com.br/chat/1007', phone: '(11) 99999-1007', discard_reason: 'Número errado' },
  { id: '1008', title: 'Fernanda Rocha', source_id: 'UC_HCJB1D', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1008', phone: '(11) 99999-1008' },
  
  // Google Ads Leads
  { id: '1009', title: 'Marcos Souza', source_id: 'GOOGLE_SEARCH', status_id: 'CONVERTED', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1009', phone: '(11) 99999-1009' },
  { id: '1010', title: 'Patricia Alves', source_id: 'GADS_DISPLAY', status_id: 'IN_PROCESS', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1010', phone: '(11) 99999-1010' },
  { id: '1011', title: 'Ricardo Barbosa', source_id: 'UC_GOOGLE', status_id: 'NEW', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1011', phone: '(11) 99999-1011' },
  { id: '1012', title: 'Camila Dias', source_id: 'GOOGLE_SHOPPING', status_id: 'JUNK', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/1012', phone: '(11) 99999-1012', discard_reason: 'Fora da área' },
  { id: '1013', title: 'Bruno Martins', source_id: 'GADS_YOUTUBE', status_id: 'CONVERTED', date_create: generateDate(9), kinbox_url: 'https://app.kinbox.com.br/chat/1013', phone: '(11) 99999-1013' },
  { id: '1014', title: 'Juliana Castro', source_id: 'GOOGLE_SEARCH', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1014', phone: '(11) 99999-1014' },
  
  // Organic/Other Leads
  { id: '1015', title: 'Felipe Nunes', source_id: 'WEBFORM', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1015', phone: '(11) 99999-1015' },
  { id: '1016', title: 'Beatriz Ramos', source_id: 'CALLBACK', status_id: 'CONVERTED', date_create: generateDate(11), kinbox_url: 'https://app.kinbox.com.br/chat/1016', phone: '(11) 99999-1016' },
  { id: '1017', title: 'Gustavo Pereira', source_id: 'REFERRAL', status_id: 'IN_PROCESS', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1017', phone: '(11) 99999-1017' },
  { id: '1018', title: 'Amanda Ribeiro', source_id: 'WEBFORM', status_id: 'JUNK', date_create: generateDate(15), kinbox_url: 'https://app.kinbox.com.br/chat/1018', phone: '(11) 99999-1018', discard_reason: 'Spam' },
  { id: '1019', title: 'Thiago Cardoso', source_id: 'ORGANIC', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1019', phone: '(11) 99999-1019' },
  { id: '1020', title: 'Vanessa Moreira', source_id: 'CALLBACK', status_id: 'CONVERTED', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1020', phone: '(11) 99999-1020' },
  
  // More Meta Ads
  { id: '1021', title: 'Leonardo Freitas', source_id: 'UC_HCJB1D', status_id: 'IN_PROCESS', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1021', phone: '(11) 99999-1021' },
  { id: '1022', title: 'Isabela Gomes', source_id: 'FB_LOOKALIKE', status_id: 'CONVERTED', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1022', phone: '(11) 99999-1022' },
  { id: '1023', title: 'Rafael Azevedo', source_id: 'IG_REELS', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1023', phone: '(11) 99999-1023' },
  { id: '1024', title: 'Natalia Teixeira', source_id: 'UC_HCJB1D', status_id: 'JUNK', date_create: generateDate(20), kinbox_url: 'https://app.kinbox.com.br/chat/1024', phone: '(11) 99999-1024', discard_reason: 'Concorrência' },
  { id: '1025', title: 'Diego Campos', source_id: 'META_CONVERSION', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1025', phone: '(11) 99999-1025' },
  
  // More Google Ads
  { id: '1026', title: 'Larissa Vieira', source_id: 'GOOGLE_SEARCH', status_id: 'CONVERTED', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1026', phone: '(11) 99999-1026' },
  { id: '1027', title: 'Henrique Cunha', source_id: 'GADS_REMARKETING', status_id: 'NEW', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1027', phone: '(11) 99999-1027' },
  { id: '1028', title: 'Priscila Lopes', source_id: 'UC_GOOGLE', status_id: 'IN_PROCESS', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1028', phone: '(11) 99999-1028' },
  { id: '1029', title: 'Eduardo Nascimento', source_id: 'GOOGLE_PMAX', status_id: 'JUNK', date_create: generateDate(18), kinbox_url: 'https://app.kinbox.com.br/chat/1029', phone: '(11) 99999-1029', discard_reason: 'Orçamento insuficiente' },
  { id: '1030', title: 'Aline Monteiro', source_id: 'GADS_SEARCH', status_id: 'CONVERTED', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1030', phone: '(11) 99999-1030' },
  
  // More Organic
  { id: '1031', title: 'Vinicius Araujo', source_id: 'WEBFORM', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1031', phone: '(11) 99999-1031' },
  { id: '1032', title: 'Gabriela Pinto', source_id: 'REFERRAL', status_id: 'IN_PROCESS', date_create: generateDate(9), kinbox_url: 'https://app.kinbox.com.br/chat/1032', phone: '(11) 99999-1032' },
  { id: '1033', title: 'Marcelo Correia', source_id: 'CALLBACK', status_id: 'CONVERTED', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1033', phone: '(11) 99999-1033' },
  { id: '1034', title: 'Renata Farias', source_id: 'ORGANIC', status_id: 'JUNK', date_create: generateDate(14), kinbox_url: 'https://app.kinbox.com.br/chat/1034', phone: '(11) 99999-1034', discard_reason: 'Não respondeu' },
  { id: '1035', title: 'Fabio Santos', source_id: 'WEBFORM', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1035', phone: '(11) 99999-1035' },
  
  // Additional variety
  { id: '1036', title: 'Claudia Reis', source_id: 'UC_HCJB1D', status_id: 'IN_PROCESS', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1036', phone: '(11) 99999-1036' },
  { id: '1037', title: 'Anderson Silva', source_id: 'FB_MESSENGER', status_id: 'CONVERTED', date_create: generateDate(10), kinbox_url: 'https://app.kinbox.com.br/chat/1037', phone: '(11) 99999-1037' },
  { id: '1038', title: 'Monica Duarte', source_id: 'GOOGLE_SEARCH', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1038', phone: '(11) 99999-1038' },
  { id: '1039', title: 'Paulo Henrique', source_id: 'IG_DM', status_id: 'JUNK', date_create: generateDate(25), kinbox_url: 'https://app.kinbox.com.br/chat/1039', phone: '(11) 99999-1039', discard_reason: 'Duplicado' },
  { id: '1040', title: 'Sandra Machado', source_id: 'GADS_DISPLAY', status_id: 'IN_PROCESS', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1040', phone: '(11) 99999-1040' },
  { id: '1041', title: 'Rodrigo Ferraz', source_id: 'WEBFORM', status_id: 'CONVERTED', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1041', phone: '(11) 99999-1041' },
  { id: '1042', title: 'Tatiane Borges', source_id: 'UC_HCJB1D', status_id: 'NEW', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/1042', phone: '(11) 99999-1042' },
  { id: '1043', title: 'Alexandre Moura', source_id: 'CALLBACK', status_id: 'IN_PROCESS', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/1043', phone: '(11) 99999-1043' },
  { id: '1044', title: 'Daniela Andrade', source_id: 'GOOGLE_SEARCH', status_id: 'JUNK', date_create: generateDate(16), kinbox_url: 'https://app.kinbox.com.br/chat/1044', phone: '(11) 99999-1044', discard_reason: 'Fora do perfil' },
  { id: '1045', title: 'Leandro Costa', source_id: 'META_CATALOG', status_id: 'CONVERTED', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1045', phone: '(11) 99999-1045' },
  { id: '1046', title: 'Simone Oliveira', source_id: 'FB_LEAD', status_id: 'NEW', date_create: generateDate(0), kinbox_url: 'https://app.kinbox.com.br/chat/1046', phone: '(11) 99999-1046' },
  { id: '1047', title: 'Caio Barros', source_id: 'GADS_VIDEO', status_id: 'IN_PROCESS', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1047', phone: '(11) 99999-1047' },
  { id: '1048', title: 'Elaine Souza', source_id: 'ORGANIC', status_id: 'CONVERTED', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/1048', phone: '(11) 99999-1048' },
  { id: '1049', title: 'Hugo Fernandes', source_id: 'UC_HCJB1D', status_id: 'JUNK', date_create: generateDate(22), kinbox_url: 'https://app.kinbox.com.br/chat/1049', phone: '(11) 99999-1049', discard_reason: 'Desistiu' },
  { id: '1050', title: 'Adriana Lima', source_id: 'REFERRAL', status_id: 'NEW', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1050', phone: '(11) 99999-1050' },
];

// Mock Deals Data (30+ records)
export const mockDeals: CRMDeal[] = [
  // Varejo (category_id = 8)
  { id: '2001', title: 'Venda João Silva', opportunity: 1500, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/1001', lead_id: '1001' },
  { id: '2002', title: 'Venda Carlos Ferreira', opportunity: 2200, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1005', lead_id: '1005' },
  { id: '2003', title: 'Venda Marcos Souza', opportunity: 1800, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1009', lead_id: '1009' },
  { id: '2004', title: 'Venda Bruno Martins', opportunity: 3500, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(9), kinbox_url: 'https://app.kinbox.com.br/chat/1013', lead_id: '1013' },
  { id: '2005', title: 'Venda Beatriz Ramos', opportunity: 1200, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(11), kinbox_url: 'https://app.kinbox.com.br/chat/1016', lead_id: '1016' },
  { id: '2006', title: 'Venda Vanessa Moreira', opportunity: 2800, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/1020', lead_id: '1020' },
  { id: '2007', title: 'Venda Isabela Gomes', opportunity: 1900, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1022', lead_id: '1022' },
  { id: '2008', title: 'Venda Larissa Vieira', opportunity: 2100, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(7), kinbox_url: 'https://app.kinbox.com.br/chat/1026', lead_id: '1026' },
  { id: '2009', title: 'Venda Aline Monteiro', opportunity: 1650, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1030', lead_id: '1030' },
  { id: '2010', title: 'Venda Anderson Silva', opportunity: 2400, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(10), kinbox_url: 'https://app.kinbox.com.br/chat/1037', lead_id: '1037' },
  { id: '2011', title: 'Venda Rodrigo Ferraz', opportunity: 1750, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/1041', lead_id: '1041' },
  { id: '2012', title: 'Venda Elaine Souza', opportunity: 2050, stage_id: 'C8:WON', category_id: '8', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/1048', lead_id: '1048' },
  
  // Projeto (category_id = 126, 134, 298)
  { id: '2013', title: 'Projeto Marcelo Correia', opportunity: 15000, stage_id: 'C126:WON', category_id: '126', date_create: generateDate(6), kinbox_url: 'https://app.kinbox.com.br/chat/1033', lead_id: '1033' },
  { id: '2014', title: 'Projeto Leandro Costa', opportunity: 22000, stage_id: 'C134:WON', category_id: '134', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/1045', lead_id: '1045' },
  { id: '2015', title: 'Projeto Enterprise A', opportunity: 45000, stage_id: 'C126:IN_PROGRESS', category_id: '126', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/2015' },
  { id: '2016', title: 'Projeto Enterprise B', opportunity: 32000, stage_id: 'C134:WON', category_id: '134', date_create: generateDate(15), kinbox_url: 'https://app.kinbox.com.br/chat/2016' },
  { id: '2017', title: 'Projeto Corporativo X', opportunity: 28000, stage_id: 'C298:WON', category_id: '298', date_create: generateDate(20), kinbox_url: 'https://app.kinbox.com.br/chat/2017' },
  { id: '2018', title: 'Projeto Integração Y', opportunity: 18500, stage_id: 'C126:WON', category_id: '126', date_create: generateDate(12), kinbox_url: 'https://app.kinbox.com.br/chat/2018' },
  { id: '2019', title: 'Projeto Automação Z', opportunity: 55000, stage_id: 'C134:IN_PROGRESS', category_id: '134', date_create: generateDate(8), kinbox_url: 'https://app.kinbox.com.br/chat/2019' },
  { id: '2020', title: 'Projeto Escalabilidade', opportunity: 38000, stage_id: 'C298:WON', category_id: '298', date_create: generateDate(18), kinbox_url: 'https://app.kinbox.com.br/chat/2020' },
  
  // Lost deals
  { id: '2021', title: 'Negócio Perdido 1', opportunity: 5000, stage_id: 'C8:LOSE', category_id: '8', date_create: generateDate(25), kinbox_url: 'https://app.kinbox.com.br/chat/2021' },
  { id: '2022', title: 'Negócio Perdido 2', opportunity: 12000, stage_id: 'C126:LOSE', category_id: '126', date_create: generateDate(30), kinbox_url: 'https://app.kinbox.com.br/chat/2022' },
  { id: '2023', title: 'Negócio Perdido 3', opportunity: 3200, stage_id: 'C8:LOSE', category_id: '8', date_create: generateDate(22), kinbox_url: 'https://app.kinbox.com.br/chat/2023' },
  
  // In progress
  { id: '2024', title: 'Em Negociação 1', opportunity: 4500, stage_id: 'C8:NEGOTIATION', category_id: '8', date_create: generateDate(2), kinbox_url: 'https://app.kinbox.com.br/chat/2024' },
  { id: '2025', title: 'Em Negociação 2', opportunity: 8900, stage_id: 'C126:PROPOSAL', category_id: '126', date_create: generateDate(4), kinbox_url: 'https://app.kinbox.com.br/chat/2025' },
  { id: '2026', title: 'Em Negociação 3', opportunity: 2100, stage_id: 'C8:CONTACT', category_id: '8', date_create: generateDate(1), kinbox_url: 'https://app.kinbox.com.br/chat/2026' },
  { id: '2027', title: 'Em Negociação 4', opportunity: 15000, stage_id: 'C134:PROPOSAL', category_id: '134', date_create: generateDate(5), kinbox_url: 'https://app.kinbox.com.br/chat/2027' },
  { id: '2028', title: 'Em Negociação 5', opportunity: 3800, stage_id: 'C8:NEGOTIATION', category_id: '8', date_create: generateDate(3), kinbox_url: 'https://app.kinbox.com.br/chat/2028' },
];
