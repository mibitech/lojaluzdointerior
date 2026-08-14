ALTER TABLE public.visitors
  ADD COLUMN visit_date date DEFAULT CURRENT_DATE,
  ADD COLUMN birth_date date;