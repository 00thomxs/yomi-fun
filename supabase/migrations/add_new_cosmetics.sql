-- =====================================================
-- ADD NEW COSMETICS - New backgrounds and nametag gradients
-- =====================================================

-- Update Glitch to Arc-en-ciel (Rainbow)
UPDATE public.cosmetic_items 
SET 
  name = 'Arc-en-ciel',
  slug = 'rainbow',
  description = 'Reflets irisés multicolores',
  preview_data = '{"type": "animated", "effect": "holographic", "colors": ["#ff0080", "#00ffff", "#ffff00"]}'
WHERE slug = 'neon-glitch';

-- Add Starfield background
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Starfield', 'starfield', 'Champ d''étoiles scintillantes', 'background', 'rare', 12000,
 '{"type": "animated", "effect": "starfield", "colors": ["#ffffff", "#ffffd0"]}', 7)
ON CONFLICT (slug) DO NOTHING;

-- Add Neon Grid background
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Neon Grid', 'neon-grid', 'Grille cyberpunk néon', 'background', 'epic', 20000,
 '{"type": "animated", "effect": "neongrid", "colors": ["#00ffff"]}', 8)
ON CONFLICT (slug) DO NOTHING;

-- Add Sunset gradient nametag
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Sunset', 'sunset', 'Dégradé coucher de soleil', 'nametag', 'rare', 10000,
 '{"type": "gradient", "colors": ["#ff6b35", "#f7931e", "#ffcc00"], "direction": "to right"}', 6)
ON CONFLICT (slug) DO NOTHING;

-- Add Ocean gradient nametag
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Ocean', 'ocean', 'Dégradé bleu océan', 'nametag', 'rare', 10000,
 '{"type": "gradient", "colors": ["#00d4ff", "#0099ff", "#0066cc"], "direction": "to right"}', 7)
ON CONFLICT (slug) DO NOTHING;

-- Add Fire gradient nametag  
INSERT INTO public.cosmetic_items (name, slug, description, type, rarity, price, preview_data, sort_order) VALUES
('Fire', 'fire', 'Dégradé flammes ardentes', 'nametag', 'epic', 18000,
 '{"type": "gradient", "colors": ["#ff0000", "#ff6600", "#ffcc00"], "direction": "to right"}', 8)
ON CONFLICT (slug) DO NOTHING;

