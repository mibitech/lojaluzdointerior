
-- Financial categories enum
CREATE TYPE public.financial_transaction_type AS ENUM ('receita', 'despesa');

-- Financial transactions table
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type financial_transaction_type NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_month TEXT,
  profile_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investment accounts table
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'investimento',
  institution TEXT,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Investment movements table (linked to accounts)
CREATE TABLE public.financial_account_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- 'aplicacao', 'resgate', 'rendimento'
  amount NUMERIC(12,2) NOT NULL,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_account_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_transactions
CREATE POLICY "Authenticated users can view financial transactions"
ON public.financial_transactions FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Commission members can manage financial transactions"
ON public.financial_transactions FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true
));

-- RLS Policies for financial_accounts
CREATE POLICY "Authenticated users can view financial accounts"
ON public.financial_accounts FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Commission members can manage financial accounts"
ON public.financial_accounts FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true
));

-- RLS Policies for financial_account_movements
CREATE POLICY "Authenticated users can view account movements"
ON public.financial_account_movements FOR SELECT
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Commission members can manage account movements"
ON public.financial_account_movements FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_commission_member = true
));

-- Updated_at triggers
CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_accounts_updated_at
  BEFORE UPDATE ON public.financial_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_account_movements_updated_at
  BEFORE UPDATE ON public.financial_account_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
