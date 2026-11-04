ALTER TABLE public.projects ALTER COLUMN currency SET DEFAULT 'SDG';
ALTER TABLE public.portfolio_items ALTER COLUMN currency SET DEFAULT 'SDG';
UPDATE public.projects SET currency = 'SDG' WHERE currency = 'USD';
UPDATE public.portfolio_items SET currency = 'SDG' WHERE currency = 'USD';