import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleMarker } from 'react-leaflet'
import { api } from '../api.js'
import MapView from '../components/MapView.jsx'
import PageTop from '../components/PageTop.jsx'
import PlaceDot from '../components/PlaceDot.jsx'
import { CATEGORIES, GOVANDI_STATION, distanceText, placeDetails, walkTime } from '../places.js'

const SHOWN = 25

function NearMe() {
  const [layers, setLayers] = useState([])
  const [spot, setSpot] = useState(null)
  const [found, setFound] = useState(null)
  const [status, setStatus] = useState('')
  const map = useRef(null)
  const markers = useRef({})

  useEffect(() => {
    api('/api/layers').then(setLayers)
  }, [])

  useEffect(() => {
    if (!spot || !layers.length) return
    const on = layers.filter((layer) => layer.on).map((layer) => layer.key)
    api(`/api/places?layers=${on.join(',')}&near=${spot.lat},${spot.lon}&km=1`).then(setFound)
  }, [spot, layers])

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
              {found?.map((place) => (
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
            {spot && !found && <p className="p-4 text-stone-600">Finding places near you...</p>}
            {found && (
              <>
                <div className="panel-head">
                  <h2>
                    {found.length} {found.length === 1 ? 'place' : 'places'} within 1 km
                  </h2>
                  <span className="text-sm text-stone-500">Walking time</span>
                </div>
                <ol className="divide-y divide-stone-200">
                  {found.slice(0, SHOWN).map((place) => {
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
                {found.length > SHOWN && (
                  <p className="border-t border-stone-200 px-4 py-2.5 text-sm text-stone-500">
                    Showing the nearest {SHOWN} of {found.length}.
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
