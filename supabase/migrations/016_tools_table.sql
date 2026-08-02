CREATE TABLE IF NOT EXISTS public.tools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  short_description text,
  icon text,
  status text NOT NULL DEFAULT 'coming_soon',
  price_monthly numeric(10,2),
  is_free boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  maintenance_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed the 5 tools
INSERT INTO public.tools (slug, name, short_description, status, price_monthly, is_free, sort_order)
VALUES
  ('cpbot', 'CP Bot', 'One-click eBay to Amazon order fulfilment', 'available', 9.00, false, 1),
  ('listflow', 'ListFlow', 'Product tracking and listing — AutoDS alternative', 'available', 19.00, false, 2),
  ('orderbot', 'Order Bot', 'Instant WhatsApp/Discord alerts for new eBay orders', 'available', 7.00, false, 3),
  ('invoicegen', 'Invoice Generator', 'Auto-generate professional invoices for eBay sales', 'available', 5.00, false, 4),
  ('returnlabels', 'Return Label Generator', 'Generate eBay return labels instantly', 'available', 0, true, 5)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tools are viewable by everyone" ON public.tools
  FOR SELECT USING (true);
