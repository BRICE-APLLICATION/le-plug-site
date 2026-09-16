-- ============================================================
-- LE PLUG — Schéma Supabase
-- À copier-coller dans l'éditeur SQL de Supabase (SQL Editor)
-- ============================================================

-- Table des produits
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  stock integer not null default 0,
  image_url text,
  created_at timestamp with time zone default now()
);

-- Table des commandes
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id),
  quantity integer not null,
  total_price numeric not null,
  customer_name text not null,
  customer_phone text not null,
  fulfillment_type text not null default 'pickup',
  created_at timestamp with time zone default now()
);

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;

-- Le site (clé anonyme) peut lire les produits
create policy "Public can read products"
  on products for select
  using (true);

-- Le site ne peut PAS insérer/modifier/supprimer les produits directement
-- (le stock est modifié uniquement via la fonction place_order ci-dessous)

-- Le site ne peut pas lire ni écrire directement dans orders :
-- l'insertion passe uniquement par la fonction place_order (security definer)
-- donc aucune policy select/insert n'est ajoutée ici pour le rôle anon.

-- ------------------------------------------------------------
-- Fonction : decrement_stock
-- Diminue le stock d'un produit si le stock disponible est suffisant.
-- Verrouille la ligne (FOR UPDATE) pour éviter les problèmes de
-- concurrence si deux clients commandent en même temps.
-- ------------------------------------------------------------
create or replace function decrement_stock(p_product_id uuid, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stock integer;
begin
  select stock into current_stock
  from products
  where id = p_product_id
  for update;

  if current_stock is null then
    raise exception 'Produit introuvable';
  end if;

  if current_stock < p_quantity then
    raise exception 'Stock insuffisant';
  end if;

  update products
  set stock = stock - p_quantity
  where id = p_product_id;
end;
$$;

-- ------------------------------------------------------------
-- Fonction : place_order
-- Point d'entrée unique utilisé par le site pour passer une commande.
-- Vérifie/diminue le stock puis insère la commande, dans une seule
-- transaction atomique (tout réussit ou tout échoue ensemble).
-- ------------------------------------------------------------
create or replace function place_order(
  p_product_id uuid,
  p_quantity integer,
  p_customer_name text,
  p_customer_phone text,
  p_fulfillment_type text
)
returns orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric;
  v_order orders;
begin
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantité invalide';
  end if;

  select price into v_price from products where id = p_product_id;
  if v_price is null then
    raise exception 'Produit introuvable';
  end if;

  perform decrement_stock(p_product_id, p_quantity);

  insert into orders (
    product_id, quantity, total_price, customer_name,
    customer_phone, fulfillment_type
  )
  values (
    p_product_id, p_quantity, v_price * p_quantity, p_customer_name,
    p_customer_phone, p_fulfillment_type
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- Autoriser le rôle "anon" (clé publique du site) à exécuter place_order
grant execute on function place_order(uuid, integer, text, text, text) to anon;

-- ------------------------------------------------------------
-- Données de départ
-- ------------------------------------------------------------
insert into products (name, price, stock, image_url) values
  ('Hawaï', 35.00, 24, null),
  ('Love 66', 35.00, 12, null),
  ('Blue Melon', 35.00, 12, null),
  ('Lady Killer', 35.00, 6, null);
