import json
import math

from flask import Blueprint, abort, request, send_from_directory

from .accounts import login_required
from .db import DATA, get_db

bp = Blueprint("places", __name__, url_prefix="/api")

LAYERS = [
    {"key": "uphc", "label": "Health posts and UPHCs", "one": "Health post", "category": "health", "on": True},
    {"key": "dispensary", "label": "Dispensaries", "one": "Dispensary", "category": "health", "on": True},
    {"key": "maternity", "label": "Maternity homes", "one": "Maternity home", "category": "health", "on": True},
    {"key": "hospital", "label": "Hospitals", "one": "Hospital", "category": "health", "on": True},
    {"key": "animal", "label": "Animal hospitals", "one": "Animal hospital", "category": "health", "on": True},
    {"key": "municipal", "label": "Municipal schools", "one": "Municipal school", "category": "education", "on": True},
    {"key": "aided", "label": "Aided schools", "one": "Aided school", "category": "education", "on": True},
    {"key": "unaided", "label": "Unaided schools", "one": "Unaided school", "category": "education", "on": True},
    {"key": "toilet", "label": "Public toilets", "one": "Public toilet", "category": "sanitation", "on": True, "near_only": True},
    {"key": "park", "label": "Parks and maidans", "one": "Park", "category": "city", "on": False},
    {"key": "miyawaki", "label": "Miyawaki gardens and zoo", "one": "Garden", "category": "city", "on": False},
    {"key": "police", "label": "Police", "one": "Police", "category": "city", "on": False},
    {"key": "fire", "label": "Fire stations", "one": "Fire station", "category": "city", "on": False},
    {"key": "ward_office", "label": "Ward offices", "one": "Ward office", "category": "city", "on": False},
    {"key": "bus", "label": "Bus stops and depots", "one": "Bus stop", "category": "city", "on": False, "near_only": True},
    {"key": "station", "label": "Railway stations", "one": "Railway station", "category": "city", "on": False},
    {"key": "parking", "label": "Parking", "one": "Parking", "category": "city", "on": False},
]
NEAR_ONLY = {layer["key"] for layer in LAYERS if layer.get("near_only")}


def distance_km(lat1, lon1, lat2, lon2):
    north = (lat1 - lat2) * 111.32
    east = (lon1 - lon2) * 111.32 * math.cos(math.radians(19.07))
    return math.hypot(north, east)


def place_dict(row):
    place = dict(row)
    place["extra"] = json.loads(place["extra"]) if place["extra"] else {}
    return place


def numbers(text, count):
    try:
        values = [float(part) for part in text.split(",")]
    except ValueError:
        return None
    return values if len(values) == count else None


@bp.get("/layers")
@login_required()
def layers():
    counts = dict(get_db().execute("SELECT layer, COUNT(*) FROM places WHERE rough < 2 GROUP BY layer").fetchall())
    return [{**layer, "count": counts.get(layer["key"], 0)} for layer in LAYERS]


@bp.get("/places")
@login_required()
def places():
    known = {layer["key"] for layer in LAYERS}
    chosen = [key for key in request.args.get("layers", "").split(",") if key in known]
    near = numbers(request.args.get("near", ""), 2)
    box = numbers(request.args.get("box", ""), 4)
    if not chosen:
        return []

    sql = f"SELECT * FROM places WHERE rough < 2 AND layer IN ({','.join('?' * len(chosen))})"
    args = list(chosen)
    if near:
        km = min(max(request.args.get("km", 1, type=float), 0.1), 2)
        lat, lon = near
        step = km / 111.32 * 1.2
        sql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?"
        args += [lat - step, lat + step, lon - step * 1.1, lon + step * 1.1]
        found = []
        for row in get_db().execute(sql, args):
            away = distance_km(lat, lon, row["lat"], row["lon"])
            if away <= km:
                found.append({**place_dict(row), "km": round(away, 3)})
        return sorted(found, key=lambda place: place["km"])

    if box:
        south, west, north, east = box
        small = north - south <= 0.03 and east - west <= 0.03
        sql += " AND lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?"
        args += [south, north, west, east]
    else:
        small = False
    rows = get_db().execute(sql, args)
    return [place_dict(row) for row in rows if small or row["layer"] not in NEAR_ONLY]


@bp.get("/outlines/<name>")
@login_required()
def outlines(name):
    if name not in ("wards", "slums"):
        abort(404)
    return send_from_directory(DATA, f"{name}.geojson", mimetype="application/geo+json", max_age=86400)
