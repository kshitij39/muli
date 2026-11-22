import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import MapView from '../components/MapView.jsx'
import PageTop from '../components/PageTop.jsx'
import WardShades from '../components/WardShades.jsx'
import { loadOutlines } from '../outlines.js'
import { BANDS, CATEGORIES, EVENT_CATEGORIES, numberText, roughly, usualText } from '../places.js'

function Swatch({ color, small }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-sm border border-stone-300 ${small ? 'h-3 w-4' : 'mt-0.5 h-3.5 w-6'}`}
      style={{ background: color }}
    />
  )
}

function Details({ ward, category, onClose }) {
  const n = ward.counts
  const rows = [
    ['Health posts and UPHCs', n.uphc],
    ['Dispensaries', n.dispensary],
    ['Maternity homes and hospitals', (n.maternity || 0) + (n.hospital || 0)],
    ['Schools (municipal, aided, unaided)', (n.municipal || 0) + (n.aided || 0) + (n.unaided || 0)],
    ['Public toilets', n.toilet],
    ['Toilet seats', ward.toilet_seats],
    ['Parks and maidans', n.park],
  ]
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>{ward.code} ward</h2>
        <span className="flex items-center gap-2">
          {ward.numbers[category].suggested && <span className="tag tag-suggested">Suggested</span>}
          <button type="button" className="linklike text-sm" onClick={onClose}>
            Back to suggested wards
          </button>
        </span>
      </div>
      <div className="p-4">
        <p className="text-stone-600">
          {ward.areas}. About {roughly(ward.population)} people.
        </p>
        <ul className="mt-3 grid gap-2">
          {EVENT_CATEGORIES.map((key) => {
            const number = ward.numbers[key]
            return (
              <li key={key} className={`flex gap-2 ${key === category ? '' : 'text-stone-500'}`}>
                <span className="mark mt-1.5" style={{ background: CATEGORIES[key].color }} />
                <span>
                  <b className="font-semibold">
                    {CATEGORIES[key].name}: {BANDS[number.band].toLowerCase()}.
                  </b>{' '}
                  {numberText(key, number.people_per)}. <span className="text-sm">{usualText(number.usual)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <table className="w-full border-t border-stone-200 text-sm">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="px-4 py-1">{label}</td>
              <td className="px-4 py-1 text-right tabular-nums">{(value || 0).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-stone-200 px-4 py-2.5 text-xs text-stone-500">
        Places from BMC's map layers. People from BMC's ward population, mid-year 2023. These count places, not how good or
        busy they are.
      </p>
    </section>
  )
}

function WardMap() {
  const [category, setCategory] = useState('health')
  const [data, setData] = useState(null)
  const [outlines, setOutlines] = useState(null)
  const [chosen, setChosen] = useState(null)

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

  function pick(code) {
    setChosen(null)
    api(`/api/wards/${code}`).then(setChosen)
  }

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
              {outlines && ready && <WardShades outlines={outlines} data={data} chosen={chosen?.code} onPick={pick} />}
            </MapView>
          </div>

          <div className="grid content-start gap-6 lg:col-span-2">
            {!ready && <p className="text-stone-600">Counting {c.counting} in each ward...</p>}
            {ready && chosen && <Details ward={chosen} category={category} onClose={() => setChosen(null)} />}
            {ready && !chosen && (
              <>
                <section className="panel">
                  <div className="panel-head">
                    <h2>Suggested for {c.name.toLowerCase()} events</h2>
                    <span className="tag tag-suggested">Suggested</span>
                  </div>
                  <ul className="divide-y divide-stone-200">
                    {data.suggested.map((code) => (
                      <li key={code} className="px-4 py-3">
                        <button type="button" className="linklike font-semibold" onClick={() => pick(code)}>
                          {code} ward ({byCode[code].areas})
                        </button>
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
                  <p className="mt-3 text-xs text-stone-500">Each colour covers 8 of the 24 wards. Click a ward to see its numbers.</p>
                </section>
              </>
            )}
          </div>
        </div>

        {ready && (
          <section className="panel mt-6">
            <div className="panel-head">
              <h2>All 24 wards</h2>
              <span className="text-sm text-stone-500">In alphabetical order</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 text-left text-stone-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Ward</th>
                    <th className="hidden px-4 py-2 font-medium sm:table-cell">Main areas</th>
                    <th className="px-4 py-2 text-right font-medium">People</th>
                    <th className="px-4 py-2 text-right font-medium">People per {c.per}</th>
                    <th className="px-4 py-2 font-medium">Compared with other wards</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {data.wards.map((ward) => (
                    <tr key={ward.code} className={ward.code === chosen?.code ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-2">
                        <button type="button" className="linklike font-medium" onClick={() => pick(ward.code)}>
                          {ward.code}
                        </button>
                      </td>
                      <td className="hidden px-4 py-2 text-stone-600 sm:table-cell">{ward.areas}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{roughly(ward.population)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{roughly(ward.people_per)}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center gap-2">
                          <Swatch color={c.shades[ward.band]} small />
                          {BANDS[ward.band]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

export default WardMap
