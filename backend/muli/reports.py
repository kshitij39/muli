import json
import secrets

from flask import Blueprint, current_app, g, request, send_from_directory
from PIL import Image, UnidentifiedImageError
from shapely import prepared
from shapely.geometry import Point, shape

from .accounts import login_required
from .db import DATA, get_db

bp = Blueprint("reports", __name__, url_prefix="/api")

CATEGORIES = ["health", "sanitation", "education"]
REASONS = {"elsewhere": "Not at this spot", "photo": "The photo doesn't show it", "fixed": "Already fixed", "other": "Another reason"}


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


def report_dict(row):
    report = {key: row[key] for key in ["id", "category", "what_wrong", "lat", "lon", "ward", "status", "reject_reason", "reject_text", "decided_at", "created_at"]}
    report["has_photo"] = bool(row["photo"])
    report["decided_by"] = row["decided_by_name"]
    return report


REPORTS = "SELECT reports.*, users.ngo_name AS decided_by_name FROM reports LEFT JOIN users ON users.id = reports.decided_by"


@bp.get("/reports")
@login_required("ngo")
def report_list():
    sql = REPORTS + " WHERE 1 = 1"
    args = []
    status = request.args.get("status")
    if status == "waiting":
        sql += " AND status = 'waiting'"
    elif status == "checked":
        sql += " AND status != 'waiting'"
    for key in ("category", "ward"):
        if request.args.get(key):
            sql += f" AND reports.{key} = ?"
            args.append(request.args[key])
    order = " ORDER BY decided_at DESC" if status == "checked" else " ORDER BY reports.created_at DESC, reports.id DESC"
    return [report_dict(row) for row in get_db().execute(sql + order, args)]


@bp.get("/reports/<int:report_id>/photo")
@login_required("ngo")
def photo(report_id):
    row = get_db().execute("SELECT photo FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row or not row["photo"]:
        return {"error": "No photo."}, 404
    return send_from_directory(current_app.config["UPLOADS"], row["photo"])


@bp.post("/reports/<int:report_id>/decision")
@login_required("ngo")
def decide(report_id):
    db = get_db()
    row = db.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row:
        return {"error": "Report not found."}, 404
    if row["status"] != "waiting":
        return {"error": "Someone has already checked this report."}, 400
    data = request.get_json(silent=True) or {}
    if data.get("decision") == "accept":
        status, reason, text = "accepted", None, None
    elif data.get("decision") == "reject":
        status, reason, text = "rejected", data.get("reason"), str(data.get("text", "")).strip()
        if reason not in REASONS:
            return {"error": "Choose a reason first."}, 400
        if reason == "other" and len(text) < 3:
            return {"error": "Write the reason in the box."}, 400
        text = text[:150] if reason == "other" else None
    else:
        return {"error": "Accept or reject the report."}, 400
    db.execute(
        "UPDATE reports SET status = ?, reject_reason = ?, reject_text = ?, decided_by = ?, decided_at = CURRENT_TIMESTAMP WHERE id = ?",
        (status, reason, text, g.user["id"], report_id),
    )
    db.commit()
    return report_dict(db.execute(REPORTS + " WHERE reports.id = ?", (report_id,)).fetchone())
