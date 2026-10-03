DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS wards;

CREATE TABLE places (
  id INTEGER PRIMARY KEY,
  layer TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  ward TEXT NOT NULL,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  rough INTEGER NOT NULL,
  extra TEXT NOT NULL
);

CREATE INDEX places_layer ON places (layer);

CREATE TABLE wards (
  code TEXT PRIMARY KEY,
  population INTEGER NOT NULL
);
