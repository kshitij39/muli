# MULI

MULI puts Mumbai's public health, sanitation and education places next to the people they serve, ward by ward. People nearby can see what's around them and report problems, and NGOs can plan events in the wards that need them most.

There are two kinds of account. A Civic account is for people in Mumbai: they can see health posts, public toilets, schools and more near them, sign up to attend or volunteer at events, and report a problem anywhere in the city. An NGO account is for organisations: they plan health, sanitation or education events and check the problems people report.

For planning, MULI compares the 24 wards by how many people each health post or dispensary, public toilet and school has to serve. It suggests 3 wards, the NGO picks one, then it suggests 3 venues spread across that ward and the NGO picks one. There's no ranking from 1 to 24 and no machine learning, just counts the NGO can check for themselves.

The places come from BMC's map layers, downloaded from OpenCity. The number of people in each ward is BMC's figure for mid-2023.

The ward population in `data/ward_population_2023.csv` was copied by hand in October 2026 from BMC's civic demographics page (https://www.mcgm.gov.in/irj/portal/anonymous/qlCivicDemographics). The page only shows its table in a browser, so a script can't read it. The 24 wards add up to 13,014,389, while the page prints a total of 1,30,14,390.

What we left out on purpose: email sign-up and password reset, editing events, reminders, and anything the data can't back up, like how busy or how good a place is.

The app is React with Vite on the front and Flask with SQLite behind it.
