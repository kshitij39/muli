import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import { api } from '../api.js'
import MapView from '../components/MapView.jsx'
import PageTop from '../components/PageTop.jsx'
import WardLabels from '../components/WardLabels.jsx'
import { loadOutlines } from '../outlines.js'
import { BANDS, CATEGORIES, EVENT_CATEGORIES, numberText, usualText } from '../places.js'

function Swatch({ color, small }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-sm border border-stone-300 ${small ? 'h-3 w-4' : 'mt-0.5 h-3.5 w-6'}`}
      style={{ background: color }}
    />
  )
}

function WardMap() {
  const [category, setCategory] = useState('health')
  const [data, setData] = useState(null)
  const [outlines, setOutlines] = useState(null)

  useEffect(() => {
    loadOutlines('wards').then(setOutlines)
  }, [])

  useEffect(() => {
    api(`/api/wards?category=${category}`).then(setData)
  }, [category])

  const bounds = useMemo(() => (outlines ? L.geoJSON(outlines).getBounds() : null), [outlines])
  const ready = data?.category === category
  const c = CATEGORIES[category]
  const byCode = ready ? Object.fromEntries(data.wards.map((ward) => [ward.code, ward])) : {}

  return (
    <>
      <PageTop
        title="Ward map"
        text="How many people each health post or dispensary, public toilet and school has to serve, in each of BMC's 24 wards."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-3 divide-x divide-stone-300 overflow-hidden rounded border border-stone-300 sm:inline-grid">
          {EVENT_CATEGORIES.map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === category}
              onClick={() => setCategory(key)}
              className={`inline-flex min-w-0 items-center justify-center gap-2 px-2 py-2 text-sm font-medium sm:px-4 ${
                key === category ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
              }`}
            >
              <span className="mark" style={{ background: CATEGORIES[key].color }} />
              {CATEGORIES[key].name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <MapView bounds={bounds} showWards={false} className="h-96 sm:h-[30rem] lg:sticky lg:top-4 lg:h-[38rem]">
              {outlines && ready && (
                <GeoJSON
                  key={category}
                  data={outlines}
                  style={(feature) => ({
                    color: '#57534e',
                    weight: 1,
                    fillColor: c.shades[byCode[feature.properties.code].band],
                    fillOpacity: 0.65,
                  })}
                />
              )}
              {outlines && ready && <WardLabels outlines={outlines} suggested={data.suggested} />}
            </MapView>
          </div>

          <div className="grid content-start gap-6 lg:col-span-2">
            {!ready && <p className="text-stone-600">Counting {c.counting} in each ward...</p>}
            {ready && (
              <>
                <section className="panel">
                  <div className="panel-head">
                    <h2>Suggested for {c.name.toLowerCase()} events</h2>
                    <span className="tag tag-suggested">Suggested</span>
                  </div>
                  <ul className="divide-y divide-stone-200">
                    {data.suggested.map((code) => (
                      <li key={code} className="px-4 py-3">
                        <div className="font-semibold">
                          {code} ward ({byCode[code].areas})
                        </div>
                        <p className="text-sm text-stone-600">{numberText(category, byCode[code].people_per)}.</p>
                      </li>
                    ))}
                  </ul>
                  <p className="border-t border-stone-200 px-4 py-2.5 text-sm text-stone-500">
                    The 3 wards where each {c.per} has to serve the most people. {usualText(data.usual)}
                  </p>
                </section>
                <section className="panel p-4 text-sm">
                  <h2 className="mb-2 font-semibold">What the colours mean</h2>
                  <ul className="grid gap-2">
                    {BANDS.map((name, band) => (
                      <li key={name} className="flex items-start gap-3">
                        <Swatch color={c.shades[band]} />
                        <span>
                          <b className="font-semibold">{name}</b>
                          <span className="block text-stone-600">
                            {[`Many people for each ${c.per}`, 'Somewhere in between', `Fewer people for each ${c.per}`][band]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-stone-500">Each colour covers 8 of the 24 wards.</p>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default WardMap
