-- Monetary snapshots: allow computing weekly inflation (supply delta over time)

CREATE TABLE IF NOT EXISTS public.monetary_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  total_supply BIGINT NOT NULL,
  total_burned BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_monetary_snapshots_captured_at ON public.monetary_snapshots(captured_at DESC);

-- RLS: only admin can read/insert (we compute server-side anyway)
ALTER TABLE public.monetary_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read monetary snapshots"
  ON public.monetary_snapshots
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can insert monetary snapshots"
  ON public.monetary_snapshots
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));


