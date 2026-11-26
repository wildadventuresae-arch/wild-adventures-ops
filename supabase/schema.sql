-- Wild Adventures Ops : base de données Supabase
-- À coller une seule fois dans Supabase > SQL Editor > New query > Run.

-- 1. Toutes les données de l'appli (bookings, clients, agents, storage, flotte, WhatsApp…)
create table if not exists public.records (
  kind        text        not null,          -- booking, client, agent, storage, vehicle, wa_conv, wa_msg, doc…
  id          text        not null,
  data        jsonb       not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid,
  primary key (kind, id)
);
create index if not exists records_kind_idx on public.records (kind);
create index if not exists records_booking_date_idx on public.records ((data->>'date')) where kind = 'booking';
create index if not exists records_msg_at_idx on public.records ((data->>'at')) where kind = 'wa_msg';

-- 2. Les comptes de l'équipe et leur rôle
create table if not exists public.staff_users (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  name     text not null,
  role     text not null check (role in ('owner', 'manager', 'reception', 'guide', 'mechanic'))
);

-- 3. Sécurité : seuls les membres de l'équipe connectés lisent et écrivent
alter table public.records enable row level security;
alter table public.staff_users enable row level security;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as
$$ select exists (select 1 from public.staff_users where user_id = auth.uid()) $$;

drop policy if exists "staff read records"  on public.records;
drop policy if exists "staff write records" on public.records;
create policy "staff read records"  on public.records for select to authenticated using (public.is_staff());
create policy "staff write records" on public.records for all    to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "read own profile" on public.staff_users;
create policy "read own profile" on public.staff_users for select to authenticated using (user_id = auth.uid() or public.is_staff());

-- Droits d'accès des comptes connectés (les nouveaux projets Supabase ne les donnent plus automatiquement)
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.records to authenticated;
grant select on public.staff_users to authenticated;
grant all on public.records, public.staff_users to service_role;
grant execute on function public.is_staff() to authenticated;

-- 4. Mises à jour en direct entre les écrans (réception, guides, téléphone)
do $$ begin
  alter publication supabase_realtime add table public.records;
exception when duplicate_object then null; end $$;

-- 5. Après avoir créé ton compte (Authentication > Users > Add user), donne-toi le rôle Direction :
-- insert into public.staff_users (user_id, name, role)
--   select id, 'Mourad', 'owner' from auth.users where email = 'TON_EMAIL';
