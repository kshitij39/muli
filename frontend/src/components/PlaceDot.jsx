import { CircleMarker, Popup } from 'react-leaflet'
import { CATEGORIES, directionsLink, distanceText, placeDetails, walkTime } from '../places.js'

function PlaceDot({ place, layer, km, onMarker, children }) {
  const color = CATEGORIES[layer.category].color
  const rough = place.rough === 1
  const details = placeDetails(place)
  return (
    <CircleMarker
      center={[place.lat, place.lon]}
      radius={4.5}
      ref={(marker) => onMarker?.(place.id, marker)}
      pathOptions={{
        color: rough ? color : '#fff',
        weight: rough ? 2 : 1,
        fillColor: rough ? '#fff' : color,
        fillOpacity: 1,
        dashArray: rough ? '2 2' : null,
      }}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-semibold">{place.name}</div>
          <div className="text-stone-500">
            {layer.one}
            {place.ward && `, ${place.ward} ward`}
          </div>
          {details && <div>{details}</div>}
          {place.address && <div className="text-stone-600">{place.address}</div>}
          {rough && <div className="text-amber-800">Approximate location: BMC's map gives it only roughly.</div>}
          {km !== undefined && (
            <div className="mt-1">
              {walkTime(km)} walk, {distanceText(km)}
            </div>
          )}
          <a href={directionsLink(place)} target="_blank" rel="noreferrer">
            Walking directions
          </a>
          {children}
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default PlaceDot
