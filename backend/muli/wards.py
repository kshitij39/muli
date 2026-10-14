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
