import L from 'leaflet'

export const suggestedPin = L.divIcon({ className: '', html: '<div class="pin suggested">S</div>', iconSize: [24, 24], iconAnchor: [12, 12] })

export const dropPin = L.divIcon({
  className: 'drop-pin',
  html: '<svg width="24" height="34" viewBox="0 0 24 34" aria-hidden="true"><path d="M12 1.5C6.2 1.5 1.5 6.1 1.5 11.9c0 7.9 10.5 20.4 10.5 20.4s10.5-12.5 10.5-20.4c0-5.8-4.7-10.4-10.5-10.4z" fill="#1c1917" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="#ffd23f"/></svg>',
  iconSize: [24, 34],
  iconAnchor: [12, 33],
  popupAnchor: [0, -30],
})

export function numberPin(label, picked) {
  const width = Math.max(24, 12 + String(label).length * 7)
  return L.divIcon({
    className: '',
    html: `<div class="pin ${picked ? 'picked' : ''}">${label}</div>`,
    iconSize: [width, 24],
    iconAnchor: [width / 2, 12],
  })
}
