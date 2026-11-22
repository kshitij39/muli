import re

from flask import Blueprint, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_db

bp = Blueprint("accounts", __name__, url_prefix="/api")

MODES = {"civic": "Civic", "ngo": "NGO"}
USERNAME = re.compile(r"[a-z0-9._-]{3,30}")


def account(user):
    return {"username": user["username"], "name": user["name"], "mode": user["mode"], "ngo_name": user["ngo_name"]}


@bp.post("/accounts")
def create_account():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")
    name = str(data.get("name", "")).strip()
    ngo_name = str(data.get("ngo_name", "")).strip()
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))
    if mode not in MODES:
        return {"error": "Choose Civic or NGO."}, 400
    if len(name) < 2:
        return {"error": "Enter your name."}, 400
    if mode == "ngo" and len(ngo_name) < 2:
        return {"error": "Enter your NGO's name."}, 400
    if not USERNAME.fullmatch(username):
        return {"error": "Use 3 to 30 small letters, numbers, dots or dashes for the username."}, 400
    if len(password) < 8:
        return {"error": "Use at least 8 characters for the password."}, 400

    db = get_db()
    if db.execute("SELECT 1 FROM users WHERE username = ?", (username,)).fetchone():
        return {"error": "That username is taken. Try another."}, 409
    db.execute(
        "INSERT INTO users (username, password_hash, name, mode, ngo_name) VALUES (?, ?, ?, ?, ?)",
        (username, generate_password_hash(password), name, mode, ngo_name if mode == "ngo" else None),
    )
    db.commit()
    user = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    session.clear()
    session["user_id"] = user["id"]
    return account(user), 201


def signed_in_user():
    if "user_id" not in session:
        return None
    return get_db().execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()


@bp.post("/session")
def sign_in():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")
    username = str(data.get("username", "")).strip().lower()
    password = str(data.get("password", ""))
    user = get_db().execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return {"error": "That username and password don't match."}, 401
    if user["mode"] != mode:
        other = MODES[user["mode"]]
        return {"error": f"{username} is {'an' if other == 'NGO' else 'a'} {other} account. Use {other} sign in instead."}, 403
    session.clear()
    session["user_id"] = user["id"]
    return account(user)


@bp.delete("/session")
def sign_out():
    session.clear()
    return {"ok": True}


@bp.get("/me")
def me():
    user = signed_in_user()
    return {"user": account(user) if user else None}
