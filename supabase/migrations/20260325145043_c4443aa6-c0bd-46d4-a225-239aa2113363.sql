
-- Table for cargo delivery reports
CREATE TABLE public.management_cargo_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  vm_sainte_id UUID REFERENCES public.profiles(id),
  vm_entrante_id UUID REFERENCES public.profiles(id),
  session_date DATE,
  include_financeiro BOOLEAN NOT NULL DEFAULT true,
  include_hospitalaria BOOLEAN NOT NULL DEFAULT true,
  include_secretaria BOOLEAN NOT NULL DEFAULT true,
  include_chancelaria BOOLEAN NOT NULL DEFAULT true,
  include_audit_logs BOOLEAN NOT NULL DEFAULT false,
  observations TEXT,
  achievements TEXT,
  pending_items JSONB DEFAULT '[]'::jsonb,
  snapshot_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'Em Elaboração',
  signed_at TIMESTAMPTZ,
  signed_by UUID REFERENCES public.profiles(id),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.profiles(id),
  locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.management_cargo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cargo reports"
  ON public.management_cargo_reports FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Commission members can manage cargo reports"
  ON public.management_cargo_reports FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );

-- Table for audit logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  user_name TEXT,
  user_position TEXT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_label TEXT,
  previous_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commission members can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true)
  );

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_management_cargo_reports_updated_at
  BEFORE UPDATE ON public.management_cargo_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
