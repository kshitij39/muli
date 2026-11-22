export const BLOCKED =
  'Location is blocked for this site. To allow it, click the icon to the left of the web address, allow location, and try again.'

export function findMe(found, failed) {
  if (!navigator.geolocation || !window.isSecureContext) {
    failed("This browser can't share your location here.")
    return () => {}
  }
  let best = null
  let watch = null
  let timer = null
  const stop = () => {
    navigator.geolocation.clearWatch(watch)
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    stop()
    if (!best) failed("Your browser couldn't find your location in time.")
  }, 30000)
  watch = navigator.geolocation.watchPosition(
    (position) => {
      if (best && position.coords.accuracy > best.accuracy / 2) return
      best = { lat: position.coords.latitude, lon: position.coords.longitude, accuracy: position.coords.accuracy, gps: true }
      found(best)
      if (best.accuracy <= 100) stop()
    },
    (error) => {
      if (error.code !== error.PERMISSION_DENIED) return
      stop()
      failed(BLOCKED)
    },
    { enableHighAccuracy: true, maximumAge: 60000 },
  )
  return stop
}

export async function locationPermission() {
  try {
    return (await navigator.permissions.query({ name: 'geolocation' })).state
  } catch {
    return 'prompt'
  }
}

export function saveSpot(spot) {
  try {
    sessionStorage.setItem('muli-spot', JSON.stringify(spot))
  } catch {
    return
  }
}

export function savedSpot() {
  try {
    return JSON.parse(sessionStorage.getItem('muli-spot'))
  } catch {
    return null
  }
}
