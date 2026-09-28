import csv
import html
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
KML = "{http://www.opengis.net/kml/2.2}"

LAYERS = [
    ("uphc", "health/uphc.kml", ["UPHC_Name"], ["UPHC_Addre"]),
    ("dispensary", "health/dispensaries.kml", ["Current_Na"], ["Current_co"]),
    ("maternity", "health/maternity_hospital.kml", ["Name_of_Mat_Home"], ["Address"]),
    ("hospital", "health/hospital.kml", ["NAME_OF_HO"], ["ADDRESS"]),
    ("animal", "health/veterinary_hospitals.kml", ["NAME"], ["LOCATION"]),
    ("municipal", "education/muncipal_school.kml", ["Name"], ["Address"]),
    ("aided", "education/aided_school.kml", ["SchName"], ["Address"]),
    ("unaided", "education/unaided_school.kml", ["Name"], ["Address"]),
    ("toilet", "sanitation/public_toilet.kml", [], ["Address"]),
    ("park", "city/parks.kml", ["NAME"], ["ADDRESS"]),
    ("miyawaki", "city/miyawaki_zoo.kml", ["Miyawaki_Garden_Name", "Name"], ["Address"]),
    ("police", "city/police_station.kml", ["NAME"], ["LOCATION"]),
    ("fire", "city/Fire_station.kml", [], ["LOCATION"]),
    ("ward_office", "city/ward_office.kml", ["WARD_NAME"], ["LOCATION"]),
    ("bus", "city/best_busstops.kml", ["BEST_BUS_S"], ["ADDRESS"]),
    ("station", "city/station.kml", ["For_Labell"], []),
    ("parking", "city/parking.kml", [], []),
]
SCHOOLS = {"municipal", "aided", "unaided"}


def placemarks(path):
    return ET.parse(RAW / path).getroot().iter(KML + "Placemark")


def fields(placemark):
    found = {}
    for item in placemark.iter():
        if item.tag == KML + "SimpleData":
            found[item.get("name")] = (item.text or "").strip()
        elif item.tag == KML + "Data":
            found[item.get("name")] = (item.findtext(KML + "value") or "").strip()
    return found


def first_point(placemark):
    for coords in placemark.iter(KML + "coordinates"):
        lon, lat = coords.text.split()[0].split(",")[:2]
        decimals = min(len(part.split(".")[1]) if "." in part else 0 for part in (lon, lat))
        return float(lat), float(lon), decimals
    return None


def first(data, keys):
    return next((data[key] for key in keys if data.get(key)), "")


def plain(text):
    return re.sub(r"\s+", " ", html.unescape(text or "")).strip()


def extras(key, data):
    if key == "toilet":
        return {"women": int(data.get("Count_of_F") or 0), "men": int(data.get("Count_of_M") or 0)}
    if key in SCHOOLS:
        low = data.get("Class_From") or data.get("Cls_From")
        high = data.get("Class_To") or data.get("Cls_To")
        kind = re.sub(r"^\d+-", "", data.get("School_Typ") or data.get("Sch_Type") or "").strip().lower()
        kind = {"co-educational": "co-ed", "girls": "girls", "boys": "boys"}.get(kind, "")
        return {"low": int(low) if low else None, "high": int(high) if high else None, "kind": kind}
    if key == "hospital":
        return {"type": plain(data.get("TYPE"))}
    return {}


def read_places():
    rows = []
    missing = {}
    for key, path, name_keys, address_keys in LAYERS:
        for placemark in placemarks(path):
            data = fields(placemark)
            at = first_point(placemark)
            if not at:
                missing[key] = missing.get(key, 0) + 1
                continue
            lat, lon, decimals = at
            name = plain(placemark.findtext(KML + "name")) or plain(first(data, name_keys))
            rough = 0 if decimals >= 3 else 1 if decimals == 2 else 2
            extra = extras(key, data)
            rows.append({
                "layer": key,
                "name": name,
                "address": plain(first(data, address_keys)),
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "rough": rough,
                "extra": json.dumps(extra) if extra else "",
            })
    return rows, missing


def main():
    rows, missing = read_places()
    with open(ROOT / "data" / "places.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    counts = {}
    for row in rows:
        counts[row["layer"]] = counts.get(row["layer"], 0) + 1
    for key, *_ in LAYERS:
        print(f"{key:12} {counts.get(key, 0):6}")
    print(f"{'total':12} {len(rows):6}")
    print("left out, no location:", missing)


if __name__ == "__main__":
    main()
