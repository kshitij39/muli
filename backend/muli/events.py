from datetime import datetime
from zoneinfo import ZoneInfo

from flask import Blueprint, g, request

from .accounts import login_required
from .db import get_db
from .places import place_dict
from .venues import GROUPS

bp = Blueprint("events", __name__, url_prefix="/api")

KINDS = {
    "health": ["checkup", "vaccination", "custom"],
    "sanitation": ["cleanliness", "hygiene", "custom"],
    "education": ["enrolment", "camp", "custom"],
}


def now():
    return datetime.now(ZoneInfo("Asia/Kolkata")).strftime("%Y-%m-%dT%H:%M")


def event_dict(row):
    event = {key: row[key] for key in ["id", "category", "kind", "title", "about", "ward", "starts_at", "hours", "places", "volunteers"]}
    event["organisation"] = row["ngo_name"]
    event["mine"] = row["user_id"] == g.user["id"]
    venue = get_db().execute("SELECT * FROM places WHERE id = ?", (row["place_id"],)).fetchone()
    event["venue"] = place_dict(venue)
    return event


EVENTS = "SELECT events.*, users.ngo_name FROM events JOIN users ON users.id = events.user_id"


@bp.get("/events")
@login_required()
def event_list():
    sql = EVENTS + " WHERE starts_at > ?"
    args = [now()]
    if request.args.get("category"):
        sql += " AND category = ?"
        args.append(request.args["category"])
    if request.args.get("mine"):
        sql += " AND user_id = ?"
        args.append(g.user["id"])
    rows = get_db().execute(sql + " ORDER BY starts_at", args).fetchall()
    return [event_dict(row) for row in rows]


def find_event(event_id):
    return get_db().execute(EVENTS + " WHERE events.id = ?", (event_id,)).fetchone()


@bp.get("/events/<int:event_id>")
@login_required()
def event(event_id):
    row = find_event(event_id)
    if not row:
        return {"error": "Event not found. It may have been taken down."}, 404
    return event_dict(row)


@bp.post("/events")
@login_required("ngo")
def publish():
    data = request.get_json(silent=True) or {}
    category = data.get("category")
    kind = data.get("kind")
    title = str(data.get("title", "")).strip()
    about = str(data.get("about", "")).strip()
    starts_at = str(data.get("starts_at", ""))
    if category not in KINDS or kind not in KINDS[category]:
        return {"error": "Choose a kind of event."}, 400
    venue = get_db().execute("SELECT * FROM places WHERE id = ?", (data.get("place_id"),)).fetchone()
    if not venue or venue["rough"] == 2 or not any(venue["layer"] in group for group in GROUPS[category]):
        return {"error": "Choose a venue from the list."}, 400
    if len(title) < 5:
        return {"error": "The title needs at least 5 characters."}, 400
    if len(about) < 10:
        return {"error": "Say what will happen at the event."}, 400
    try:
        datetime.strptime(starts_at, "%Y-%m-%dT%H:%M")
    except ValueError:
        return {"error": "Choose a date and time."}, 400
    if starts_at <= now():
        return {"error": "Choose a date and time in the future."}, 400
    try:
        hours = int(data.get("hours"))
        places = int(data.get("places"))
        volunteers = int(data.get("volunteers"))
    except (TypeError, ValueError):
        return {"error": "Fill in how long, places and volunteers."}, 400
    if not 1 <= hours <= 8:
        return {"error": "An event can last 1 to 8 hours."}, 400
    if not 1 <= places <= 500:
        return {"error": "Places should be between 1 and 500."}, 400
    if not 0 <= volunteers <= 50:
        return {"error": "Volunteers needed should be between 0 and 50."}, 400

    db = get_db()
    cursor = db.execute(
        "INSERT INTO events (user_id, category, kind, title, about, ward, place_id, starts_at, hours, places, volunteers)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (g.user["id"], category, kind, title[:120], about[:600], venue["ward"], venue["id"], starts_at, hours, places, volunteers),
    )
    db.commit()
    return event_dict(find_event(cursor.lastrowid)), 201
