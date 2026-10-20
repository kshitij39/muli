export const CATEGORIES = {
  health: {
    name: 'Health',
    color: '#0f766e',
    shades: ['#0f766e', '#5eead4', '#ccfbf1'],
    per: 'health post or dispensary',
    counting: 'health posts and dispensaries',
  },
  education: {
    name: 'Education',
    color: '#1d4ed8',
    shades: ['#1d4ed8', '#93c5fd', '#dbeafe'],
    per: 'school',
    counting: 'schools',
  },
  sanitation: {
    name: 'Sanitation',
    color: '#b45309',
    shades: ['#b45309', '#fbbf24', '#fef3c7'],
    per: 'public toilet',
    counting: 'public toilets',
  },
  city: { name: 'City', color: '#57534e' },
}

export const EVENT_CATEGORIES = ['health', 'sanitation', 'education']

export const BANDS = ['Poorly served', 'Average', 'Well served']

export function roughly(n) {
  const step = n < 100 ? 5 : n < 1000 ? 10 : n < 10000 ? 100 : 1000
  return (Math.round(n / step) * step).toLocaleString('en-IN')
}

export function numberText(category, peoplePer) {
  return `1 ${CATEGORIES[category].per} for every ${roughly(peoplePer)} people`
}

export function usualText(usual) {
  return `Across the city it's usually about 1 for every ${roughly(usual)}.`
}

export const GOVANDI_STATION = { lat: 19.05509, lon: 72.91539 }

export function distanceKm(a, b) {
  const north = (a.lat - b.lat) * 111.32
  const east = (a.lon - b.lon) * 111.32 * Math.cos((19.07 * Math.PI) / 180)
  return Math.hypot(north, east)
}

export function walkTime(km) {
  const minutes = Math.max(1, Math.round(((km * 1.3) / 4.5) * 60))
  return minutes >= 60 ? 'over an hour' : `${minutes} min`
}

export function distanceText(km) {
  return km < 1 ? `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m` : `${km.toFixed(1)} km`
}

export function placeDetails(place) {
  const bits = []
  const extra = place.extra
  if (place.layer === 'toilet') bits.push(`${extra.women} women's and ${extra.men} men's seats`)
  if (extra.low && extra.high) bits.push(extra.low === extra.high ? `class ${extra.low}` : `classes ${extra.low} to ${extra.high}`)
  if (extra.kind === 'girls' || extra.kind === 'boys') bits.push(`${extra.kind} only`)
  if (extra.type) bits.push(extra.type)
  return bits.join(', ')
}

export function directionsLink(place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}&travelmode=walking`
}
