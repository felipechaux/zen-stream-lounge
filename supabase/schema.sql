-- Create a profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text check (role in ('user', 'model')) default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

-- Trigger to automatically create profile on signup
-- Note: You might need to drop the trigger first if it exists to avoid errors when re-running
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Private call requests ───────────────────────────────────────────────────
-- Persisted signaling table so requests are never lost even if the streamer
-- isn't subscribed at the exact moment the viewer sends the request.

create table public.call_requests (
  id          uuid default gen_random_uuid() primary key,
  stream_id   text not null,
  viewer_id   uuid not null references auth.users(id) on delete cascade,
  viewer_name text not null,
  status      text check (status in ('pending','accepted','rejected','ended'))
              not null default 'pending',
  created_at  timestamp with time zone default now()
);

alter table public.call_requests enable row level security;

-- Enable Realtime CDC for this table
alter publication supabase_realtime add table public.call_requests;

create policy "Authenticated users can read call requests"
  on call_requests for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert call requests"
  on call_requests for insert
  with check (auth.uid() = viewer_id);

create policy "Authenticated users can update call requests"
  on call_requests for update
  using (auth.role() = 'authenticated');
