import statistics

import click
from flask import Blueprint, request

from .accounts import login_required
from .db import get_db

bp = Blueprint("wards", __name__, url_prefix="/api")

AREAS = {
    "A": "Colaba, Fort", "B": "Dongri, Masjid Bunder", "C": "Bhuleshwar, Kalbadevi", "D": "Grant Road, Malabar Hill",
    "E": "Byculla", "F/N": "Matunga, Sion", "F/S": "Parel", "G/N": "Dadar, Dharavi", "G/S": "Worli",
    "H/E": "Bandra East, Santacruz East", "H/W": "Bandra West, Santacruz West", "K/E": "Andheri East",
    "K/W": "Andheri West", "L": "Kurla", "M/E": "Govandi, Mankhurd", "M/W": "Chembur", "N": "Ghatkopar",
    "P/N": "Malad", "P/S": "Goregaon", "R/C": "Borivali", "R/N": "Dahisar", "R/S": "Kandivali",
    "S": "Bhandup, Powai", "T": "Mulund",
}

COUNTED = {
    "health": ["uphc", "dispensary"],
    "sanitation": ["toilet"],
    "education": ["municipal", "aided", "unaided"],
}


def people_per(category):
    layers = COUNTED[category]
    db = get_db()
    counts = dict(
        db.execute(
            f"SELECT ward, COUNT(*) FROM places WHERE layer IN ({','.join('?' * len(layers))}) GROUP BY ward",
            layers,
        ).fetchall()
    )
    return {
        row["code"]: round(row["population"] / max(counts.get(row["code"], 0), 1))
        for row in db.execute("SELECT code, population FROM wards")
    }


def in_order(numbers):
    return sorted(numbers, key=lambda code: -numbers[code])


def suggested_wards(numbers):
    return in_order(numbers)[:3]


def bands(numbers):
    return {code: 0 if i < 8 else 1 if i < 16 else 2 for i, code in enumerate(in_order(numbers))}


def city_usual(numbers):
    return round(statistics.median(numbers.values()))


@click.command("wards")
def wards_command():
    for category in COUNTED:
        numbers = people_per(category)
        suggested = suggested_wards(numbers)
        click.echo(f"{category}: usually 1 place for every {city_usual(numbers):,} people")
        for code in in_order(numbers):
            click.echo(f"  {code:4} {numbers[code]:8,}{'  suggested' if code in suggested else ''}")


@bp.get("/wards")
@login_required()
def ward_list():
    category = request.args.get("category")
    if category not in COUNTED:
        return {"error": "Choose health, sanitation or education."}, 400
    numbers = people_per(category)
    band = bands(numbers)
    population = dict(get_db().execute("SELECT code, population FROM wards").fetchall())
    return {
        "category": category,
        "usual": city_usual(numbers),
        "suggested": suggested_wards(numbers),
        "wards": [
            {"code": code, "areas": AREAS[code], "population": population[code], "people_per": numbers[code], "band": band[code]}
            for code in sorted(numbers)
        ],
    }


@bp.get("/wards/<path:code>")
@login_required()
def ward(code):
    db = get_db()
    row = db.execute("SELECT * FROM wards WHERE code = ?", (code,)).fetchone()
    if not row:
        return {"error": "No such ward."}, 404
    counts = dict(db.execute("SELECT layer, COUNT(*) FROM places WHERE ward = ? GROUP BY layer", (code,)).fetchall())
    seats = db.execute(
        "SELECT SUM(json_extract(extra, '$.women') + json_extract(extra, '$.men')) FROM places WHERE ward = ? AND layer = 'toilet'",
        (code,),
    ).fetchone()[0]
    numbers = {}
    for category in COUNTED:
        all_wards = people_per(category)
        numbers[category] = {
            "people_per": all_wards[code],
            "band": bands(all_wards)[code],
            "usual": city_usual(all_wards),
            "suggested": code in suggested_wards(all_wards),
        }
    return {
        "code": code,
        "areas": AREAS[code],
        "population": row["population"],
        "counts": counts,
        "toilet_seats": seats or 0,
        "numbers": numbers,
    }
