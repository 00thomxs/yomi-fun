-- Add initial_liquidity column to markets table
-- Used to control volatility, especially for multi-outcome markets

ALTER TABLE public.markets
ADD COLUMN IF NOT EXISTS initial_liquidity INTEGER DEFAULT 10000 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_markets_initial_liquidity ON public.markets(initial_liquidity);

COMMENT ON COLUMN public.markets.initial_liquidity IS 'Initial liquidity (seed) used to stabilize odds/volatility. For multi markets, controls probability change sensitivity.';


