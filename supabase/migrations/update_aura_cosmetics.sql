-- =====================================================
-- UPDATE AURA COSMETICS - Replace risky effects with reliable ones
-- =====================================================

-- Update Radar → Sparkle Ring (particules brillantes autour)
UPDATE public.cosmetic_items 
SET 
  name = 'Sparkle Ring',
  slug = 'sparkle-ring',
  description = 'Particules brillantes scintillant autour de l''avatar',
  preview_data = '{"type": "particles", "effect": "sparkle", "color": "#ffffff", "count": 12}'
WHERE slug = 'radar';

-- Update Glitch Ghost → Pulse Ring (anneau pulsant)
UPDATE public.cosmetic_items 
SET 
  name = 'Pulse Ring',
  slug = 'pulse-ring',
  description = 'Anneau lumineux qui pulse doucement',
  preview_data = '{"type": "animated", "effect": "pulse", "color": "#00ffff", "speed": "2s"}'
WHERE slug = 'glitch-ghost';

-- Update Flamme → Diamond (diamant lumineux au-dessus)
UPDATE public.cosmetic_items 
SET 
  name = 'Diamond',
  slug = 'diamond',
  description = 'Diamant lumineux flottant au-dessus de l''avatar',
  preview_data = '{"type": "floating", "effect": "diamond", "color": "#00ffff", "sparkle": true}'
WHERE slug = 'flame';

-- Update Crown → Golden Glow (elegant golden aura)
UPDATE public.cosmetic_items 
SET 
  name = 'Golden Glow',
  slug = 'golden-glow',
  description = 'Aura dorée élégante autour de l''avatar',
  preview_data = '{"type": "glow", "effect": "crown", "color": "#ffd700"}'
WHERE slug = 'crown';

