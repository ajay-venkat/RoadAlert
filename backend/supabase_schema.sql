-- Enable PostGIS for spatial operations
create extension if not exists postgis with schema extensions;

-- Create Constituencies table
create table public.constituencies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  mla_name text not null,
  boundary geometry(Polygon, 4326) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Reports table
create table public.reports (
  id uuid default gen_random_uuid() primary key,
  photo_url text,
  lat double precision not null,
  long double precision not null,
  status text not null default 'New',
  constituency_id uuid references public.constituencies(id),
  mla_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.constituencies enable row level security;
alter table public.reports enable row level security;

-- Create policies (Demo: allow all for now)
create policy "Allow public read access on constituencies" on public.constituencies for select using (true);
create policy "Allow public read access on reports" on public.reports for select using (true);
create policy "Allow public insert on reports" on public.reports for insert with check (true);
create policy "Allow public update on reports" on public.reports for update using (true);

-- Function to match constituency based on lat/long before insert
create or replace function public.assign_constituency()
returns trigger
language plpgsql
security definer
as $$
declare
  matched_constituency record;
begin
  -- Find the constituency where the point (long, lat) falls inside the boundary
  select id, mla_name into matched_constituency
  from public.constituencies
  where st_contains(boundary, st_setsrid(st_makepoint(new.long, new.lat), 4326))
  limit 1;

  -- If found, assign it to the report
  if found then
    new.constituency_id := matched_constituency.id;
    new.mla_name := matched_constituency.mla_name;
  end if;

  return new;
end;
$$;

-- Trigger to run the function before insert
create trigger before_insert_report
  before insert on public.reports
  for each row
  execute function public.assign_constituency();

-- Storage Bucket for photos
insert into storage.buckets (id, name, public) values ('reports', 'reports', true);
create policy "Public Access to reports bucket" on storage.objects for select using ( bucket_id = 'reports' );
create policy "Public Insert to reports bucket" on storage.objects for insert with check ( bucket_id = 'reports' );

-- Insert Sample Data (Hardcoded 2 constituencies for Demo)
-- Chennai (roughly)
insert into public.constituencies (name, mla_name, boundary)
values (
  'R.K. Nagar',
  'Sample MLA A',
  ST_GeomFromText('POLYGON((80.26 13.11, 80.30 13.11, 80.30 13.14, 80.26 13.14, 80.26 13.11))', 4326)
);

insert into public.constituencies (name, mla_name, boundary)
values (
  'Anna Nagar',
  'Sample MLA B',
  ST_GeomFromText('POLYGON((80.19 13.07, 80.23 13.07, 80.23 13.10, 80.19 13.10, 80.19 13.07))', 4326)
);
