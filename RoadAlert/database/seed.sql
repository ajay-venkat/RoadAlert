-- Seed data for RoadAlert Demo
-- Inserting two sample constituencies: 
-- 1. Dr. Radhakrishnan Nagar (R.K. Nagar) - A well known Chennai constituency
-- 2. Royapuram - Neighboring constituency

INSERT INTO public.constituencies (name, mla_name, geom)
VALUES 
(
    'Dr. Radhakrishnan Nagar',
    'Thiru. J.J. Ebenezer',
    ST_GeomFromGeoJSON('{
        "type": "MultiPolygon",
        "coordinates": [
            [
                [
                    [80.2785, 13.1189],
                    [80.2910, 13.1189],
                    [80.2910, 13.1310],
                    [80.2785, 13.1310],
                    [80.2785, 13.1189]
                ]
            ]
        ],
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}}
    }')
),
(
    'Royapuram',
    'Thiru. iDream R. Murthy',
    ST_GeomFromGeoJSON('{
        "type": "MultiPolygon",
        "coordinates": [
            [
                [
                    [80.2850, 13.1050],
                    [80.2980, 13.1050],
                    [80.2980, 13.1189],
                    [80.2850, 13.1189],
                    [80.2850, 13.1050]
                ]
            ]
        ],
        "crs": {"type": "name", "properties": {"name": "EPSG:4326"}}
    }')
);

-- Seed some sample reports
INSERT INTO public.reports (photo_url, lat, lon, constituency_id, status)
VALUES
(
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80',
    13.1250, 80.2850, 
    (SELECT id FROM public.constituencies WHERE name = 'Dr. Radhakrishnan Nagar'),
    'new'
),
(
    'https://images.unsplash.com/photo-1518175510618-971c0800b230?auto=format&fit=crop&q=80',
    13.1100, 80.2900,
    (SELECT id FROM public.constituencies WHERE name = 'Royapuram'),
    'in_progress'
);
