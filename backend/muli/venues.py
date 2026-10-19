import json

from .db import DATA, get_db
from .places import distance_km

SCHOOLS = ["municipal", "aided", "unaided"]
GROUPS = {
    "health": [["uphc", "dispensary", "maternity", "hospital"], SCHOOLS + ["park"], ["ward_office", "police", "fire"]],
    "education": [SCHOOLS, ["park"], ["ward_office", "police", "fire"]],
    "sanitation": [["park"] + SCHOOLS, ["uphc", "dispensary", "hospital"], ["ward_office", "police", "fire"]],
}


def venue_groups(category, ward):
    groups = []
    for layers in GROUPS[category]:
        rows = get_db().execute(
            f"SELECT * FROM places WHERE ward = ? AND rough < 2 AND layer IN ({','.join('?' * len(layers))})"
            " ORDER BY name, address",
            [ward, *layers],
        ).fetchall()
        groups.append(rows)
    return groups


def venues_in_order(category, ward):
    return [row for group in venue_groups(category, ward) for row in group]


def ward_middles():
    with open(DATA / "wards.geojson", encoding="utf-8") as f:
        return {feature["properties"]["code"]: feature["properties"]["middle"] for feature in json.load(f)["features"]}


MIDDLES = ward_middles()


def suggested_venues(category, ward):
    lat, lon = MIDDLES[ward]
    picked = []
    for group in venue_groups(category, ward):
        left = list(group)
        while len(picked) < 3 and left:
            if not picked:
                best = min(left, key=lambda p: distance_km(lat, lon, p["lat"], p["lon"]))
            else:
                best = max(left, key=lambda p: min(distance_km(p["lat"], p["lon"], q["lat"], q["lon"]) for q in picked))
            picked.append(best)
            left.remove(best)
        if len(picked) == 3:
            break
    return picked
