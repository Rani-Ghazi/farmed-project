CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.project_type AS ENUM ('cooler','well_drilling','solar','well_maintenance','other');
CREATE TYPE public.request_status AS ENUM ('new','reviewing','approved','rejected','published','funded','in_progress','completed');
CREATE TYPE public.donor_status AS ENUM ('new','contacted','following','completed');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own role or admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.claim_first_admin() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(),'admin');
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_exists() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin')
$$;

CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF uid IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid,'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_admin(_user_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  IF _user_id = auth.uid() THEN RAISE EXCEPTION 'cannot revoke self'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role='admin';
END; $$;

CREATE OR REPLACE FUNCTION public.list_admins() RETURNS TABLE(user_id uuid, email text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'not allowed'; END IF;
  RETURN QUERY SELECT r.user_id, u.email::text, r.created_at FROM public.user_roles r JOIN auth.users u ON u.id = r.user_id WHERE r.role='admin' ORDER BY r.created_at;
END; $$;

REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_admin_by_email(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_admins() FROM anon;

-- services
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (char_length(slug) BETWEEN 1 AND 120),
  name text NOT NULL CHECK (char_length(trim(name)) BETWEEN 1 AND 150),
  project_type public.project_type,
  short_description text,
  description text,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published services" ON public.services FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_services_upd BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- project requests
CREATE TABLE public.project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name text NOT NULL CHECK (char_length(trim(org_name)) BETWEEN 2 AND 200),
  contact_name text NOT NULL CHECK (char_length(trim(contact_name)) BETWEEN 2 AND 150),
  phone text NOT NULL CHECK (phone ~ '^[0-9+ ()-]{7,20}$'),
  email text CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  org_type text NOT NULL CHECK (char_length(trim(org_type)) BETWEEN 1 AND 100),
  state text NOT NULL CHECK (char_length(trim(state)) BETWEEN 1 AND 100),
  locality text NOT NULL CHECK (char_length(trim(locality)) BETWEEN 1 AND 100),
  village text NOT NULL CHECK (char_length(trim(village)) BETWEEN 1 AND 150),
  geo_location text CHECK (geo_location IS NULL OR char_length(geo_location) <= 300),
  project_type public.project_type NOT NULL,
  need_description text NOT NULL CHECK (char_length(trim(need_description)) BETWEEN 10 AND 5000),
  need_reason text NOT NULL CHECK (char_length(trim(need_reason)) BETWEEN 10 AND 5000),
  expected_beneficiaries int NOT NULL CHECK (expected_beneficiaries > 0 AND expected_beneficiaries < 10000000),
  site_images text[] NOT NULL DEFAULT '{}',
  video_path text,
  documents text[] NOT NULL DEFAULT '{}',
  extra_notes text CHECK (extra_notes IS NULL OR char_length(extra_notes) <= 5000),
  status public.request_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.project_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_requests TO authenticated;
GRANT ALL ON public.project_requests TO service_role;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone submit request" ON public.project_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new' AND admin_notes IS NULL);
CREATE POLICY "admin read requests" ON public.project_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update requests" ON public.project_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete requests" ON public.project_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_req_upd BEFORE UPDATE ON public.project_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- projects
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  project_type public.project_type NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  request_id uuid REFERENCES public.project_requests(id) ON DELETE SET NULL,
  state text,
  locality text,
  village text,
  short_description text,
  description text,
  need_reason text,
  estimated_cost numeric(14,2) CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  currency text NOT NULL DEFAULT 'USD',
  beneficiaries int CHECK (beneficiaries IS NULL OR beneficiaries >= 0),
  status public.request_status NOT NULL DEFAULT 'published',
  is_published boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  cover_image text,
  project_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published projects" ON public.projects FOR SELECT TO anon, authenticated USING ((is_published AND NOT is_archived) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_proj_upd BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_media TO authenticated;
GRANT ALL ON public.project_media TO service_role;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read project media" ON public.project_media FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND ((p.is_published AND NOT p.is_archived) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "admin manage project media" ON public.project_media FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- portfolio
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 2 AND 200),
  project_type public.project_type NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  location text,
  completion_date date,
  description text,
  beneficiaries int CHECK (beneficiaries IS NULL OR beneficiaries >= 0),
  cost numeric(14,2) CHECK (cost IS NULL OR cost >= 0),
  currency text NOT NULL DEFAULT 'USD',
  cover_image text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT ALL ON public.portfolio_items TO service_role;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read portfolio" ON public.portfolio_items FOR SELECT TO anon, authenticated USING (is_published OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage portfolio" ON public.portfolio_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_port_upd BEFORE UPDATE ON public.portfolio_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.portfolio_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('before','after','video')),
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.portfolio_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_media TO authenticated;
GRANT ALL ON public.portfolio_media TO service_role;
ALTER TABLE public.portfolio_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read portfolio media" ON public.portfolio_media FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.portfolio_items i WHERE i.id = item_id AND (i.is_published OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "admin manage portfolio media" ON public.portfolio_media FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- donors
CREATE TABLE public.donor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  full_name text NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 2 AND 150),
  phone text NOT NULL CHECK (phone ~ '^[0-9+ ()-]{7,20}$'),
  email text CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  intended_amount numeric(14,2) CHECK (intended_amount IS NULL OR intended_amount >= 0),
  message text CHECK (message IS NULL OR char_length(message) <= 3000),
  contact_method text NOT NULL DEFAULT 'phone' CHECK (contact_method IN ('phone','whatsapp','email')),
  status public.donor_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.donor_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donor_requests TO authenticated;
