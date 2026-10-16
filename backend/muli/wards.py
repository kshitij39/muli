import statistics

import click

from .db import get_db

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
