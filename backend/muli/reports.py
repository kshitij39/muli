import json

from flask import Blueprint, g, request
from shapely import prepared
from shapely.geometry import Point, shape

from .accounts import login_required
from .db import DATA, get_db

bp = Blueprint("reports", __name__, url_prefix="/api")

CATEGORIES = ["health", "sanitation", "education"]


def ward_shapes():
    with open(DATA / "wards.geojson", encoding="utf-8") as f:
        features = json.load(f)["features"]
    return {feature["properties"]["code"]: prepared.prep(shape(feature["geometry"])) for feature in features}


WARDS = ward_shapes()


def ward_at(lat, lon):
    point = Point(lon, lat)
    return next((code for code, outline in WARDS.items() if outline.contains(point)), "")


@bp.post("/reports")
@login_required("civic")
def send_report():
    category = request.form.get("category")
    what_wrong = request.form.get("what_wrong", "").strip()
    try:
        lat = float(request.form.get("lat"))
        lon = float(request.form.get("lon"))
    except (TypeError, ValueError):
        return {"error": "Place the spot on the map."}, 400
    if not (18.8 <= lat <= 19.4 and 72.7 <= lon <= 73.1):
        return {"error": "Place the spot in Mumbai."}, 400
    if category not in CATEGORIES:
        return {"error": "Choose a category."}, 400
    if not 10 <= len(what_wrong) <= 300:
        return {"error": "Say what's wrong in 10 to 300 characters."}, 400

    ward = ward_at(lat, lon)
    db = get_db()
    cursor = db.execute(
        "INSERT INTO reports (user_id, category, what_wrong, lat, lon, ward) VALUES (?, ?, ?, ?, ?, ?)",
        (g.user["id"], category, what_wrong, lat, lon, ward),
    )
    db.commit()
    return {"id": cursor.lastrowid, "category": category, "ward": ward, "status": "waiting"}, 201
