import csv
import sqlite3
from pathlib import Path

import click
from flask import current_app, g

DATA = Path(__file__).resolve().parents[2] / "data"


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(current_app.config["DATABASE"])
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@click.command("init-db")
def init_db_command():
    db = get_db()
    with current_app.open_resource("schema.sql") as f:
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


def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)
