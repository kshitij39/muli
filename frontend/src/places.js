export const CATEGORIES = {
  health: { name: 'Health', color: '#0f766e' },
  education: { name: 'Education', color: '#1d4ed8' },
  sanitation: { name: 'Sanitation', color: '#b45309' },
  city: { name: 'City', color: '#57534e' },
}

export const GOVANDI_STATION = { lat: 19.05509, lon: 72.91539 }

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
