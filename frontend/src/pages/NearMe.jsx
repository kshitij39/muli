import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, CircleMarker, Marker } from 'react-leaflet'
import { api } from '../api.js'
import MapView from '../components/MapView.jsx'
import LoadingPanel from '../components/LoadingPanel.jsx'
import PageTop from '../components/PageTop.jsx'
import PlaceDot from '../components/PlaceDot.jsx'
import { BLOCKED, findMe, locationPermission, savedSpot, saveSpot } from '../location.js'
import { CATEGORIES, GOVANDI_STATION, distanceKm, distanceText, placeDetails, walkTime } from '../places.js'

const SHOWN = 25
const GROUPS = ['health', 'education', 'sanitation', 'city']
const DISTANCES = { 0.5: '500 m', 1: '1 km', 2: '2 km' }
const YOU = L.divIcon({ className: '', html: '<div class="you"></div>', iconSize: [18, 18], iconAnchor: [9, 9] })

function placedText(found) {
  const within = distanceText(found.accuracy / 1000)
  if (found.accuracy > 1000) {
    return `Your browser only knows roughly where you are, within about ${within} (the blue circle). If that's wrong, click the map where you are.`
  }
  return `Showing places near you. Your browser placed you within about ${within}. Not right? Click the map where you are.`
}

function startText(spot) {
  if (!spot) return ''
  return spot.gps
    ? 'Showing places near where you were found earlier. Use my location to update it.'
    : 'Showing places near the spot you chose earlier.'
}

