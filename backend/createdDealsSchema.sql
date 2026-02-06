CREATE TABLE IF NOT EXISTS cached_created_deals (
  id VARCHAR(50) PRIMARY KEY,
  titulo TEXT,
  valor DECIMAL(15,2) DEFAULT 0,
  segmento VARCHAR(50),
  fonte VARCHAR(100),
  uf VARCHAR(10),
  regional VARCHAR(50),
  motivo_perda TEXT,
  cidade TEXT,
  telefone VARCHAR(50),
  status_codigo VARCHAR(100),
  status_nome VARCHAR(50),
  responsavel_nome VARCHAR(100),
  criador_nome VARCHAR(100),
  funil VARCHAR(100),
  funil_id VARCHAR(20),
  is_novo BOOLEAN DEFAULT FALSE,
  is_fechado BOOLEAN DEFAULT FALSE,
  is_ganho BOOLEAN DEFAULT FALSE,
  link_bitrix TEXT,
  link_kinbox TEXT,
  data_criacao TIMESTAMPTZ,
  data_fechamento TIMESTAMPTZ,
  id_lead VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cached_deals_data_criacao ON cached_created_deals(data_criacao);
CREATE INDEX IF NOT EXISTS idx_cached_deals_funil_id ON cached_created_deals(funil_id);
CREATE INDEX IF NOT EXISTS idx_cached_deals_segmento ON cached_created_deals(segmento);
