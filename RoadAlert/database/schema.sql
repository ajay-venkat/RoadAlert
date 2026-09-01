-- Enable PostGIS extension for geolocation
create extension if not exists postgis schema extensions;

-- Create constituencies table
create table public.constituencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mla_name text,
  boundary geometry(Polygon, 4326) not null
);

-- Create reports table
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  photo_url text,
  location geometry(Point, 4326),
  lat numeric,
  long numeric,
  constituency_id uuid references public.constituencies(id),
  status text not null default 'New' check (status in ('New', 'In Progress', 'Resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on geolocation for faster querying
create index reports_geo_index on public.reports using gist (location);
create index constituencies_geo_index on public.constituencies using gist (boundary);

-- Function to find constituency based on lat/long
create or replace function get_constituency_for_location(p_lat numeric, p_long numeric)
returns uuid
language plpgsql
security definer
as $$
declare
  v_point geometry(Point, 4326);
  v_constituency_id uuid;
begin
  -- Create a point from the coordinates
  v_point := st_setsrid(st_makepoint(p_long, p_lat), 4326);
  
  -- Find the constituency that contains the point
  select id into v_constituency_id
  from public.constituencies
  where st_contains(boundary, v_point)
  limit 1;
  
  return v_constituency_id;
end;
$$;

-- Insert mock data for demo
-- Constituency A (rough bounding box around a specific area for testing)
insert into public.constituencies (id, name, mla_name, boundary)
values (
  '11111111-1111-1111-1111-111111111111',
  'Anna Nagar',
  'MK Mohan',
  st_geomfromgeojson('{
    "type": "Polygon",
    "coordinates": [[
      [80.190, 13.080],
      [80.220, 13.080],
      [80.220, 13.100],
      [80.190, 13.100],
      [80.190, 13.080]
    ]]
  }')
);

-- Constituency B
insert into public.constituencies (id, name, mla_name, boundary)
values (
  '22222222-2222-2222-2222-222222222222',
  'T. Nagar',
  'J. Karunanithi',
  st_geomfromgeojson('{
    "type": "Polygon",
    "coordinates": [[
      [80.220, 13.030],
      [80.250, 13.030],
      [80.250, 13.050],
      [80.220, 13.050],
      [80.220, 13.030]
    ]]
  }')
);

-- Storage bucket for photos (Run this via Supabase dashboard manually or SQL if permissions allow)
-- insert into storage.buckets (id, name, public) values ('reports-photos', 'reports-photos', true);
