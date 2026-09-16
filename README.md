# LE PLUG — Site de pré-commande

Site vitrine pour la marque "Le Plug" (mélasse à chicha). Pas de paiement en
ligne : le site sert uniquement à passer une pré-commande, le paiement se
fait cash ou Interac au pickup.

Stack : React + Vite + Tailwind CSS, Supabase (base de données + Edge
Function), Resend (email de notification).

## 1. Installer et lancer en local

```bash
npm install
cp .env.example .env
```

Remplis `.env` avec tes identifiants Supabase :

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ta-clé-anon
```

Tu trouves ces valeurs dans ton dashboard Supabase → **Project Settings →
API** (`Project URL` et `anon public` key).

Puis lance le serveur de dev :

```bash
npm run dev
```

Le site est accessible sur `http://localhost:5173`.

## 2. Configurer la base de données Supabase

Dans le dashboard Supabase, va dans **SQL Editor → New query**, colle tout
le contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql) et
clique sur **Run**.

Ce script crée :
- la table `products` (avec les 4 saveurs de départ : Hawaï 24, Love 66 12,
  Blue Melon 12, Lady Killer 6, à 35$ chacune)
- la table `orders`
- la fonction `decrement_stock` : diminue le stock d'une saveur en
  vérifiant d'abord qu'il y en a assez, avec un verrou de ligne
  (`FOR UPDATE`) pour éviter que deux clients commandent en même temps le
  dernier pot disponible
- la fonction `place_order` : point d'entrée unique utilisé par le site.
  Elle vérifie le stock, le diminue, puis crée la commande — le tout dans
  **une seule transaction côté serveur**. Le client (navigateur) n'a jamais
  la main directement sur le stock, impossible donc de tricher en modifiant
  le code JS pour commander plus que disponible.
- les policies de sécurité (RLS) : le site peut *lire* les produits mais ne
  peut ni modifier le stock ni écrire dans `orders` autrement qu'en passant
  par `place_order`.

Si tu veux changer les photos des produits, tu peux :
- uploader les images dans **Storage** (créer un bucket public, ex.
  `product-images`) puis mettre l'URL publique dans la colonne `image_url`
  de chaque produit (table `products`, éditable directement dans le
  Table Editor de Supabase)
- ou simplement laisser `image_url` vide : le site affiche une case avec la
  première lettre de la saveur en attendant.

## 3. Configurer l'envoi d'email (Resend)

On utilise **Resend** car c'est le plus simple à appeler depuis une Supabase
Edge Function (une seule requête HTTP, pas de SDK front nécessaire).

1. Crée un compte gratuit sur [resend.com](https://resend.com)
2. Dans le dashboard Resend, va dans **API Keys** → **Create API Key**,
   copie la clé (commence par `re_...`)
3. (Optionnel mais recommandé) Vérifie ton propre domaine dans
   **Domains** pour pouvoir envoyer depuis une adresse comme
   `commandes@leplug.com`. Sans domaine vérifié, tu peux envoyer en
   utilisant l'adresse de test `onboarding@resend.dev` (déjà configurée par
   défaut dans le code, fonctionne immédiatement sans setup).

### Déployer la fonction

Installe la CLI Supabase si ce n'est pas déjà fait, puis :

```bash
supabase login
supabase link --project-ref <ton-project-ref>
supabase secrets set RESEND_API_KEY=re_ta_clé
supabase functions deploy send-order-email
```

Le `<project-ref>` se trouve dans l'URL de ton dashboard Supabase
(`https://supabase.com/dashboard/project/<project-ref>`).

Si tu as vérifié un domaine, remplace la constante `FROM_EMAIL` dans
`supabase/functions/send-order-email/index.ts` par ton adresse (ex.
`Le Plug <commandes@tondomaine.com>`), puis redéploie.

## 4. Tester une commande de bout en bout

1. `npm run dev`, ouvre le site
2. Sur la pop-up d'âge, clique **Oui**
3. Clique sur une carte produit (ex. Lady Killer)
4. Ajuste la quantité (le + se bloque au stock réel disponible)
5. Laisse "Pickup" sélectionné, remplis nom + téléphone
6. Clique **Confirmer la commande**
7. Tu dois voir le message de confirmation à l'écran
8. Vérifie dans Supabase (Table Editor → `orders`) qu'une nouvelle ligne a
   été créée, et que le `stock` du produit dans la table `products` a bien
   diminué
9. Vérifie que l'email est arrivé sur `afroface49@gmail.com` (regarde aussi
   les spams la première fois)

Si l'email n'arrive pas, regarde les logs de la fonction :

```bash
supabase functions logs send-order-email
```

## 5. Déploiement (plus tard)

Le site est prêt pour Vercel :

```bash
npm run build
```

Sur Vercel, ajoute les mêmes variables d'environnement
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dans les Project Settings,
puis connecte le repo pour un déploiement automatique.
