import { GeoJSON } from 'react-leaflet'
import { CATEGORIES } from '../places.js'
import WardLabels from './WardLabels.jsx'

function WardShades({ outlines, data, chosen, onPick }) {
  const bands = Object.fromEntries(data.wards.map((ward) => [ward.code, ward.band]))
  const shades = CATEGORIES[data.category].shades
  return (
    <>
      <GeoJSON
        key={`${data.category}-${chosen}`}
        data={outlines}
        eventHandlers={{ click: (event) => onPick(event.layer.feature.properties.code) }}
        style={(feature) => ({
          color: feature.properties.code === chosen ? '#1c1917' : '#57534e',
          weight: feature.properties.code === chosen ? 3 : 1,
          fillColor: shades[bands[feature.properties.code]],
          fillOpacity: 0.65,
        })}
      />
      <WardLabels outlines={outlines} suggested={data.suggested} />
    </>
  )
}

export default WardShades
