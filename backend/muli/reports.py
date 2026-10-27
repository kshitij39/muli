import json
import secrets

from flask import Blueprint, current_app, g, request
from PIL import Image, UnidentifiedImageError
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


def save_photo(file):
    try:
        image = Image.open(file)
        if image.format not in ("JPEG", "PNG"):
            return None
        image = image.convert("RGB")
        image.thumbnail((1600, 1600))
    except (UnidentifiedImageError, OSError):
        return None
    name = f"{secrets.token_hex(8)}.jpg"
    image.save(current_app.config["UPLOADS"] / name, "JPEG", quality=85)
    return name


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

    photo = None
    if request.files.get("photo"):
        photo = save_photo(request.files["photo"])
        if not photo:
            return {"error": "We couldn't read that photo. Use a JPEG or PNG."}, 400

    ward = ward_at(lat, lon)
    db = get_db()
    cursor = db.execute(
        "INSERT INTO reports (user_id, category, what_wrong, photo, lat, lon, ward) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (g.user["id"], category, what_wrong, photo, lat, lon, ward),
    )
    db.commit()
    return {"id": cursor.lastrowid, "category": category, "ward": ward, "status": "waiting"}, 201
