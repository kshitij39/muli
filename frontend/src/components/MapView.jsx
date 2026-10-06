import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, Pane, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { api } from '../api.js'

let wardOutlines = null

function Fit({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [12, 12], maxZoom: 16, animate: false })
  }, [map, bounds])
  return null
}

function Clicks({ onClick }) {
  useMapEvents({
    click: (event) => onClick?.({ lat: event.latlng.lat, lon: event.latlng.lng }),
  })
  return null
}

function MapView({ bounds, onClick, className = 'h-96', children }) {
  const [wards, setWards] = useState(null)

  useEffect(() => {
    wardOutlines ??= api('/api/outlines/wards')
    wardOutlines.then(setWards)
  }, [])

  return (
    <MapContainer center={[19.07, 72.88]} zoom={11} scrollWheelZoom={false} preferCanvas className={`panel ${className}`}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Pane name="areas" style={{ zIndex: 350 }}>
        {wards && (
          <GeoJSON data={wards} interactive={false} style={{ color: '#44403c', weight: 1.2, opacity: 0.7, fill: false }} />
        )}
      </Pane>
      <Fit bounds={bounds} />
      <Clicks onClick={onClick} />
      {children}
    </MapContainer>
  )
}

export default MapView
