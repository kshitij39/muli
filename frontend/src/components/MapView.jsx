import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'
import { GeoJSON, MapContainer, Pane, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { api } from '../api.js'

const outlines = {}

function loadOutlines(name) {
  outlines[name] ??= api(`/api/outlines/${name}`)
  return outlines[name]
}

function Fit({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [12, 12], maxZoom: 16, animate: false })
  }, [map, bounds])
  return null
}

function Events({ onClick, onMove }) {
  useMapEvents({
    click: (event) => onClick?.({ lat: event.latlng.lat, lon: event.latlng.lng }),
    moveend: (event) => onMove?.(event.target),
  })
  return null
}

function MapView({ ref, bounds, onClick, onMove, showWards = true, showSlums = false, className = 'h-96', children }) {
  const [wards, setWards] = useState(null)
  const [slums, setSlums] = useState(null)

  useEffect(() => {
    loadOutlines('wards').then(setWards)
  }, [])

  useEffect(() => {
    if (showSlums) loadOutlines('slums').then(setSlums)
  }, [showSlums])

  return (
    <MapContainer
      ref={ref}
      center={[19.07, 72.88]}
      zoom={11}
      scrollWheelZoom={false}
      preferCanvas
      className={`panel ${className}`}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Pane name="areas" style={{ zIndex: 350 }}>
        {showSlums && slums && (
          <GeoJSON data={slums} interactive={false} style={{ stroke: false, fillColor: '#a8a29e', fillOpacity: 0.28 }} />
        )}
        {showWards && wards && (
          <GeoJSON data={wards} interactive={false} style={{ color: '#44403c', weight: 1.2, opacity: 0.7, fill: false }} />
        )}
      </Pane>
      <Fit bounds={bounds} />
      <Events onClick={onClick} onMove={onMove} />
      {children}
    </MapContainer>
  )
}

export default MapView
