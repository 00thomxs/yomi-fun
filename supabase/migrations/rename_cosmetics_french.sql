-- =====================================================
-- RENAME ALL COSMETICS TO FRENCH
-- =====================================================

-- BACKGROUNDS
UPDATE public.cosmetic_items SET name = 'Fibre de Carbone' WHERE slug = 'carbon-fiber';
UPDATE public.cosmetic_items SET name = 'Pluie Matricielle' WHERE slug = 'matrix-rain';
UPDATE public.cosmetic_items SET name = 'Arc-en-ciel', slug = 'arc-en-ciel' WHERE slug = 'neon-glitch' OR slug = 'glitch';
UPDATE public.cosmetic_items SET name = 'Or Pur' WHERE slug = 'pure-gold';
UPDATE public.cosmetic_items SET name = 'Électrique' WHERE slug = 'electric';
UPDATE public.cosmetic_items SET name = 'Vert Militaire' WHERE slug = 'military';
UPDATE public.cosmetic_items SET name = 'Champ d''Étoiles' WHERE slug = 'starfield';
UPDATE public.cosmetic_items SET name = 'Grille Néon' WHERE slug = 'neon-grid';

-- AURAS
UPDATE public.cosmetic_items SET name = 'Anneau Scintillant' WHERE slug = 'sparkle-ring' OR slug = 'radar';
UPDATE public.cosmetic_items SET name = 'Auréole' WHERE slug = 'halo';
UPDATE public.cosmetic_items SET name = 'Anneau Pulsant' WHERE slug = 'pulse-ring' OR slug = 'glitch-ghost';
UPDATE public.cosmetic_items SET name = 'Diamant' WHERE slug = 'diamond' OR slug = 'flame';
UPDATE public.cosmetic_items SET name = 'Éclat Doré' WHERE slug = 'golden-glow' OR slug = 'crown';

-- NAMETAGS
UPDATE public.cosmetic_items SET name = 'Lueur Néon' WHERE slug = 'neon-glow';
UPDATE public.cosmetic_items SET name = 'Dégradé', description = 'Dégradé bleu vers rose' WHERE slug = 'gradient';
UPDATE public.cosmetic_items SET name = 'Coucher de Soleil', description = 'Dégradé orange chaleureux' WHERE slug = 'sunset';
UPDATE public.cosmetic_items SET name = 'Océan', description = 'Dégradé bleu océan' WHERE slug = 'ocean';
UPDATE public.cosmetic_items SET name = 'Flammes', description = 'Dégradé rouge ardent' WHERE slug = 'fire';
UPDATE public.cosmetic_items SET name = 'Brillant', description = 'Reflet doré animé' WHERE slug = 'shiny';
UPDATE public.cosmetic_items SET name = 'Rétro Pixel', description = 'Police pixel art rétro' WHERE slug = 'pixel';
UPDATE public.cosmetic_items SET name = 'Médiéval', description = 'Police gothique élégante' WHERE slug = 'gothic';

