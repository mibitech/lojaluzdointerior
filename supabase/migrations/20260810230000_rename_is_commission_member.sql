BEGIN;
ALTER TABLE public.profiles RENAME COLUMN is_commission_member TO is_director_member;
DROP POLICY IF EXISTS "Commission members can manage activities" ON public.activities; CREATE POLICY "Commission members can manage activities" ON public.activities AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage articles" ON public.articles; CREATE POLICY "Commission members can manage articles" ON public.articles AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can view audit logs" ON public.audit_logs; CREATE POLICY "Commission members can view audit logs" ON public.audit_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage book loans" ON public.book_loans; CREATE POLICY "Commission members can manage book loans" ON public.book_loans AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage books" ON public.books; CREATE POLICY "Commission members can manage books" ON public.books AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage commemorative dates" ON public.commemorative_dates; CREATE POLICY "Commission members can manage commemorative dates" ON public.commemorative_dates AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage copo dagua calendar" ON public.copo_dagua_calendar; CREATE POLICY "Commission members can manage copo dagua calendar" ON public.copo_dagua_calendar AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage educational content" ON public.educational_content; CREATE POLICY "Commission members can manage educational content" ON public.educational_content AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage events" ON public.events; CREATE POLICY "Commission members can manage events" ON public.events AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage FAQ items" ON public.faq_items; CREATE POLICY "Commission members can manage FAQ items" ON public.faq_items AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage account movements" ON public.financial_account_movements; CREATE POLICY "Commission members can manage account movements" ON public.financial_account_movements AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage financial accounts" ON public.financial_accounts; CREATE POLICY "Commission members can manage financial accounts" ON public.financial_accounts AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage financial transactions" ON public.financial_transactions; CREATE POLICY "Commission members can manage financial transactions" ON public.financial_transactions AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage glossary terms" ON public.glossary_terms; CREATE POLICY "Commission members can manage glossary terms" ON public.glossary_terms AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage hospitalar_aid_requests" ON public.hospitalar_aid_requests; CREATE POLICY "Commission members can manage hospitalar_aid_requests" ON public.hospitalar_aid_requests AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage hospitalar_beneficence_fund" ON public.hospitalar_beneficence_fund; CREATE POLICY "Commission members can manage hospitalar_beneficence_fund" ON public.hospitalar_beneficence_fund AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage hospitalar_cases" ON public.hospitalar_cases; CREATE POLICY "Commission members can manage hospitalar_cases" ON public.hospitalar_cases AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage hospitalar_philanthropy" ON public.hospitalar_philanthropy; CREATE POLICY "Commission members can manage hospitalar_philanthropy" ON public.hospitalar_philanthropy AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage hospitalar_visits" ON public.hospitalar_visits; CREATE POLICY "Commission members can manage hospitalar_visits" ON public.hospitalar_visits AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage lodge info" ON public.lodge_info; CREATE POLICY "Commission members can manage lodge info" ON public.lodge_info AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage cargo reports" ON public.management_cargo_reports; CREATE POLICY "Commission members can manage cargo reports" ON public.management_cargo_reports AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage meeting minutes" ON public.meeting_minutes; CREATE POLICY "Commission members can manage meeting minutes" ON public.meeting_minutes AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage meeting minutes files" ON public.meeting_minutes_files; CREATE POLICY "Commission members can manage meeting minutes files" ON public.meeting_minutes_files AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can view all read records" ON public.message_reads; CREATE POLICY "Commission members can view all read records" ON public.message_reads AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage messages" ON public.messages; CREATE POLICY "Commission members can manage messages" ON public.messages AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can delete articles" ON storage.objects; CREATE POLICY "Commission members can delete articles" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated USING (((bucket_id = 'articles'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can delete master photos" ON storage.objects; CREATE POLICY "Commission members can delete master photos" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'masters'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can delete meeting minutes files" ON storage.objects; CREATE POLICY "Commission members can delete meeting minutes files" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'meeting-minutes'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can delete profile photos" ON storage.objects; CREATE POLICY "Commission members can delete profile photos" ON storage.objects AS PERMISSIVE FOR DELETE TO public USING (((bucket_id = 'profiles'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can update master photos" ON storage.objects; CREATE POLICY "Commission members can update master photos" ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'masters'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can update profile photos" ON storage.objects; CREATE POLICY "Commission members can update profile photos" ON storage.objects AS PERMISSIVE FOR UPDATE TO public USING (((bucket_id = 'profiles'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can upload master photos" ON storage.objects; CREATE POLICY "Commission members can upload master photos" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'masters'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can upload meeting minutes files" ON storage.objects; CREATE POLICY "Commission members can upload meeting minutes files" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'meeting-minutes'::text) AND (auth.role() = 'authenticated'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can upload profile photos" ON storage.objects; CREATE POLICY "Commission members can upload profile photos" ON storage.objects AS PERMISSIVE FOR INSERT TO public WITH CHECK (((bucket_id = 'profiles'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can view all works files" ON storage.objects; CREATE POLICY "Commission members can view all works files" ON storage.objects AS PERMISSIVE FOR SELECT TO public USING (((bucket_id = 'user-works'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true))))));
DROP POLICY IF EXISTS "Commission members can manage officers" ON public.officers; CREATE POLICY "Commission members can manage officers" ON public.officers AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage secretary_certificates" ON public.secretary_certificates; CREATE POLICY "Commission members can manage secretary_certificates" ON public.secretary_certificates AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage secretary_convocations" ON public.secretary_convocations; CREATE POLICY "Commission members can manage secretary_convocations" ON public.secretary_convocations AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage secretary_correspondence" ON public.secretary_correspondence; CREATE POLICY "Commission members can manage secretary_correspondence" ON public.secretary_correspondence AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage secretary_documents" ON public.secretary_documents; CREATE POLICY "Commission members can manage secretary_documents" ON public.secretary_documents AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage attendances" ON public.session_attendances; CREATE POLICY "Commission members can manage attendances" ON public.session_attendances AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage sessions" ON public.sessions; CREATE POLICY "Commission members can manage sessions" ON public.sessions AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage study works" ON public.study_works; CREATE POLICY "Commission members can manage study works" ON public.study_works AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can update user works" ON public.user_works; CREATE POLICY "Commission members can update user works" ON public.user_works AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can view all works" ON public.user_works; CREATE POLICY "Commission members can view all works" ON public.user_works AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage visitors" ON public.visitors; CREATE POLICY "Commission members can manage visitors" ON public.visitors AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));
DROP POLICY IF EXISTS "Commission members can manage worshipful masters" ON public.worshipful_masters; CREATE POLICY "Commission members can manage worshipful masters" ON public.worshipful_masters AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.is_director_member = true)))));

-- Corrige o corpo da funcao (ALTER TABLE RENAME nao atualiza codigo de funcoes)
CREATE OR REPLACE FUNCTION public.can_manage_profiles(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role IN ('admin', 'commission_member')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = _user_id AND p.is_director_member = true
  );
$fn$;

COMMIT;
