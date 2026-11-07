# MULI

MULI puts Mumbai's public health, sanitation and education places next to the people they serve, ward by ward. People nearby can see what's around them and report problems, and NGOs can plan events in the wards that need them most.

There are two kinds of account. A Civic account is for people in Mumbai: they can see health posts, public toilets, schools and more near them, sign up to attend or volunteer at events, and report a problem anywhere in the city. An NGO account is for organisations: they plan health, sanitation or education events and check the problems people report.

For planning, MULI compares the 24 wards by how many people each health post or dispensary, public toilet and school has to serve. It suggests 3 wards, the NGO picks one, then it suggests 3 venues spread across that ward and the NGO picks one. There's no ranking from 1 to 24 and no machine learning, just counts the NGO can check for themselves.

The places come from BMC's map layers, downloaded from OpenCity. The number of people in each ward is BMC's figure for mid-2023.

The ward population in `data/ward_population_2023.csv` was copied by hand in October 2026 from BMC's civic demographics page (https://www.mcgm.gov.in/irj/portal/anonymous/qlCivicDemographics). The page only shows its table in a browser, so a script can't read it. The 24 wards add up to 13,014,389, while the page prints a total of 1,30,14,390.

What we left out on purpose: email sign-up and password reset, editing events, reminders, and anything the data can't back up, like how busy or how good a place is.

The app is React with Vite on the front and Flask with SQLite behind it.

## Running it

We built it with Python 3.14 and Node 23.

```
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/flask --app muli init-db
.venv/bin/flask --app muli run
```

`init-db` builds the database from the files in `data/` and prints how many places it loaded. Run it again whenever you want a clean start, but it also wipes accounts, events and reports.

In a second terminal:

```
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173 and create a Civic or an NGO account. To run it without the Vite dev server, use `npm run build` in `frontend` and open http://localhost:5000 instead; Flask serves the built pages. Set `SECRET_KEY` to something random before putting it anywhere other people can reach.

## Where the data comes from

All 19 map layers are BMC data that we downloaded as KML files from OpenCity (data.opencity.in) in November 2026:

- health: health posts and UPHCs, dispensaries, maternity homes, hospitals, animal hospitals
- education: municipal, aided and unaided schools
- sanitation: public toilets
- city: parks and maidans, Miyawaki gardens and the zoo, police, fire stations, ward offices, BEST bus stops, railway stations, parking, ward boundaries and slum areas

The KML files themselves aren't in the repo. They're 22 MB, mostly of fields we don't use, and some carry the names of the BMC staff who edited them. Instead `backend/prepare_data.py` reads them and writes the three files in `data/` that the app loads: `places.csv`, `wards.geojson` and `slums.geojson`. To remake them, put the KML files in `data/raw/` (in `health/`, `education/`, `sanitation/` and `city/` folders, named as on OpenCity) and run `.venv/bin/python prepare_data.py` from `backend`.

While doing that it tidies the names (school short forms like MUN and MAR, places written in capitals), leaves out 19 points that have no location, and works out each place's ward. Most health posts, dispensaries and hospitals are only located to about 1 km in BMC's files, so for those we trust the ward written in the file over the map. They show as hollow dots marked "approximate location", and 54 places that could be several kilometres off are kept off the map but still counted in their ward.

The ward population is described above.

## How wards and venues are suggested

For each category we divide a ward's population by how many places it has: health posts and dispensaries for health, public toilets for sanitation, and schools of every kind for education. The 3 wards where each place has to serve the most people are suggested. On the ward map the 24 wards are split into three colours of 8 each: poorly served, average and well served. `.venv/bin/flask --app muli wards` prints the whole table.

For venues, each category has an order of places that suit it. Health events go to health posts, dispensaries, maternity homes and hospitals first; education events to schools; sanitation events to parks and schools, then health places. Public toilets, bus stops, stations, parking, gardens and animal hospitals are never venues. The 3 suggested venues are first-choice places spread across the ward: the one nearest the middle of the ward, then the one farthest from it, then the one farthest from both. The NGO can still pick any ward and any venue.

## What it can't tell you

It counts places. It doesn't know how big, good or busy any of them are, or whether a health post is open. The population is BMC's projection for 2023, not a fresh count. Places only roughly located by BMC are only roughly placed here too, and suggestions near them are only as good as that.
