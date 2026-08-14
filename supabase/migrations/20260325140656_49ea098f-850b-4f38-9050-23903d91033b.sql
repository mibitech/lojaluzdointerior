
-- Correspondências da Secretaria
CREATE TABLE public.secretary_correspondence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number text NOT NULL,
  correspondence_type text NOT NULL DEFAULT 'Entrada',
  correspondence_date date NOT NULL DEFAULT CURRENT_DATE,
  sender text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  content text,
  category text NOT NULL DEFAULT 'Administrativa',
  priority text NOT NULL DEFAULT 'Normal',
  status text NOT NULL DEFAULT 'Recebida',
  related_correspondence_id uuid REFERENCES public.secretary_correspondence(id),
  internal_notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secretary_correspondence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view secretary_correspondence" ON public.secretary_correspondence FOR SELECT TO authenticated USING (true);
CREATE POLICY "Commission members can manage secretary_correspondence" ON public.secretary_correspondence FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true));

-- Arquivos/Documentos da Secretaria
CREATE TABLE public.secretary_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Outro',
  access_type text NOT NULL DEFAULT 'Público (todos obreiros)',
  document_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  linked_profile_id uuid REFERENCES public.profiles(id),
  linked_minute_id uuid REFERENCES public.meeting_minutes(id),
  linked_correspondence_id uuid REFERENCES public.secretary_correspondence(id),
  tags text[],
  file_url text,
  file_name text,
  file_type text,
  file_size bigint,
  description text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secretary_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view secretary_documents" ON public.secretary_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Commission members can manage secretary_documents" ON public.secretary_documents FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true));

-- Convocações
CREATE TABLE public.secretary_convocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type text NOT NULL DEFAULT 'Ordinária',
  convocation_date date NOT NULL DEFAULT CURRENT_DATE,
  convocation_time time,
  location text,
  agenda_items text[] DEFAULT '{}',
  recipients_type text NOT NULL DEFAULT 'Todos os obreiros',
  send_channel text NOT NULL DEFAULT 'E-mail',
  status text NOT NULL DEFAULT 'Rascunho',
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secretary_convocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view secretary_convocations" ON public.secretary_convocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Commission members can manage secretary_convocations" ON public.secretary_convocations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true));

-- Certidões e Declarações
CREATE TABLE public.secretary_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type text NOT NULL DEFAULT 'Certidão de Regularidade',
  profile_id uuid REFERENCES public.profiles(id),
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  registration_number text,
  purpose text,
  status text NOT NULL DEFAULT 'Emitida',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.secretary_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view secretary_certificates" ON public.secretary_certificates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Commission members can manage secretary_certificates" ON public.secretary_certificates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true));

-- Storage bucket for secretary documents
INSERT INTO storage.buckets (id, name, public) VALUES ('secretary-documents', 'secretary-documents', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload secretary docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'secretary-documents');
CREATE POLICY "Authenticated users can view secretary docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'secretary-documents');
CREATE POLICY "Authenticated users can delete secretary docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'secretary-documents');

-- Correspondence attachments storage
INSERT INTO storage.buckets (id, name, public) VALUES ('secretary-correspondence', 'secretary-correspondence', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload correspondence files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'secretary-correspondence');
CREATE POLICY "Authenticated users can view correspondence files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'secretary-correspondence');
CREATE POLICY "Authenticated users can delete correspondence files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'secretary-correspondence');
