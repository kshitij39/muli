import os
from pathlib import Path

from flask import Flask

from . import accounts, db, events, places, reports, venues, wards


def create_app():
    app = Flask(__name__, instance_relative_config=True)
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

    return app
