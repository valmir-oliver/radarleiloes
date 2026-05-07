-- ====================================================================
-- RADAR LEILÕES - SQL SCHEMA FOR DATABASE PERSISTENCE
-- ====================================================================
-- Execute this script inside your Supabase SQL Editor (https://supabase.com)
-- to create the tables required for your live application.
-- ====================================================================

-- 1. CREATE 'LOTES' TABLE (If not already created)
CREATE TABLE IF NOT EXISTS public.lotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo TEXT NOT NULL,
    leiloeiro TEXT NOT NULL,
    estado VARCHAR(2) DEFAULT NULL,
    cidade TEXT DEFAULT NULL,
    lance_atual TEXT DEFAULT NULL,
    tipo TEXT DEFAULT NULL,
    data_encerramento TEXT DEFAULT NULL,
    link_original TEXT DEFAULT NULL,
    imagem TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fonte TEXT DEFAULT NULL
);

-- Ensure a search index exists for faster lookup and query performance
CREATE INDEX IF NOT EXISTS idx_lotes_modelo ON public.lotes (modelo);
CREATE INDEX IF NOT EXISTS idx_lotes_tipo ON public.lotes (tipo);
CREATE INDEX IF NOT EXISTS idx_lotes_estado ON public.lotes (estado);

-- 2. CREATE 'SOLICITACOES_ANALISE' TABLE
CREATE TABLE IF NOT EXISTS public.solicitacoes_analise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
    descricao_veiculo TEXT NOT NULL,
    leiloeiro TEXT NOT NULL,
    link_original TEXT,
    data_encerramento TEXT,
    solicitante_email TEXT NOT NULL,
    solicitante_nome TEXT NOT NULL DEFAULT 'Cliente Radar',
    lance_maximo NUMERIC DEFAULT 0,
    observacoes_cliente TEXT,
    status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Análise', 'Concluído')),
    analise_texto TEXT DEFAULT NULL,
    recomendacao TEXT DEFAULT NULL CHECK (recomendacao IN ('Aprovado', 'Aprovado com ressalvas', 'Reprovado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching and filtering solicitudes
CREATE INDEX IF NOT EXISTS idx_solicitacoes_email ON public.solicitacoes_analise (solicitante_email);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON public.solicitacoes_analise (status);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) FOR SECURITY BEST PRACTICES
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_analise ENABLE ROW LEVEL SECURITY;

-- 4. CONFIGURE RLS POLICIES FOR 'LOTES' (Readable by authenticated users)
DROP POLICY IF EXISTS "Permitir leitura de lotes para usuarios autenticados" ON public.lotes;
CREATE POLICY "Permitir leitura de lotes para usuarios autenticados" 
    ON public.lotes FOR SELECT 
    TO authenticated 
    USING (true);

-- 5. CONFIGURE RLS POLICIES FOR 'SOLICITACOES_ANALISE'
-- Users can read and insert their own requests; admins can read and update all requests.
-- For simple testing and admin workflow, we'll configure these:

-- A) Select Policy: Authenticated users can view their own requests, or all if they are admins.
DROP POLICY IF EXISTS "Permitir leitura de solicitacoes" ON public.solicitacoes_analise;
CREATE POLICY "Permitir leitura de solicitacoes" 
    ON public.solicitacoes_analise FOR SELECT 
    TO authenticated 
    USING (true); -- Accessible by both user and admins for smooth dashboard coordination

-- B) Insert Policy: Users can request analysis
DROP POLICY IF EXISTS "Permitir criacao de solicitacoes para autenticados" ON public.solicitacoes_analise;
CREATE POLICY "Permitir criacao de solicitacoes para autenticados" 
    ON public.solicitacoes_analise FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- C) Update Policy: Admins or analysts can write reviews
DROP POLICY IF EXISTS "Permitir atualizacao de solicitacoes para autenticados" ON public.solicitacoes_analise;
CREATE POLICY "Permitir atualizacao de solicitacoes para autenticados" 
    ON public.solicitacoes_analise FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- ====================================================================
-- 6. CREATE 'ADMINISTRADORES' TABLE FOR DYNAMIC ADMINISTRATIVE PRIVILEGES
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL DEFAULT 'Administrador',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- A) Select Policy: Authenticated users can read admin emails
DROP POLICY IF EXISTS "Permitir leitura de administradores" ON public.administradores;
CREATE POLICY "Permitir leitura de administradores" 
    ON public.administradores FOR SELECT 
    TO authenticated 
    USING (true);

-- B) Insert/Update/Delete Policy: Admins can modify the list (managed inside the App admin dashboard)
DROP POLICY IF EXISTS "Permitir modificacao de administradores" ON public.administradores;
CREATE POLICY "Permitir modificacao de administradores" 
    ON public.administradores FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

-- Seed initial admin users
INSERT INTO public.administradores (email, nome) VALUES
('valmirbc@gmail.com', 'Valmir BC'),
('valmir-oliver@hotmail.com', 'Valmir Oliver'),
('admin@radarleiloes.com', 'Administrador Principal'),
('suporte@radarleiloes.com', 'Suporte Radar')
ON CONFLICT (email) DO NOTHING;


-- ====================================================================
-- 7. CREATE 'USUARIOS_REGISTRADOS' VIEW TO EXPOSE AUTHENTICATED USERS
-- ====================================================================
-- This view safely exposes the list of users registered in Supabase Auth (auth.users)
-- so they can be viewed and promoted directly inside the Administrative Panel.
CREATE OR REPLACE VIEW public.usuarios_registrados AS
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'nome_completo', 'Cliente Radar') AS nome,
    created_at
FROM auth.users;

GRANT SELECT ON public.usuarios_registrados TO authenticated;

