"""
RoadWatch AI - Constituency Lookup Service
Resolves GPS coordinates to an MLA constituency using point-in-polygon logic.
"""

from typing import Optional, Dict
from shapely.geometry import Point, shape

# Mock data for demonstration purposes
MOCK_CONSTITUENCIES = [
    {
        "type": "Feature",
        "properties": {
            "constituency_id": "TN-011",
            "constituency_name": "Dr. Radhakrishnan Nagar",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [80.2600, 13.1100],
                [80.2900, 13.1100],
                [80.2900, 13.1400],
                [80.2600, 13.1400],
                [80.2600, 13.1100]
            ]]
        }
    },
    {
        "type": "Feature",
        "properties": {
            "constituency_id": "TN-012",
            "constituency_name": "Perambur",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [80.2300, 13.1000],
                [80.2600, 13.1000],
                [80.2600, 13.1300],
                [80.2300, 13.1300],
                [80.2300, 13.1000]
            ]]
        }
    }
]

class ConstituencyLookupService:
    def __init__(self):
        self.boundaries = []
        self._load_boundaries()

    def _load_boundaries(self):
        for feature in MOCK_CONSTITUENCIES:
            geom = shape(feature["geometry"])
            self.boundaries.append({
                "geometry": geom,
                "properties": feature["properties"]
            })

    def lookup(self, lat: float, lon: float) -> Optional[Dict[str, str]]:
        point = Point(lon, lat)
        for b in self.boundaries:
            if b["geometry"].contains(point):
                return {
                    "constituency_id": b["properties"]["constituency_id"],
                    "constituency_name": b["properties"]["constituency_name"]
                }
        return None

constituency_lookup = ConstituencyLookupService()
