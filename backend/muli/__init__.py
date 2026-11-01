import os
from pathlib import Path

from flask import Flask, abort, send_from_directory

from . import accounts, db, events, places, reports, venues, wards

SITE = Path(__file__).resolve().parents[2] / "frontend" / "dist"


def create_app():
    app = Flask(__name__, instance_relative_config=True, static_folder=None)
    app.config["DATABASE"] = Path(app.instance_path) / "muli.sqlite"
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev")
    app.config["UPLOADS"] = Path(app.root_path).parent / "uploads"
    app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024
    Path(app.instance_path).mkdir(exist_ok=True)
    app.config["UPLOADS"].mkdir(exist_ok=True)

    db.init_app(app)
    app.cli.add_command(wards.wards_command)
    app.register_blueprint(places.bp)
    app.register_blueprint(accounts.bp)
    app.register_blueprint(wards.bp)
    app.register_blueprint(venues.bp)
    app.register_blueprint(events.bp)
    app.register_blueprint(reports.bp)

    @app.errorhandler(413)
    def too_big(error):
        return {"error": "That photo is over 5 MB. Choose a smaller one."}, 413

    @app.get("/api/health")
    def health():
        return {"ok": True}

    @app.get("/")
    @app.get("/<path:path>")
    def site(path=""):
        if path.startswith("api/"):
            abort(404)
        if path and (SITE / path).is_file():
            return send_from_directory(SITE, path)
        return send_from_directory(SITE, "index.html")

    return app
