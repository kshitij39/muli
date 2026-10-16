import os
from pathlib import Path

from flask import Flask

from . import accounts, db, places, wards


def create_app():
    app = Flask(__name__, instance_relative_config=True)
    app.config["DATABASE"] = Path(app.instance_path) / "muli.sqlite"
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev")
    Path(app.instance_path).mkdir(exist_ok=True)

    db.init_app(app)
    app.cli.add_command(wards.wards_command)
    app.register_blueprint(places.bp)
    app.register_blueprint(accounts.bp)

    @app.get("/api/health")
    def health():
        return {"ok": True}

    return app
