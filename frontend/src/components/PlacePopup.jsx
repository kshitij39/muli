import { Popup } from 'react-leaflet'
import { directionsLink, distanceText, placeDetails, walkTime } from '../places.js'

function PlacePopup({ place, layer, km, children }) {
  const details = placeDetails(place)
  return (
    <Popup>
      <div className="text-sm">
        <div className="font-semibold">{place.name}</div>
        <div className="text-stone-500">
          {layer.one}
          {place.ward && `, ${place.ward} ward`}
        </div>
        {details && <div>{details}</div>}
        {place.address && <div className="text-stone-600">{place.address}</div>}
        {place.rough === 1 && <div className="text-amber-800">Approximate location: BMC's map gives it only roughly.</div>}
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
  )
}

export default PlacePopup
