-- ==============================================================================
-- SCHEMA COMPLETO DO BANCO DE DADOS - ACHEI AQUI GO (REGIÃO LESTE)
-- Banco: PostgreSQL via Supabase
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Lojas
CREATE TABLE IF NOT EXISTS public.lojas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    endereco VARCHAR(255),
    descricao TEXT,
    produtos_destaque TEXT,
    whatsapp VARCHAR(20) NOT NULL, -- Formato: 5562999999999
    avaliacao NUMERIC(2,1) DEFAULT 5.0 CHECK (avaliacao >= 0 AND avaliacao <= 5.0),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'suspenso')),
    aberto BOOLEAN DEFAULT true,
    destaque BOOLEAN DEFAULT false,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    instagram VARCHAR(80),
    horario_funcionamento VARCHAR(150) DEFAULT 'Seg a Sex: 08h às 18h | Sáb: 08h às 13h',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Métricas e Leads (Cliques no WhatsApp)
CREATE TABLE IF NOT EXISTS public.metricas_cliques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID REFERENCES public.lojas(id) ON DELETE CASCADE,
    origem VARCHAR(50) DEFAULT 'whatsapp_button',
    bairro_cliente VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Índices para Otimização de Busca e Performance
CREATE INDEX IF NOT EXISTS idx_lojas_status ON public.lojas(status);
CREATE INDEX IF NOT EXISTS idx_lojas_bairro ON public.lojas(bairro);
CREATE INDEX IF NOT EXISTS idx_lojas_categoria ON public.lojas(categoria);
CREATE INDEX IF NOT EXISTS idx_metricas_loja_id ON public.metricas_cliques(loja_id);

-- 5. Trigger para Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_lojas_updated_at ON public.lojas;
CREATE TRIGGER trigger_lojas_updated_at
    BEFORE UPDATE ON public.lojas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURANÇA CONTRA INVASÕES E VAZAMENTO DE DADOS
-- ==============================================================================
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_cliques ENABLE ROW LEVEL SECURITY;

-- Política 1: O público geral pode ver apenas lojas com status 'ativo'
CREATE POLICY "Lojas públicas ativas visíveis para todos"
    ON public.lojas
    FOR SELECT
    USING (status = 'ativo');

-- Política 2: Qualquer lojista pode solicitar auto-cadastro (criação com status 'pendente')
CREATE POLICY "Auto-cadastro público como pendente"
    ON public.lojas
    FOR INSERT
    WITH CHECK (status = 'pendente');

-- Política 3: Usuários autenticados (Admin via Supabase Auth) têm acesso total às lojas
CREATE POLICY "Admin tem controle total das lojas"
    ON public.lojas
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política 4: O público pode registrar cliques no botão do WhatsApp para métricas
CREATE POLICY "Registro público de métricas de clique"
    ON public.metricas_cliques
    FOR INSERT
    WITH CHECK (true);

-- Política 5: Apenas Admin pode ler as métricas de cliques
CREATE POLICY "Admin lê métricas de cliques"
    ON public.metricas_cliques
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- ==============================================================================
-- DADOS INICIAIS (SEED) - 8 LOJAS CONSOLIDADAS DA REGIÃO LESTE
-- ==============================================================================
INSERT INTO public.lojas (nome, categoria, bairro, endereco, produtos_destaque, whatsapp, avaliacao, status, aberto, destaque, latitude, longitude, horario_funcionamento)
VALUES
(
    'Materiais Novo Mundo',
    'Materiais de Construção',
    'Jardim Novo Mundo',
    'Av. New York, Qd. 45, Jardim Novo Mundo, Goiânia - GO',
    'Cimento, areia, brita, tintas e ferramentas',
    '5562996707046',
    4.8,
    'ativo',
    true,
    true,
    -16.6852,
    -49.2154,
    'Seg a Sex: 07:30 às 18:00 | Sáb: 07:30 às 12:30'
),
(
    'Auto Peças Vila Pedroso',
    'Auto Peças',
    'Vila Pedroso',
    'Av. Anápolis, Vila Pedroso, Goiânia - GO',
    'Pastilhas de freio, óleo de motor, filtros, baterias',
    '5562996707046',
    4.6,
    'ativo',
    true,
    false,
    -16.6698,
    -49.1823,
    'Seg a Sex: 08:00 às 18:00 | Sáb: 08:00 às 13:00'
),
(
    'Padaria Aroeiras',
    'Padaria',
    'Aroeiras',
    'Rua das Palmeiras, Setor Aroeiras, Goiânia - GO',
    'Pão francês quentinho, roscas caseiras, café e frios',
    '5562996707046',
    4.9,
    'ativo',
    true,
    true,
    -16.6781,
    -49.1932,
    'Seg a Dom: 06:00 às 20:30'
),
(
    'Farmácia Popular Leste',
    'Farmácia',
    'Jardim Novo Mundo',
    'Av. Buenos Aires, Jardim Novo Mundo, Goiânia - GO',
    'Medicamentos, perfumaria, fraldas e genéricos com desconto',
    '5562996707046',
    4.7,
    'ativo',
    true,
    false,
    -16.6874,
    -49.2120,
    'Seg a Sáb: 07:00 às 22:00 | Dom: 08:00 às 14:00'
),
(
    'Mercadinho Riviera',
    'Mercado',
    'Riviera',
    'Rua R-12, Residencial Riviera, Goiânia - GO',
    'Hortifruti fresco, carnes, bebidas geladas e mercearia',
    '5562996707046',
    4.5,
    'ativo',
    true,
    false,
    -16.6991,
    -49.2015,
    'Seg a Sáb: 07:30 às 20:00 | Dom: 07:30 às 13:00'
),
(
    'Bolo da Vó - Alphaville',
    'Confeitaria',
    'Alphaville Flamboyant',
    'Av. Alphaville, Alphaville Flamboyant, Goiânia - GO',
    'Bolos caseiros, bolo de cenoura com chocolate, tortas finas',
    '5562996707046',
    5.0,
    'ativo',
    true,
    true,
    -16.7112,
    -49.2189,
    'Ter a Sáb: 09:00 às 19:00 | Dom: 09:00 às 14:00'
),
(
    'DELÍCIAS DA ANA',
    'Confeitaria',
    'Jardim Novo Mundo',
    'Rua Bogotá, Jardim Novo Mundo, Goiânia - GO',
    'Bolos no pote, doces para festa, trufas e brownies',
    '5562996707046',
    5.0,
    'ativo',
    true,
    true,
    -16.6860,
    -49.2140,
    'Seg a Sáb: 08:30 às 18:30'
),
(
    'Barbearia Estilo Leste',
    'Barbearia',
    'Jardim Goiás',
    'Av. Jamel Cecílio, Jardim Goiás, Goiânia - GO',
    'Corte degradê, barba na toalha quente, pigmentação',
    '5562996707046',
    4.9,
    'ativo',
    true,
    false,
    -16.7025,
    -49.2341,
    'Ter a Sáb: 09:00 às 20:00'
)
ON CONFLICT DO NOTHING;
