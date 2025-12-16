-- Track betting fees for accurate monetary supply/burn metrics

ALTER TABLE public.bets
ADD COLUMN IF NOT EXISTS fee_paid INTEGER,
ADD COLUMN IF NOT EXISTS fee_rate DECIMAL(5,4);

COMMENT ON COLUMN public.bets.fee_paid IS 'Fee charged on bet placement (in Zeny).';
COMMENT ON COLUMN public.bets.fee_rate IS 'Fee rate used when the bet was placed (e.g. 0.05).';


