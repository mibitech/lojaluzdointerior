-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT,
  role TEXT,
  position TEXT,
  photo_url TEXT,
  masonic_degree INTEGER DEFAULT 1,
  is_commission_member BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  location TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone if public" 
ON public.events FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Commission members can manage events" 
ON public.events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  partnerships TEXT,
  results TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activities are viewable by everyone if public" 
ON public.activities FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Commission members can manage activities" 
ON public.activities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create lodge_info table
CREATE TABLE public.lodge_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  mission TEXT,
  vision TEXT,
  values TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lodge_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lodge info is viewable by everyone" 
ON public.lodge_info FOR SELECT USING (true);

CREATE POLICY "Commission members can manage lodge info" 
ON public.lodge_info FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create officers table
CREATE TABLE public.officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers are viewable by everyone" 
ON public.officers FOR SELECT USING (true);

CREATE POLICY "Commission members can manage officers" 
ON public.officers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create worshipful_masters table
CREATE TABLE public.worshipful_masters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  installation_year INTEGER NOT NULL,
  term_start_date DATE NOT NULL,
  term_end_date DATE,
  bio TEXT,
  achievements TEXT,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.worshipful_masters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Worshipful masters are viewable by everyone" 
ON public.worshipful_masters FOR SELECT USING (true);

CREATE POLICY "Commission members can manage worshipful masters" 
ON public.worshipful_masters FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create study_works table
CREATE TABLE public.study_works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brother_name TEXT NOT NULL,
  work_title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  file_path TEXT,
  uploaded_by UUID REFERENCES auth.users,
  masonic_degree INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.study_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Study works are viewable by authenticated users" 
ON public.study_works FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own study works" 
ON public.study_works FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Commission members can manage study works" 
ON public.study_works FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create educational_content table
CREATE TABLE public.educational_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educational content is viewable by everyone if public" 
ON public.educational_content FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "Commission members can manage educational content" 
ON public.educational_content FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_commission_member = true)
);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lodge_info_updated_at BEFORE UPDATE ON public.lodge_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON public.officers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worshipful_masters_updated_at BEFORE UPDATE ON public.worshipful_masters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_works_updated_at BEFORE UPDATE ON public.study_works
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_educational_content_updated_at BEFORE UPDATE ON public.educational_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();