import { CircleMarker, Tooltip } from 'react-leaflet'

function WardLabels({ outlines, suggested }) {
  return outlines.features.map((feature) => {
    const code = feature.properties.code
    return (
      <CircleMarker key={`${code}-${suggested.includes(code)}`} center={feature.properties.middle} radius={0} interactive={false}>
        <Tooltip permanent direction="center" className={`ward-label ${suggested.includes(code) ? 'is-suggested' : ''}`}>
          {code}
        </Tooltip>
      </CircleMarker>
    )
  })
}

export default WardLabels
