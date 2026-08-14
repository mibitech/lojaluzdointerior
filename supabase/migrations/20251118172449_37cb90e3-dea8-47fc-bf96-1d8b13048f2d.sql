-- Create books table
CREATE TABLE public.books (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  description text,
  recommendation text,
  cover_image_url text,
  isbn text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create book loans table
CREATE TABLE public.book_loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  borrower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  loan_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  return_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create articles table
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create glossary terms table
CREATE TABLE public.glossary_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term text NOT NULL,
  definition text NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create FAQ items table
CREATE TABLE public.faq_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for books
CREATE POLICY "Authenticated users can view books"
  ON public.books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Commission members can manage books"
  ON public.books FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- RLS Policies for book loans
CREATE POLICY "Authenticated users can view book loans"
  ON public.book_loans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Commission members can manage book loans"
  ON public.book_loans FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- RLS Policies for articles
CREATE POLICY "Authenticated users can view articles"
  ON public.articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Commission members can manage articles"
  ON public.articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- RLS Policies for glossary terms
CREATE POLICY "Authenticated users can view glossary terms"
  ON public.glossary_terms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Commission members can manage glossary terms"
  ON public.glossary_terms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- RLS Policies for FAQ items
CREATE POLICY "Authenticated users can view FAQ items"
  ON public.faq_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Commission members can manage FAQ items"
  ON public.faq_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- Create storage bucket for articles
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles', 'articles', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for articles bucket
CREATE POLICY "Authenticated users can view articles"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'articles');

CREATE POLICY "Authenticated users can upload articles"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'articles');

CREATE POLICY "Commission members can delete articles"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'articles' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_commission_member = true
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_book_loans_updated_at
  BEFORE UPDATE ON public.book_loans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_glossary_terms_updated_at
  BEFORE UPDATE ON public.glossary_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();