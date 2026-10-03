import csv
import sqlite3
from pathlib import Path

import click
from flask import Flask, g

DATA = Path(__file__).resolve().parent.parent / "data"

app = Flask(__name__, instance_relative_config=True)
app.config["DATABASE"] = Path(app.instance_path) / "muli.sqlite"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@app.cli.command("init-db")
def init_db():
    Path(app.instance_path).mkdir(exist_ok=True)
    db = get_db()
    with app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf8"))
    with open(DATA / "places.csv", encoding="utf-8") as f:
        db.executemany(
            "INSERT INTO places (layer, name, address, ward, lat, lon, rough, extra)"
            " VALUES (:layer, :name, :address, :ward, :lat, :lon, :rough, :extra)",
            csv.DictReader(f),
        )
    with open(DATA / "ward_population_2023.csv", encoding="utf-8") as f:
        db.executemany("INSERT INTO wards (code, population) VALUES (:ward, :population_2023)", csv.DictReader(f))
    db.commit()
    for row in db.execute("SELECT layer, COUNT(*) AS n FROM places GROUP BY layer ORDER BY n DESC"):
        click.echo(f"{row['layer']:12} {row['n']:6}")
    click.echo(f"{db.execute('SELECT COUNT(*) FROM wards').fetchone()[0]} wards. Database ready.")


@app.get("/api/health")
def health():
    return {"ok": True}
