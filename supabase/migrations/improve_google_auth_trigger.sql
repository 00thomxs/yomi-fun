-- =============================================
-- Amélioration du trigger pour Google OAuth
-- =============================================
-- Ce trigger gère mieux les métadonnées Google :
-- - full_name / name pour le username
-- - picture / avatar_url pour l'avatar
-- - Génère un username unique basé sur le nom Google

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Priorité pour le username :
  -- 1. username explicite (inscription email)
  -- 2. full_name de Google (formaté)
  -- 3. name de Google
  -- 4. Fallback user_XXXXXXXX
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    -- Formater le nom Google : "Jean Dupont" -> "jean_dupont"
    LOWER(REGEXP_REPLACE(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name'
      ),
      '[^a-zA-Z0-9]+', '_', 'g'
    )),
    'user_' || LEFT(NEW.id::text, 8)
  );
  
  -- Nettoyer le username (enlever underscores au début/fin)
  base_username := TRIM(BOTH '_' FROM base_username);
  
  -- Si le username est vide après nettoyage, fallback
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user_' || LEFT(NEW.id::text, 8);
  END IF;
  
  -- Limiter la longueur
  base_username := LEFT(base_username, 20);
  
  -- Vérifier l'unicité et ajouter un suffixe si nécessaire
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || '_' || counter;
  END LOOP;

  -- Insérer le profil
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    -- Priorité pour l'avatar : avatar_url (email) ou picture (Google)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    )
  );
  -- balance utilise le DEFAULT 0 de la table
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Le trigger existe déjà, pas besoin de le recréer
-- Il utilisera automatiquement la nouvelle version de la fonction

