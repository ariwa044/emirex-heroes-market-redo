
-- roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles"
on public.user_roles for select to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all roles"
on public.user_roles for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
on public.user_roles for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

insert into public.user_roles (user_id, role)
values ('14b83fdb-4add-4f05-9fcd-609f316338db', 'admin');

-- site settings
create table public.site_settings (
  key text primary key,
  value text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

alter table public.site_settings enable row level security;

create policy "Settings are publicly readable"
on public.site_settings for select to anon, authenticated using (true);

create policy "Admins can insert settings"
on public.site_settings for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update settings"
on public.site_settings for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

insert into public.site_settings (key, value)
values ('btc_address', '1b4oTt9vYJpq2SaNMZRahbDaU3FQMePUg');

-- profit override on investments
alter table public.investments add column profit_override numeric;

-- admin access to member data
create policy "Admins can view all profiles"
on public.profiles for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
on public.profiles for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all transactions"
on public.transactions for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can create transactions for anyone"
on public.transactions for insert to authenticated
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all transactions"
on public.transactions for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all investments"
on public.investments for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all investments"
on public.investments for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can view all trading history"
on public.trading_history for select to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all trading history"
on public.trading_history for update to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- admins manage plans
create policy "Admins can manage plans"
on public.investment_plans for all to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

grant select, insert, update on public.investment_plans to authenticated;
