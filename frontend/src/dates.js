export function dayText(when) {
  return new Date(when).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function longDayText(when) {
  return new Date(when).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function timeText(when) {
  return new Date(when).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export function agoText(when) {
  const days = Math.round((Date.now() - new Date(when).getTime()) / (24 * 60 * 60 * 1000))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
