-- Booking status enum
create type public.booking_status as enum ('pending','confirmed','in_progress','completed','cancelled');

-- Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  professional_handle text not null,
  professional_name text not null,
  category text not null,
  city text,
  event_date date,
  status public.booking_status not null default 'pending',
  budget_inr integer,
  requirements text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Customers view own bookings" on public.bookings
  for select using (auth.uid() = customer_id);
create policy "Customers create own bookings" on public.bookings
  for insert with check (auth.uid() = customer_id);
create policy "Customers update own bookings" on public.bookings
  for update using (auth.uid() = customer_id);
create policy "Customers delete own bookings" on public.bookings
  for delete using (auth.uid() = customer_id);
create policy "Admins view all bookings" on public.bookings
  for select using (public.has_role(auth.uid(),'admin'));

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

create index bookings_customer_idx on public.bookings(customer_id, created_at desc);
create index bookings_handle_idx on public.bookings(professional_handle);

-- Favorites
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  professional_handle text not null,
  created_at timestamptz not null default now(),
  unique (customer_id, professional_handle)
);

alter table public.favorites enable row level security;

create policy "Customers view own favorites" on public.favorites
  for select using (auth.uid() = customer_id);
create policy "Customers add own favorites" on public.favorites
  for insert with check (auth.uid() = customer_id);
create policy "Customers remove own favorites" on public.favorites
  for delete using (auth.uid() = customer_id);

create index favorites_customer_idx on public.favorites(customer_id);