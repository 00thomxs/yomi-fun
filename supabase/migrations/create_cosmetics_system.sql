-- =====================================================
-- COSMETICS SYSTEM - Profile Card Customization
-- =====================================================
-- Replaces the old shop_items/orders system with cosmetics
-- Types: background, aura, nametag
-- Rarities: common, rare, epic, legendary

-- =====================================================
-- 1. COSMETIC ITEMS CATALOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cosmetic_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                    -- Display name: "Carbon Fiber"
  slug TEXT UNIQUE NOT NULL,             -- URL-friendly: "carbon-fiber"
  description TEXT,                      -- Optional description
  type TEXT NOT NULL CHECK (type IN ('background', 'aura', 'nametag')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  price INTEGER NOT NULL,                -- Price in Zeny
  preview_data JSONB NOT NULL DEFAULT '{}', -- CSS/config for rendering the effect
  is_available BOOLEAN DEFAULT true,     -- Can be purchased (for seasonal items)
  is_limited BOOLEAN DEFAULT false,      -- Limited time offer
  sort_order INTEGER DEFAULT 0,          -- Display order in shop
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX idx_cosmetic_items_type ON public.cosmetic_items(type);
CREATE INDEX idx_cosmetic_items_available ON public.cosmetic_items(is_available);
CREATE INDEX idx_cosmetic_items_rarity ON public.cosmetic_items(rarity);

-- =====================================================
-- 2. USER OWNED COSMETICS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_cosmetics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES public.cosmetic_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  price_paid INTEGER NOT NULL,           -- Price at time of purchase
  UNIQUE(user_id, cosmetic_id)
);

CREATE INDEX idx_user_cosmetics_user ON public.user_cosmetics(user_id);
CREATE INDEX idx_user_cosmetics_cosmetic ON public.user_cosmetics(cosmetic_id);

-- =====================================================
-- 3. USER EQUIPPED COSMETICS (Active selections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_equipped_cosmetics (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  background_id UUID REFERENCES public.cosmetic_items(id) ON DELETE SET NULL,
  aura_id UUID REFERENCES public.cosmetic_items(id) ON DELETE SET NULL,
  nametag_id UUID REFERENCES public.cosmetic_items(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.cosmetic_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_equipped_cosmetics ENABLE ROW LEVEL SECURITY;

-- Cosmetic items: Everyone can view available items
CREATE POLICY "Cosmetic items are viewable by everyone"
  ON public.cosmetic_items FOR SELECT
  USING (true);

-- User cosmetics: Users can view their own, admins can view all
CREATE POLICY "Users can view their own cosmetics"
  ON public.user_cosmetics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user cosmetics"
  ON public.user_cosmetics FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- User equipped: Users can view their own and others' (for display)
CREATE POLICY "Anyone can view equipped cosmetics"
  ON public.user_equipped_cosmetics FOR SELECT
  USING (true);

-- =====================================================
-- 5. SEED INITIAL COSMETICS DATA
-- =====================================================

-- BACKGROUNDS (6 items)
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Carbon Fiber', 'carbon-fiber', 'Texture élégante en fibre de carbone', 'background', 'common', 5000, 
 '{"type": "pattern", "pattern": "carbon", "colors": ["#1a1a1a", "#2d2d2d"]}', 1),
 
('Militaire', 'military', 'Camouflage tactique discret', 'background', 'common', 6000,
 '{"type": "pattern", "pattern": "camo", "colors": ["#2d3319", "#3d4429", "#1f2611"]}', 2),

('Électrique', 'electric', 'Éclairs dynamiques et énergie pure', 'background', 'rare', 12000,
 '{"type": "animated", "effect": "electric", "colors": ["#00d4ff", "#0066ff", "#000033"]}', 3),

('Matrix Rain', 'matrix-rain', 'Cascade de code numérique', 'background', 'rare', 15000,
 '{"type": "animated", "effect": "matrix", "colors": ["#00ff00", "#003300"]}', 4),

('Glitch', 'glitch', 'Distorsion visuelle et artefacts', 'background', 'epic', 25000,
 '{"type": "animated", "effect": "glitch", "colors": ["#ff0080", "#00ffff", "#ffff00"]}', 5),

('Pure Gold', 'pure-gold', 'Luxe absolu en or massif', 'background', 'legendary', 45000,
 '{"type": "gradient", "effect": "shimmer", "colors": ["#ffd700", "#ffb800", "#cc9900"]}', 6);

-- AVATAR AURAS (5 items)
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Radar', 'radar', 'Scan radar vert qui tourne autour de l''avatar', 'aura', 'rare', 10000,
 '{"type": "rotating", "effect": "radar", "color": "#00ff00", "speed": "3s"}', 1),

('Halo', 'halo', 'Cercle néon angélique flottant', 'aura', 'rare', 12000,
 '{"type": "floating", "effect": "halo", "color": "#ffffff", "glow": true}', 2),

('Glitch Ghost', 'glitch-ghost', 'Dédoublement fantôme rouge/bleu', 'aura', 'epic', 22000,
 '{"type": "glitch", "effect": "ghost", "colors": ["#ff0000", "#0000ff"]}', 3),

('Flamme', 'flame', 'Flammes ardentes entourant l''avatar', 'aura', 'epic', 28000,
 '{"type": "animated", "effect": "flame", "colors": ["#ff4500", "#ff8c00", "#ffd700"]}', 4),

('Crown', 'crown', 'Couronne royale animée flottante', 'aura', 'legendary', 50000,
 '{"type": "floating", "effect": "crown", "color": "#ffd700", "sparkle": true}', 5);

-- NAMETAG FX (5 items)
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Neon Glow', 'neon-glow', 'Lueur néon de la couleur du rang', 'nametag', 'common', 6000,
 '{"type": "glow", "effect": "neon", "useRankColor": true, "intensity": 15}', 1),

('Pixel', 'pixel', 'Police rétro style pixel art', 'nametag', 'rare', 10000,
 '{"type": "font", "fontFamily": "pixel", "effect": null}', 2),

('Gothique', 'gothic', 'Police gothique médiévale', 'nametag', 'rare', 12000,
 '{"type": "font", "fontFamily": "gothic", "effect": null}', 3),

('Gradient', 'gradient', 'Dégradé bleu vers rose', 'nametag', 'epic', 20000,
 '{"type": "gradient", "colors": ["#00d4ff", "#ff00ff"], "direction": "to right"}', 4),

('Shiny', 'shiny', 'Reflet brillant passant sur le texte', 'nametag', 'epic', 35000,
 '{"type": "animated", "effect": "shine", "color": "#ffffff", "interval": "3s"}', 5);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Get rarity color for UI
CREATE OR REPLACE FUNCTION get_rarity_color(rarity TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE rarity
    WHEN 'common' THEN RETURN '#9ca3af';
    WHEN 'rare' THEN RETURN '#3b82f6';
    WHEN 'epic' THEN RETURN '#a855f7';
    WHEN 'legendary' THEN RETURN '#f59e0b';
    ELSE RETURN '#9ca3af';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get rarity label in French
CREATE OR REPLACE FUNCTION get_rarity_label(rarity TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE rarity
    WHEN 'common' THEN RETURN 'Commun';
    WHEN 'rare' THEN RETURN 'Rare';
    WHEN 'epic' THEN RETURN 'Épique';
    WHEN 'legendary' THEN RETURN 'Légendaire';
    ELSE RETURN rarity;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

