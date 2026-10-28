export function dayText(when) {
  return new Date(when).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function longDayText(when) {
  return new Date(when).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function timeText(when) {
  return new Date(when).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}