GRANT ALL ON public.donor_requests TO service_role;
ALTER TABLE public.donor_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone submit donor" ON public.donor_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new' AND admin_notes IS NULL);
CREATE POLICY "admin read donors" ON public.donor_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update donors" ON public.donor_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete donors" ON public.donor_requests FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_don_upd BEFORE UPDATE ON public.donor_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- settings
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phone text, whatsapp text, email text, address text,
  facebook text, twitter text, instagram text, linkedin text, youtube text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.site_settings(id) VALUES (1);

INSERT INTO public.services(slug,name,project_type,short_description,description,sort_order) VALUES
('thermal-coolers','المبردات الحرارية','cooler','توفير مياه شرب باردة ونظيفة للمدارس والمراكز والمجتمعات.','نصمم وننفذ مبردات مياه حرارية تعمل بكفاءة في المناخ الحار، لتوفير مياه شرب باردة وآمنة في المدارس والمساجد والمراكز الصحية والأسواق. (نص توضيحي قابل للتعديل)',1),
('well-drilling','حفر الآبار','well_drilling','حفر آبار مياه جوفية وفق دراسات فنية ومعايير هندسية.','نقوم بالدراسات الجيوفيزيائية وحفر الآبار وتركيب المضخات وشبكات التوزيع لتوفير مصدر مياه مستدام للقرى والمجتمعات. (نص توضيحي قابل للتعديل)',2),
('solar-energy','الطاقة الشمسية','solar','أنظمة طاقة شمسية لتشغيل الآبار والمرافق الخدمية.','نصمم ونركب أنظمة طاقة شمسية لتشغيل مضخات المياه وإنارة المدارس والمراكز الصحية بتكلفة تشغيل منخفضة. (نص توضيحي قابل للتعديل)',3),
('well-maintenance','صيانة الآبار','well_maintenance','إعادة تأهيل وصيانة الآبار والمضخات المتوقفة.','نعيد تأهيل الآبار المتوقفة ونصين المضخات والمعدات لضمان استمرار تدفق المياه للمستفيدين. (نص توضيحي قابل للتعديل)',4);

-- storage policies
CREATE POLICY "public read media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media');
CREATE POLICY "admin write media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone upload attachments" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'request-attachments' AND (storage.foldername(name))[1] = 'requests');
CREATE POLICY "admin read attachments" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'request-attachments' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'request-attachments' AND public.has_role(auth.uid(),'admin'));