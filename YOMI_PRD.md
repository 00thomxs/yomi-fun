# 📑 YOMI.fun — Product & Vision Document

## 1. 🎯 Executive Summary
**YOMI.fun** est une plateforme de **prédiction sociale gamifiée** (Prediction Market) où les utilisateurs parient une monnaie virtuelle (**Zeny**) sur des événements du monde réel (Sport, Politique, Influenceurs, Tech).

Contrairement aux plateformes de paris classiques (financières, complexes, risquées), YOMI propose une expérience **fun, gratuite à l'entrée, et communautaire**, inspirée des codes du jeu vidéo (Saisons, Classements, Skins).

> **Mission :** Rendre le marché de prédiction accessible et divertissant pour la Gen Z / Digital Natives.  
> **Stade actuel :** Post-Saison 0 ("Trenches") — MVP validé, communauté active.

---

## 2. 💡 Le Concept (Gameplay)

### Le Core Loop
1.  **Prediction :** L'utilisateur choisit un événement (ex: *"Mbappé marquera-t-il ce soir ?"* ou *"Le Bitcoin dépassera-t-il 100k$ ?"*).
2.  **Mise (Betting) :** Il mise ses **Zeny** (monnaie virtuelle).
3.  **Résultat :**
    *   **Victoire :** Il récupère sa mise + un gain basé sur la cote (Pari Mutuel).
    *   **Défaite :** Il perd sa mise.
4.  **Progression :** Ses gains augmentent son **PnL** (Profit and Loss) et son rang dans le **Classement Saisonnier**.

### L'Économie (Tokenomics Simplifiée)
*   **Zeny (Ƶ) :** Monnaie unique du jeu. Non-convertible en argent réel (pas de cash-out), ce qui évite la régulation "Jeux d'Argent" stricte.
*   **Acquisition :**
    *   Bonus quotidien / Inscription.
    *   Gains de paris.
    *   **Achat via Shop (Monétisation) :** Packs de Zeny payants (Stripe).
*   **Dépense (Sink) :**
    *   Paris.
    *   Achat d'items cosmétiques (Avatars) ou cartes cadeaux (dans le futur).

---

## 3. 🏗️ Architecture Technique (Tech Stack)

Le projet repose sur une stack moderne, robuste et scalable (Serverless).

### Frontend
*   **Framework :** Next.js 14+ (App Router, Server Components).
*   **Langage :** TypeScript (Typage strict pour la fiabilité).
*   **Styling :** Tailwind CSS (Design rapide, Responsive, Dark Mode natif).
*   **UI Components :** Radix UI / Shadcn (Accessibilité), Lucide React (Icônes).
*   **Data Viz :** Recharts (Graphiques de cours interactifs).

### Backend & Data
*   **BaaS (Backend as a Service) :** Supabase.
*   **Base de Données :** PostgreSQL.
*   **Authentification :** Supabase Auth (Email/Password, OAuth possible).
*   **Logique Métier Critique :** Fonctions RPC PostgreSQL (PL/pgSQL) pour garantir l'atomicité des transactions (paris, résolution, calculs de gains).
*   **Storage :** Supabase Storage (Avatars utilisateurs).

### Infrastructure & DevOps
*   **Hébergement :** Vercel (Déploiement continu via GitHub).
*   **Paiements :** Stripe (Intégration Checkout & Webhooks sécurisés).
*   **Cron Jobs :** Gestion via Vercel Cron / Service externe (fermeture automatique des marchés).

### Workflow de Développement
1.  **Code :** Développement local avec Cursor/VS Code.
2.  **Versionning :** Git & GitHub.
3.  **CI/CD :** Chaque push sur `main` déclenche un build & deploy automatique sur Vercel.
4.  **Database :** Migrations SQL gérées via Supabase pour l'évolution du schéma.

---

## 4. ⚙️ Fonctionnalités Clés (Feature Set)

### 🟢 Marchés (Markets)
*   **Binaire :** OUI / NON (ex: Sport, Finance).
*   **Multi-Choix :** Plusieurs issues possibles (ex: *"Qui gagnera les Oscars ?"*).
*   **Cotes Dynamiques :** Système de **Pari Mutuel (Parimutuel Betting)**. La cote dépend du volume misé sur chaque issue (comme au PMU, pas comme un Bookmaker). Plus les gens parient sur OUI, plus la cote du NON augmente.

### 🏆 Compétition
*   **Saisons :** Durée déterminée (ex: 1 mois). Reset des scores à la fin.
*   **Leaderboard :** Classement en temps réel basé sur le PnL (Gains nets).
*   **Récompenses :** Cashprize ou Zeny pour le Top 3/10 à la fin de la saison.

### 👤 Profil & Social
*   **Stats avancées :** Win Rate, Série de victoires (Streak), Historique complet.
*   **Avatars :** Personnalisation (Upload) avec gestion intelligente (filtrage Gravatar).
*   **Badge Admin :** Distinction visuelle pour l'équipe YOMI.

### 🛡️ Administration
*   **Dashboard Admin :** Création d'events, Résolution des paris, Gestion des utilisateurs.
*   **Sécurité :** Row Level Security (RLS) sur la base de données pour empêcher la triche.

---

## 5. 📈 Bilan Saison 0 ("Trenches") & Objectifs

### Bilan Saison 0
*   **Validation technique :** Le système de pari mutuel fonctionne sans bug majeur.
*   **Validation UX :** L'interface "Dark/Neon" plaît à la cible. Le mobile est prioritaire (Mobile-First).
*   **Engagement :** Le système de classement crée une rétention forte (les joueurs reviennent voir s'ils ont été dépassés).

### Objectifs Saison 1 et Futur (Roadmap)
1.  **Acquisition :** Scaler le nombre d'utilisateurs (Marketing viral, partages de paris sur réseaux).
2.  **Rétention :** Ajouter des quêtes quotidiennes ("Parier sur 3 events différents").
3.  **Monétisation :** Diversifier le Shop (Skins de profil, effets visuels lors des victoires).
4.  **Social :** Ajouter des commentaires ou un chat sur les events pour créer du débat.

---

## 6. 💎 Pourquoi YOMI.fun est unique ?

Contrairement à *Polymarket* (trop crypto/austère) ou *Betclic* (argent réel/risqué), **YOMI.fun** occupe le créneau du **"Social Betting"** :
*   **Risk-free :** On joue pour la gloire et les cadeaux, pas pour payer son loyer.
*   **Gamifié :** L'expérience est celle d'un jeu vidéo, pas d'un tableau Excel.
*   **Communautaire :** On parie contre les autres, pas contre la maison.

***
*Document généré le 12/12/2025 - YOMI.fun*

