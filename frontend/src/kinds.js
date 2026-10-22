export const EVENT_KINDS = {
  health: [
    {
      key: 'checkup',
      name: 'Health check-up camp',
      start: '09:00',
      hours: 4,
      places: 80,
      volunteers: 6,
      about: 'Free check-ups for blood pressure, sugar and weight by volunteer doctors and nurses, with advice on where to go next.',
    },
    {
      key: 'vaccination',
      name: 'Vaccination awareness',
      start: '11:00',
      hours: 2,
      places: 50,
      volunteers: 3,
      about: 'A short talk and a help desk on which vaccines children and adults need, and where to get them free at municipal health posts.',
    },
  ],
  sanitation: [
    {
      key: 'cleanliness',
      name: 'Cleanliness drive',
      start: '08:00',
      hours: 3,
      places: 60,
      volunteers: 10,
      about: 'Cleaning the lanes and open spaces around the venue with people who live nearby, and sorting the waste for collection.',
    },
    {
      key: 'hygiene',
      name: 'Hygiene awareness',
      start: '11:00',
      hours: 2,
      places: 50,
      volunteers: 4,
      about: 'Handwashing and safe drinking water, shown simply, with soap and leaflets for every family who comes.',
    },
  ],
  education: [
    {
      key: 'enrolment',
      name: 'Enrolment drive',
      start: '10:00',
      hours: 3,
      places: 40,
      volunteers: 6,
      about: "We'll go door to door near the venue, find children who aren't in school, and help their families with admission.",
    },
    {
      key: 'camp',
      name: 'Learning camp',
      start: '16:00',
      hours: 2,
      places: 30,
      volunteers: 4,
      about: 'Reading and maths in small groups after school. Volunteers each take a group of five or six children.',
    },
  ],
}

export const CUSTOM = { key: 'custom', name: 'Custom', start: '10:00', hours: 2, places: 40, volunteers: 4, about: '' }

export function kindName(event) {
  if (event.kind === 'custom') return 'Custom'
  return EVENT_KINDS[event.category].find((kind) => kind.key === event.kind).name
}
