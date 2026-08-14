
-- 1. Obreiros em Acompanhamento
CREATE TABLE public.hospitalar_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  situation_type text NOT NULL DEFAULT 'Outro',
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  responsible_id uuid REFERENCES public.profiles(id),
  description text,
  status text NOT NULL DEFAULT 'Ativo',
  priority text NOT NULL DEFAULT 'Média',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitalar_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hospitalar_cases" ON public.hospitalar_cases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Commission members can manage hospitalar_cases" ON public.hospitalar_cases
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );

-- 2. Registro de Visitas
CREATE TABLE public.hospitalar_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.hospitalar_cases(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id),
  visit_date timestamptz NOT NULL DEFAULT now(),
  visit_type text NOT NULL DEFAULT 'Presencial',
  report text,
  needs_identified text,
  actions_taken text,
  next_visit_date date,
  updated_situation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitalar_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hospitalar_visits" ON public.hospitalar_visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Commission members can manage hospitalar_visits" ON public.hospitalar_visits
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );

-- 3. Pedidos de Auxílio
CREATE TABLE public.hospitalar_aid_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_type text NOT NULL DEFAULT 'Obreiro',
  profile_id uuid REFERENCES public.profiles(id),
  aid_type text NOT NULL DEFAULT 'Financeiro',
  description text NOT NULL,
  requested_amount numeric,
  request_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Pendente',
  decision_date date,
  approved_amount numeric,
  decision_notes text,
  authorized_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitalar_aid_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hospitalar_aid_requests" ON public.hospitalar_aid_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Commission members can manage hospitalar_aid_requests" ON public.hospitalar_aid_requests
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );

-- 4. Ações Filantrópicas
CREATE TABLE public.hospitalar_philanthropy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  action_type text NOT NULL DEFAULT 'Outra',
  description text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  goal text,
  expected_beneficiaries integer,
  status text NOT NULL DEFAULT 'Planejada',
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitalar_philanthropy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hospitalar_philanthropy" ON public.hospitalar_philanthropy
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Commission members can manage hospitalar_philanthropy" ON public.hospitalar_philanthropy
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );

-- 5. Tronco de Beneficência
CREATE TABLE public.hospitalar_beneficence_fund (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_type text NOT NULL DEFAULT 'Entrada',
  origin text NOT NULL DEFAULT 'Outro',
  amount numeric NOT NULL,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  authorized_by uuid REFERENCES public.profiles(id),
  aid_request_id uuid REFERENCES public.hospitalar_aid_requests(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hospitalar_beneficence_fund ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hospitalar_beneficence_fund" ON public.hospitalar_beneficence_fund
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Commission members can manage hospitalar_beneficence_fund" ON public.hospitalar_beneficence_fund
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );
