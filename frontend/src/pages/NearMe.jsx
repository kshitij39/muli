import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker } from 'react-leaflet'
import { api } from '../api.js'
import MapView from '../components/MapView.jsx'
import PageTop from '../components/PageTop.jsx'
import PlaceDot from '../components/PlaceDot.jsx'
import { CATEGORIES, GOVANDI_STATION, distanceText, placeDetails, walkTime } from '../places.js'

const SHOWN = 25
const GROUPS = ['health', 'education', 'sanitation', 'city']

function NearMe() {
  const [layers, setLayers] = useState([])
  const [enabled, setEnabled] = useState([])
  const [spot, setSpot] = useState(null)
  const [found, setFound] = useState(null)
  const [status, setStatus] = useState('')
  const map = useRef(null)
  const markers = useRef({})

  useEffect(() => {
    api('/api/layers').then((data) => {
      setLayers(data)
      setEnabled(data.filter((layer) => layer.on).map((layer) => layer.key))
    })
  }, [])

  useEffect(() => {
    if (!spot || !enabled.length) return
    api(`/api/places?layers=${enabled.join(',')}&near=${spot.lat},${spot.lon}&km=1`).then(setFound)
  }, [spot, enabled])

  function toggle(key, on) {
    setEnabled(on ? [...enabled, key] : enabled.filter((other) => other !== key))
  }

  function chooseSpot(newSpot) {
    setFound(null)
    setSpot(newSpot)
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setStatus("This browser can't share your location.")
      return
    }
    setStatus('Finding where you are...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('Showing places near you.')
        chooseSpot({ lat: position.coords.latitude, lon: position.coords.longitude })
      },
      () => setStatus("Couldn't find your location."),
    )
  }

  function keepMarker(id, marker) {
    markers.current[id] = marker
  }

  function showOnMap(place) {
    map.current.setView([place.lat, place.lon], Math.max(map.current.getZoom(), 16), { animate: false })
    markers.current[place.id]?.openPopup()
  }

  const bounds = useMemo(() => (spot ? L.latLng(spot.lat, spot.lon).toBounds(2000) : null), [spot])
  const byKey = Object.fromEntries(layers.map((layer) => [layer.key, layer]))
  const shown = found?.filter((place) => enabled.includes(place.layer))
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
        <button type="button" className="btn btn-primary" onClick={useMyLocation}>
          Use my location
        </button>
        <p className="mt-3 text-sm text-stone-600">{status}</p>

        <section className="panel mt-4">
          <div className="panel-head">
            <h2>Show on the map</h2>
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
              </fieldset>
            ))}
          </div>
        </section>

        <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="lg:order-2 lg:col-span-3">
            <MapView
              ref={map}
              bounds={bounds}
              onClick={(clicked) => {
                setStatus('Showing places near the spot you clicked.')
                chooseSpot(clicked)
              }}
              className="h-80 sm:h-96 lg:sticky lg:top-4 lg:h-[36rem]"
            >
              {spot && (
                <CircleMarker
                  center={[spot.lat, spot.lon]}
                  radius={7}
                  interactive={false}
                  pathOptions={{ color: '#1c1917', weight: 3, fillColor: '#fff', fillOpacity: 1 }}
                />
              )}
              {shown?.map((place) => (
                <PlaceDot key={place.id} place={place} layer={byKey[place.layer]} km={place.km} onMarker={keepMarker} />
              ))}
            </MapView>
          </div>
          <section className="panel lg:order-1 lg:col-span-2">
            {!spot && (
              <div className="p-4 text-stone-600">
                <p>Use your location, or click the map where you are, to see what's around you.</p>
                <p className="mt-2 text-sm">
                  Just trying it out?{' '}
                  <button type="button" className="linklike" onClick={() => chooseSpot(GOVANDI_STATION)}>
                    Start from Govandi station
                  </button>
                  .
                </p>
              </div>
            )}
            {spot && !enabled.length && <p className="p-4 text-stone-600">Choose at least one kind of place to show.</p>}
            {spot && enabled.length > 0 && !shown && <p className="p-4 text-stone-600">Finding places near you...</p>}
            {spot && enabled.length > 0 && shown?.length === 0 && (
              <p className="p-4 text-stone-600">None of the places you've chosen are within 1 km.</p>
            )}
            {enabled.length > 0 && shown?.length > 0 && (
              <>
                <div className="panel-head">
                  <h2>
                    {shown.length} {shown.length === 1 ? 'place' : 'places'} within 1 km
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
