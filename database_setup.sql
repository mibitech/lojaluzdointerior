-- ===================================
-- COMPLETE SUPABASE DATABASE SETUP
-- ===================================

-- Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- ===================================
-- FUNCTIONS
-- ===================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- TABLES
-- ===================================

-- Lodge Info Table
CREATE TABLE public.lodge_info (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    mission TEXT,
    vision TEXT,
    values TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    hero_image_url TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    photo_url TEXT,
    position TEXT,
    role TEXT DEFAULT 'member'::text,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Officers Table
CREATE TABLE public.officers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    photo_url TEXT,
    bio TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activities Table
CREATE TABLE public.activities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT NOT NULL,
    image_url TEXT,
    gallery_images TEXT[],
    event_date DATE,
    partnerships TEXT[],
    results TEXT,
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Articles Table
CREATE TABLE public.articles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    author_id UUID,
    is_published BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Educational Content Table
CREATE TABLE public.educational_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Events Table
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    image_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact Messages Table
CREATE TABLE public.contact_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Internal Documents Table
CREATE TABLE public.internal_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    category TEXT NOT NULL,
    access_level TEXT DEFAULT 'member'::text,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Member Messages Table
CREATE TABLE public.member_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    is_broadcast BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reserved Agenda Table
CREATE TABLE public.reserved_agenda (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    access_level TEXT DEFAULT 'member'::text,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===================================
-- TRIGGERS
-- ===================================

-- Triggers for updated_at columns
CREATE TRIGGER update_lodge_info_updated_at
    BEFORE UPDATE ON public.lodge_info
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_officers_updated_at
    BEFORE UPDATE ON public.officers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_content_updated_at
    BEFORE UPDATE ON public.educational_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_internal_documents_updated_at
    BEFORE UPDATE ON public.internal_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reserved_agenda_updated_at
    BEFORE UPDATE ON public.reserved_agenda
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ===================================
-- ROW LEVEL SECURITY
-- ===================================

-- Enable RLS on all tables
ALTER TABLE public.lodge_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserved_agenda ENABLE ROW LEVEL SECURITY;

-- ===================================
-- RLS POLICIES
-- ===================================

-- Lodge Info Policies
CREATE POLICY "Lodge info is viewable by everyone"
ON public.lodge_info
FOR SELECT
USING (true);

-- Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Officers Policies
CREATE POLICY "Officers are viewable by everyone"
ON public.officers
FOR SELECT
USING (active = true);

-- Activities Policies
CREATE POLICY "Public activities are viewable by everyone"
ON public.activities
FOR SELECT
USING (is_public = true);

CREATE POLICY "All activities are viewable by authenticated users"
ON public.activities
FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- Articles Policies
CREATE POLICY "Published public articles are viewable by everyone"
ON public.articles
FOR SELECT
USING ((is_published = true) AND (is_public = true));

CREATE POLICY "Private articles are viewable by authenticated users"
ON public.articles
FOR SELECT
USING ((auth.role() = 'authenticated'::text) OR ((is_published = true) AND (is_public = true)));

-- Educational Content Policies
CREATE POLICY "Educational content is viewable by everyone"
ON public.educational_content
FOR SELECT
USING (true);

-- Events Policies
CREATE POLICY "Public events are viewable by everyone"
ON public.events
FOR SELECT
USING (is_public = true);

CREATE POLICY "Private events are viewable by authenticated users"
ON public.events
FOR SELECT
USING ((auth.role() = 'authenticated'::text) OR (is_public = true));

-- Contact Messages Policies
CREATE POLICY "Anyone can insert contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

-- Internal Documents Policies
CREATE POLICY "Internal documents are viewable by authenticated users"
ON public.internal_documents
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can upload internal documents"
ON public.internal_documents
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Member Messages Policies
CREATE POLICY "Users can view their own messages"
ON public.member_messages
FOR SELECT
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id) OR (is_broadcast = true));

