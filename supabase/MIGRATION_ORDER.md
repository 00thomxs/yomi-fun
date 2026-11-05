# 📋 Ordre d'Exécution des Migrations Supabase

Exécute ces fichiers SQL **dans l'ordre** dans l'éditeur SQL de Supabase.

---

## ÉTAPE 1 : Schema de base
```
supabase/schema.sql
```
> Crée toutes les tables de base, indexes, RLS policies, triggers et seed data.

---

## ÉTAPE 2 : Migrations (dans l'ordre)

### 2.1 Shop
```
supabase/migrations/create_shop_tables.sql
supabase/migrations/update_shop_schema.sql
```

### 2.2 Season Settings
```
supabase/migrations/create_season_settings.sql
supabase/migrations/update_season_settings.sql
```

### 2.3 Charts & History
```
supabase/migrations/add_charts_history.sql
supabase/migrations/get_pnl_history.sql
```

### 2.4 Profile Extensions
```
supabase/migrations/add_bets_won.sql
supabase/migrations/add_bet_direction.sql
supabase/migrations/add_storage_and_prefs.sql
```

### 2.5 Stats Functions
```
supabase/migrations/update_winner_stats.sql
supabase/migrations/update_loser_stats.sql
```

### 2.6 RLS Complet
```
supabase/migrations/enable_rls_all_tables.sql
```

---

## ÉTAPE 3 : Compléter le schema manquant (IMPORTANT!)
```
supabase/migrations/complete_missing_schema.sql
```
> Ajoute: role sur profiles, title sur season_settings, table past_seasons, BIGINT, reset_platform()

---

## ÉTAPE 4 : Configurer le premier admin

Après avoir créé ton compte, exécute ce SQL en remplaçant l'email :

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'TON_EMAIL@example.com'
);
```

---

## ÉTAPE 5 : Storage (via Dashboard)

1. Va dans **Storage** dans le dashboard Supabase
2. Crée un bucket nommé `avatars`
3. Rends-le **public**

Ou exécute :
```
supabase/migrations/add_storage_bucket.sql
```

---

## ÉTAPE FINALE : Verrouillage sécurité (toujours en dernier)
```
supabase/migrations/lock_down_profiles_and_rpcs.sql
```
> Les joueurs ne peuvent plus modifier balance/role/stats, ni appeler reset_platform, increment_balance, etc.

---

## ✅ Checklist Finale

- [ ] schema.sql exécuté
- [ ] Toutes les migrations exécutées
- [ ] complete_missing_schema.sql exécuté
- [ ] Ton compte créé et promu admin
- [ ] Bucket avatars créé

---

## 🔄 Pour Reset Complet (si besoin)

Si tu veux tout recommencer sur une DB vierge, supprime le projet Supabase et recrée-en un, puis suis ce guide.