function NearMe() {
  const [layers, setLayers] = useState([])
  const [enabled, setEnabled] = useState([])
  const [spot, setSpot] = useState(savedSpot)
  const [finding, setFinding] = useState(false)
  const [found, setFound] = useState(null)
  const [km, setKm] = useState(1)
  const [cityWide, setCityWide] = useState([])
  const [zoomed, setZoomed] = useState([])
  const [view, setView] = useState(null)
  const [showWards, setShowWards] = useState(true)
  const [showSlums, setShowSlums] = useState(true)
  const [status, setStatus] = useState(() => startText(spot))
  const map = useRef(null)
  const markers = useRef({})
  const stopFinding = useRef(() => {})

  useEffect(() => {
    if (!savedSpot()) {
      locationPermission().then((answer) => {
        if (answer === 'granted') startFinding()
        if (answer === 'denied') setStatus(`${BLOCKED} Or click the map where you are.`)
      })
    }
    return () => stopFinding.current()
  }, [])

  useEffect(() => {
    api('/api/layers').then((data) => {
      setLayers(data)
      setEnabled(data.filter((layer) => layer.on).map((layer) => layer.key))
    })
  }, [])

  useEffect(() => {
    if (!spot || !enabled.length) return
    api(`/api/places?layers=${enabled.join(',')}&near=${spot.lat},${spot.lon}&km=${km}`).then(setFound)
  }, [spot, enabled, km])

  useEffect(() => {
    if (!enabled.length) return
    api(`/api/places?layers=${enabled.join(',')}`).then(setCityWide)
  }, [enabled])

  useEffect(() => {
    const nearOnly = layers.filter((layer) => layer.near_only && enabled.includes(layer.key)).map((layer) => layer.key)
    if (!view || view.zoom < 16 || !nearOnly.length) return
    const { south, west, north, east } = view
    api(`/api/places?layers=${nearOnly.join(',')}&box=${south},${west},${north},${east}`).then(setZoomed)
  }, [view, enabled, layers])

  function moved(map) {
    const box = map.getBounds()
    setView({ zoom: map.getZoom(), south: box.getSouth(), west: box.getWest(), north: box.getNorth(), east: box.getEast() })
  }

  function toggle(key, on) {
    setEnabled(on ? [...enabled, key] : enabled.filter((other) => other !== key))
  }

  function showNear(newSpot, message) {
    saveSpot(newSpot)
    setFound(null)
    setSpot(newSpot)
    setStatus(message)
  }

  function chooseSpot(newSpot, message) {
    stopFinding.current()
    setFinding(false)
    showNear(newSpot, message)
  }

  function startFinding() {
    stopFinding.current()
    setFinding(true)
    setStatus('Your browser is working out where you are. On a laptop this can take up to half a minute. In a hurry? Click the map where you are.')
    stopFinding.current = findMe(
      (found) => {
        setFinding(false)
        showNear(found, placedText(found))
      },
      (problem) => {
        setFinding(false)
        setStatus(`${problem} Or click the map where you are.`)
      },
    )
  }

  function keepMarker(id, marker) {
    markers.current[id] = marker
  }

  function showOnMap(place) {
    map.current.setView([place.lat, place.lon], Math.max(map.current.getZoom(), 16), { animate: false })
    markers.current[place.id]?.openPopup()
  }

  const bounds = useMemo(() => (spot ? L.latLng(spot.lat, spot.lon).toBounds(km * 2000) : null), [spot, km])
  const byKey = Object.fromEntries(layers.map((layer) => [layer.key, layer]))
  const shown = found?.filter((place) => enabled.includes(place.layer))
  const onMap = new Map()
  const zoomedIn = view?.zoom >= 16
  for (const place of [...cityWide, ...(shown || []), ...(zoomedIn ? zoomed : [])]) {
    if (enabled.includes(place.layer)) onMap.set(place.id, place)
  }
  const perCategory = {}
  for (const place of shown || []) {
    const category = byKey[place.layer].category
    perCategory[category] = (perCategory[category] || 0) + 1
  }

  return (
    <>
      <PageTop
        title="Near me"
        text="Health posts, toilets, schools and more around you, from BMC's map. Your location is only used to sort this list."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" onClick={startFinding} disabled={finding}>
            Use my location
          </button>
          <label htmlFor="distance" className="sr-only">
            Distance
          </label>
          <select id="distance" className="input w-40" value={km} onChange={(event) => setKm(Number(event.target.value))}>
            {Object.entries(DISTANCES).map(([value, text]) => (
              <option key={value} value={value}>
                Within {text}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-sm text-stone-600">{status}</p>

        <section className="panel mt-4">
          <div className="panel-head">
            <h2>Show on the map</h2>
            <span className="text-sm text-stone-500">Toilets and bus stops show within your distance, or when you zoom in</span>
          </div>
          <div className="grid gap-5 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {GROUPS.map((category) => (
              <fieldset key={category} className="min-w-0">
                <legend className="mb-1 flex items-center gap-2 font-semibold">
                  <span className="mark" style={{ background: CATEGORIES[category].color }} />
                  {CATEGORIES[category].name}
                </legend>
                {layers
                  .filter((layer) => layer.category === category)
                  .map((layer) => (
                    <label key={layer.key} className="flex items-center gap-2 py-0.5 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-stone-900"
                        checked={enabled.includes(layer.key)}
                        onChange={(event) => toggle(layer.key, event.target.checked)}
                      />
                      <span className="min-w-0 flex-1">{layer.label}</span>
                      <span className="text-stone-500 tabular-nums">{layer.count.toLocaleString('en-IN')}</span>
                    </label>
                  ))}
                {category === 'city' && (
                  <>
                    <label className="flex items-center gap-2 py-0.5 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-stone-900"
                        checked={showWards}
                        onChange={(event) => setShowWards(event.target.checked)}
                      />
                      Ward boundaries
                    </label>
                    <label className="flex items-center gap-2 py-0.5 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-stone-900"
                        checked={showSlums}
                        onChange={(event) => setShowSlums(event.target.checked)}
                      />
                      Slum areas
                    </label>
                  </>
                )}
              </fieldset>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="lg:order-2 lg:col-span-3">
            <MapView
              ref={map}
              bounds={bounds}
              onMove={moved}
              showWards={showWards}
              showSlums={showSlums}
              onClick={(clicked) => chooseSpot(clicked, 'Showing places near the spot you clicked.')}
              className="h-80 sm:h-96 lg:sticky lg:top-4 lg:h-[36rem]"
            >
              {spot?.gps && (
                <>
                  <Circle
                    center={[spot.lat, spot.lon]}
                    radius={spot.accuracy}
                    interactive={false}
                    pathOptions={{ color: '#2563eb', weight: 1, fillOpacity: 0.08 }}
                  />
                  <Marker position={[spot.lat, spot.lon]} icon={YOU} interactive={false} keyboard={false} />
                </>
              )}
              {spot && !spot.gps && (
                <CircleMarker
                  center={[spot.lat, spot.lon]}
                  radius={7}
                  interactive={false}
                  pathOptions={{ color: '#1c1917', weight: 3, fillColor: '#fff', fillOpacity: 1 }}
                />
              )}
              {[...onMap.values()].map((place) => (
                <PlaceDot
                  key={place.id}
                  place={place}
                  layer={byKey[place.layer]}
                  km={spot ? distanceKm(spot, place) : undefined}
                  onMarker={keepMarker}
                />
              ))}
            </MapView>
          </div>
          <section className="panel lg:order-1 lg:col-span-2">
            {!spot && finding && (
              <LoadingPanel
                title="Finding where you are"
                className="border-0"
                lines={[
                  'Your browser is working out where you are. On a laptop this can take up to half a minute.',
                  'In a hurry? Click the map where you are.',
                ]}
              />
            )}
            {!spot && !finding && (
              <div className="p-4 text-stone-600">
                <p>Use your location, or click the map where you are, to see what's around you.</p>
                <p className="mt-2 text-sm">
                  Just trying it out?{' '}
                  <button type="button" className="linklike" onClick={() => chooseSpot(GOVANDI_STATION, 'Showing places near Govandi station.')}>
                    Start from Govandi station
                  </button>
                  .
                </p>
              </div>
            )}
            {spot && !enabled.length && <p className="p-4 text-stone-600">Choose at least one kind of place to show.</p>}
            {spot && enabled.length > 0 && !shown && (
              <LoadingPanel
                title="Finding places near you"
                className="border-0"
                lines={[
                  `Measuring the walk from ${spot.gps ? 'you' : 'that spot'} to every place in the ${enabled.length} ${
                    enabled.length === 1 ? 'kind' : 'kinds'
                  } you've chosen, within ${DISTANCES[km]}`,
                ]}
              />
            )}
            {spot && enabled.length > 0 && shown?.length === 0 && (
              <p className="p-4 text-stone-600">
                None of the places you've chosen are within {DISTANCES[km]}. Try a bigger distance.
              </p>
            )}
            {enabled.length > 0 && shown?.length > 0 && (
              <>
                <div className="panel-head">
                  <h2>
                    {shown.length} {shown.length === 1 ? 'place' : 'places'} within {DISTANCES[km]}
                  </h2>
                  <span className="text-sm text-stone-500">Walking time</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-stone-200 px-4 py-2 text-sm text-stone-600">
                  {GROUPS.filter((category) => perCategory[category]).map((category) => (
                    <span key={category} className="inline-flex items-center gap-1.5">
                      <span className="mark" style={{ background: CATEGORIES[category].color }} />
                      {perCategory[category]} {CATEGORIES[category].name.toLowerCase()}
                    </span>
                  ))}
                </div>
                <ol className="divide-y divide-stone-200">
                  {shown.slice(0, SHOWN).map((place) => {
                    const layer = byKey[place.layer]
                    const kind = [place.name === layer.one ? '' : layer.one, placeDetails(place)].filter(Boolean).join(', ')
                    return (
                      <li key={place.id} className="flex gap-3 px-4 py-2.5">
                        <span className="mark mt-1.5" style={{ background: CATEGORIES[layer.category].color }} />
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            className="text-left font-semibold leading-snug hover:underline"
                            onClick={() => showOnMap(place)}
                          >
                            {place.name}
                          </button>
                          <div className="text-sm text-stone-600">{kind}</div>
                          {place.layer === 'toilet' && place.address && (
                            <div className="text-xs text-stone-500">{place.address}</div>
                          )}
                          {place.rough === 1 && <div className="text-xs text-amber-800">Approximate location</div>}
                        </div>
                        <div className="shrink-0 text-right text-sm tabular-nums">
                          <div className="font-medium">{walkTime(place.km)}</div>
                          <div className="text-stone-500">{distanceText(place.km)}</div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
                {shown.length > SHOWN && (
                  <p className="border-t border-stone-200 px-4 py-2.5 text-sm text-stone-500">
                    Showing the nearest {SHOWN} of {shown.length}. The rest are on the map.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

export default NearMe
