from .db import get_db

SCHOOLS = ["municipal", "aided", "unaided"]
GROUPS = {
    "health": [["uphc", "dispensary", "maternity", "hospital"], SCHOOLS + ["park"], ["ward_office", "police", "fire"]],
    "education": [SCHOOLS, ["park"], ["ward_office", "police", "fire"]],
    "sanitation": [["park"] + SCHOOLS, ["uphc", "dispensary", "hospital"], ["ward_office", "police", "fire"]],
}


def venue_groups(category, ward):
    groups = []
    for layers in GROUPS[category]:
        rows = get_db().execute(
            f"SELECT * FROM places WHERE ward = ? AND rough < 2 AND layer IN ({','.join('?' * len(layers))})"
            " ORDER BY name, address",
            [ward, *layers],
        ).fetchall()
        groups.append(rows)
    return groups


def venues_in_order(category, ward):
    return [row for group in venue_groups(category, ward) for row in group]
