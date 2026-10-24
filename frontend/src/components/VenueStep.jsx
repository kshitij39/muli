import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { GeoJSON, Marker } from 'react-leaflet'
import { api } from '../api.js'
import { CATEGORIES, placeDetails } from '../places.js'
import { dropPin, suggestedPin } from '../pins.js'
import MapView from './MapView.jsx'
import PlaceDot from './PlaceDot.jsx'
import PlacePopup from './PlacePopup.jsx'

const LISTED = 12
const FIRST = {
  health: 'health posts, dispensaries, maternity homes and hospitals',
  sanitation: 'parks and schools',
  education: 'schools',
}

function VenueStep({ category, ward, outlines, venue, onChoose }) {
  const [data, setData] = useState(null)
  const [layers, setLayers] = useState(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    api('/api/layers').then((list) => setLayers(Object.fromEntries(list.map((layer) => [layer.key, layer]))))
  }, [])

  useEffect(() => {
    api(`/api/venues?ward=${ward}&category=${category}`).then(setData)
  }, [ward, category])

  const wardShape = useMemo(
    () => outlines.features.find((feature) => feature.properties.code === ward),
    [outlines, ward],
  )
  const bounds = useMemo(() => L.geoJSON(wardShape).getBounds(), [wardShape])

  if (!data || !layers) return <p className="text-stone-600">Finding venues in {ward} ward...</p>

  const suggested = data.venues.filter((place) => data.suggested.includes(place.id))
  const others = data.venues.filter((place) => !data.suggested.includes(place.id))

  function row(place, note) {
    const layer = layers[place.layer]
    const details = placeDetails(place)
    const picked = venue?.id === place.id
    return (
      <li key={place.id} className={`flex items-start gap-3 px-4 py-2.5 ${picked ? 'bg-amber-50' : ''}`}>
        <span className="mark mt-1.5" style={{ background: CATEGORIES[layer.category].color }} />
        <div className="min-w-0 flex-1">
          <div className="leading-snug font-semibold">{place.name}</div>
          <div className="text-sm text-stone-600">
            {layer.one}
            {details && `, ${details}`}
          </div>
          {place.address && <div className="text-xs text-stone-500">{place.address}</div>}
          {place.rough === 1 && <div className="text-xs text-amber-800">Approximate location</div>}
          {note}
        </div>
        <button type="button" className="btn btn-sm shrink-0" onClick={() => onChoose(place)}>
          {picked ? 'Chosen' : 'Choose'}
        </button>
      </li>
    )
  }

  const chooseButton = (place) => (
    <button type="button" className="btn btn-sm mt-2" onClick={() => onChoose(place)}>
      Choose this venue
    </button>
  )

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>
          3. Choose a venue in {ward} ward
        </h2>
        <span className="text-sm text-stone-500">{data.venues.length} possible venues</span>
      </div>
      <div className="grid lg:grid-cols-5">
        <div className="border-b border-stone-200 lg:order-2 lg:col-span-3 lg:border-b-0 lg:border-l">
          <MapView bounds={bounds} className="h-80 rounded-none border-0 sm:h-96 lg:sticky lg:top-0 lg:h-[34rem]">
            <GeoJSON data={wardShape} interactive={false} style={{ color: '#1c1917', weight: 2.5, opacity: 0.9, fill: false }} />
            {data.venues.map((place) => {
              if (venue?.id === place.id) {
                return (
                  <Marker key={place.id} position={[place.lat, place.lon]} icon={dropPin} zIndexOffset={600}>
                    <PlacePopup place={place} layer={layers[place.layer]} />
                  </Marker>
                )
              }
              if (data.suggested.includes(place.id)) {
                return (
                  <Marker key={place.id} position={[place.lat, place.lon]} icon={suggestedPin} zIndexOffset={500}>
                    <PlacePopup place={place} layer={layers[place.layer]}>
                      {chooseButton(place)}
                    </PlacePopup>
                  </Marker>
                )
              }
              return (
                <PlaceDot key={place.id} place={place} layer={layers[place.layer]}>
                  {chooseButton(place)}
                </PlaceDot>
              )
            })}
          </MapView>
        </div>
        <div className="lg:order-1 lg:col-span-2">
          <div className="border-b border-stone-200 px-4 py-2.5">
            <span className="tag tag-suggested">Suggested</span>
          </div>
          {suggested.length ? (
            <ul className="divide-y divide-stone-200">
              {suggested.map((place) =>
                row(place, <div className="mt-0.5 text-xs text-stone-500">One of 3 places spread across the ward.</div>),
              )}
            </ul>
          ) : (
            <p className="px-4 py-3 text-stone-600">No place in this ward suits this event.</p>
          )}
          {others.length > 0 && (
            <details className="border-t border-stone-200">
              <summary className="cursor-pointer px-4 py-2.5 font-semibold">
                Other options <span className="font-normal text-stone-500">({others.length})</span>
              </summary>
              <ul className="divide-y divide-stone-200 border-t border-stone-200">
                {(showAll ? others : others.slice(0, LISTED)).map((place) => row(place))}
              </ul>
              {!showAll && others.length > LISTED && (
                <div className="border-t border-stone-200 px-4 py-2">
                  <button type="button" className="linklike text-sm" onClick={() => setShowAll(true)}>
                    Show all {others.length}
                  </button>
                </div>
              )}
            </details>
          )}
        </div>
      </div>
      <p className="border-t border-stone-200 px-4 py-2.5 text-sm text-stone-500">
        Other options start with {FIRST[category]}. Hollow dots are places BMC's map gives only roughly.
      </p>
    </section>
  )
}

export default VenueStep
