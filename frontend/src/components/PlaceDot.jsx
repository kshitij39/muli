import { CircleMarker } from 'react-leaflet'
import { CATEGORIES } from '../places.js'
import PlacePopup from './PlacePopup.jsx'

function PlaceDot({ place, layer, km, onMarker, children }) {
  const color = CATEGORIES[layer.category].color
  const rough = place.rough === 1
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
      <PlacePopup place={place} layer={layer} km={km}>
        {children}
      </PlacePopup>
    </CircleMarker>
  )
}

export default PlaceDot