CREATE POLICY "Users can send messages"
ON public.member_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of their messages"
ON public.member_messages
FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Reserved Agenda Policies
CREATE POLICY "Reserved agenda is viewable by authenticated users"
ON public.reserved_agenda
FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Users can create agenda items"
ON public.reserved_agenda
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- ===================================
-- SAMPLE DATA
-- ===================================

-- Educational Content Sample Data
INSERT INTO public.educational_content (title, content, category, author, is_featured, sort_order) VALUES
('História da Maçonaria', 'A Maçonaria é uma das mais antigas organizações fraternas do mundo, com origens que remontam às corporações de pedreiros da Idade Média...', 'História', 'Sistema', true, 1),
('Princípios Fundamentais', 'A Maçonaria se baseia em três princípios fundamentais: Liberdade, Igualdade e Fraternidade...', 'Princípios', 'Sistema', true, 2),
('Símbolos Maçônicos', 'Os símbolos maçônicos são ferramentas de ensino que transmitem lições morais e filosóficas...', 'Símbolos', 'Sistema', false, 3),
('Ritual e Cerimônias', 'Os rituais maçônicos são cerimônias solenes que marcam momentos importantes na jornada do maçom...', 'Rituais', 'Sistema', false, 4),
('Graus Maçônicos', 'A Maçonaria é estruturada em graus, cada um representando um nível de conhecimento e responsabilidade...', 'Graus', 'Sistema', false, 5),
('Virtudes Cardeais', 'As quatro virtudes cardeais na Maçonaria são: Temperança, Fortitude, Prudência e Justiça...', 'Virtudes', 'Sistema', true, 6);

-- Activities Sample Data
INSERT INTO public.activities (title, description, content, category, partnerships, results, is_featured, event_date) VALUES
('Campanha do Agasalho 2024', 'Arrecadação de roupas e cobertores para famílias carentes', 'Nossa campanha anual do agasalho mobilizou toda a comunidade maçônica...', 'Beneficência', ARRAY['Casa do Menor', 'Lar dos Idosos'], '500 peças arrecadadas, 150 famílias beneficiadas', true, '2024-06-15'),
('Palestra sobre Valores Éticos', 'Evento aberto ao público sobre ética e moral', 'Palestra ministrada por renomado filósofo sobre a importância dos valores éticos...', 'Educação', ARRAY['Universidade Local', 'Instituto de Filosofia'], '200 participantes, grande repercussão na mídia', false, '2024-05-20'),
('Doação de Livros', 'Entrega de biblioteca completa para escola pública', 'Projeto de doação de 1000 livros para biblioteca escolar...', 'Educação', ARRAY['Escola Municipal Santos Dumont'], '1000 livros doados, biblioteca reformada', true, '2024-04-10');

-- ===================================
-- NOTES
-- ===================================

/*
Este script contém:

1. Criação de tipos customizados
2. Funções para triggers
3. Todas as tabelas do sistema
4. Triggers para atualização automática de timestamps
5. Habilitação de RLS em todas as tabelas
6. Todas as políticas de segurança (RLS)
7. Dados de exemplo para educational_content e activities

Para executar:
1. Execute este script em ordem no SQL Editor do Supabase
2. Certifique-se de que a autenticação está habilitada
3. Verifique se todas as políticas estão funcionando corretamente

Tabelas criadas:
- lodge_info: Informações da loja
- profiles: Perfis dos usuários
- officers: Oficiais da loja
- activities: Atividades e projetos
- articles: Artigos e publicações
- educational_content: Conteúdo educativo
- events: Eventos
- contact_messages: Mensagens de contato
- internal_documents: Documentos internos
- member_messages: Mensagens entre membros
- reserved_agenda: Agenda reservada

Recursos implementados:
- Autenticação de usuários
- Área pública e restrita
- Sistema de mensagens
- Upload de documentos
- Gestão de eventos e atividades
- Conteúdo educativo
- Formulário de contato
*/