ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'water_station';
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'water_network';
ALTER TYPE public.project_type ADD VALUE IF NOT EXISTS 'school_maintenance';
ALTER TABLE public.project_requests ADD COLUMN IF NOT EXISTS service_answers jsonb NOT NULL DEFAULT '{}'::jsonb;