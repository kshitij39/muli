import L from 'leaflet'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import EventForm from '../components/EventForm.jsx'
import MapView from '../components/MapView.jsx'
import LoadingPanel from '../components/LoadingPanel.jsx'
import PageTop from '../components/PageTop.jsx'
import VenueStep from '../components/VenueStep.jsx'
import WardShades from '../components/WardShades.jsx'
import { CUSTOM, EVENT_KINDS } from '../kinds.js'
import { loadOutlines } from '../outlines.js'
import { CATEGORIES, EVENT_CATEGORIES, numberText, usualText } from '../places.js'

const BLURB = {
  health: 'Check-up camps and vaccination awareness',
  sanitation: 'Cleanliness drives and hygiene awareness',
  education: 'Enrolment drives and learning camps',
}

function Plan() {
  const [category, setCategory] = useState(null)
  const [kind, setKind] = useState(null)
  const [wards, setWards] = useState(null)
  const [ward, setWard] = useState(null)
  const [outlines, setOutlines] = useState(null)
  const [venue, setVenue] = useState(null)

  useEffect(() => {
    loadOutlines('wards').then(setOutlines)
  }, [])

  useEffect(() => {
    if (category) api(`/api/wards?category=${category}`).then(setWards)
  }, [category])

  const bounds = useMemo(() => (outlines ? L.geoJSON(outlines).getBounds() : null), [outlines])

  function chooseCategory(key) {
    setCategory(key)
    setKind(null)
    setWard(null)
    setVenue(null)
  }

  function chooseWard(code) {
    setWard(code)
    setVenue(null)
  }

  const wardsReady = kind && wards?.category === category
  const byCode = wardsReady ? Object.fromEntries(wards.wards.map((w) => [w.code, w])) : {}

  return (
    <>
      <PageTop
        title="Plan an event"
        text="Choose what kind of event, then a ward, then a venue. MULI suggests 3 wards and 3 venues; you make the choices."
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6">
        <section className="panel">
          <div className="panel-head">
            <h2>1. What kind of event?</h2>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {EVENT_CATEGORIES.map((key) => (
              <label key={key} className="option">
                <input type="radio" name="category" value={key} checked={category === key} onChange={() => chooseCategory(key)} />
                <span>
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="mark" style={{ background: CATEGORIES[key].color }} />
                    {CATEGORIES[key].name}
                  </span>
                  <span className="block text-sm text-stone-600">{BLURB[key]}</span>
                </span>
              </label>
            ))}
          </div>
          {category && (
            <div className="border-t border-stone-200 p-4">
              <p className="mb-3 text-sm font-semibold">Which {CATEGORIES[category].name.toLowerCase()} event?</p>
              <div className="grid gap-3 md:grid-cols-3">
                {[...EVENT_KINDS[category], CUSTOM].map((option) => (
                  <label key={option.key} className="option">
                    <input
                      type="radio"
                      name="kind"
                      value={option.key}
                      checked={kind?.key === option.key}
                      onChange={() => setKind(option)}
                    />
                    <span>
                      <span className="block font-semibold">{option.name}</span>
                      <span className="block text-sm text-stone-600">
                        {option.key === 'custom' ? 'Your own title and description' : option.about}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

        {kind && !wardsReady && (
          <LoadingPanel
            title={`Finding wards for ${category === 'education' ? 'an' : 'a'} ${CATEGORIES[category].name.toLowerCase()} event`}
            lines={[
              `Counting ${CATEGORIES[category].counting} in each of the 24 wards`,
              'Comparing them with how many people live in each ward (BMC, mid-year 2023)',
            ]}
          />
        )}
        {wardsReady && (
          <section className="panel">
            <div className="panel-head">
              <h2>2. Choose a ward</h2>
              <span className="text-sm text-stone-500">Darker wards have more people per {CATEGORIES[category].per}</span>
            </div>
            <div className="grid lg:grid-cols-5">
              <div className="border-b border-stone-200 lg:col-span-3 lg:border-r lg:border-b-0">
                <MapView bounds={bounds} showWards={false} className="h-80 rounded-none border-0 sm:h-96 lg:h-[30rem]">
                  {outlines && <WardShades outlines={outlines} data={wards} chosen={ward} onPick={chooseWard} />}
                </MapView>
              </div>
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between gap-3 border-b border-stone-200 px-4 py-2.5">
                  <span className="tag tag-suggested">Suggested</span>
                  <span className="text-sm text-stone-500">{usualText(wards.usual)}</span>
                </div>
                <ul className="divide-y divide-stone-200">
                  {wards.suggested.map((code) => (
                    <li key={code} className={`flex items-start justify-between gap-3 px-4 py-3 ${code === ward ? 'bg-amber-50' : ''}`}>
                      <div>
                        <div className="font-semibold">
                          {code} ward ({byCode[code].areas})
                        </div>
                        <div className="text-sm text-stone-600">{numberText(category, byCode[code].people_per)}.</div>
                      </div>
                      <button type="button" className="btn btn-sm shrink-0" onClick={() => chooseWard(code)}>
                        {code === ward ? 'Chosen' : 'Choose'}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-stone-200 px-4 py-3 text-sm">
                  {ward && !wards.suggested.includes(ward) ? (
                    <p>
                      <b className="font-semibold">
                        Chosen: {ward} ward ({byCode[ward].areas}).
                      </b>{' '}
                      {numberText(category, byCode[ward].people_per)}.
                    </p>
                  ) : (
                    <p className="text-stone-600">Or click any ward on the map.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {wardsReady && ward && outlines && (
          <VenueStep key={`${category}-${ward}`} category={category} ward={ward} outlines={outlines} venue={venue} onChoose={setVenue} />
        )}

        {wardsReady && ward && venue && <EventForm key={`${kind.key}-${venue.id}`} category={category} kind={kind} venue={venue} />}
      </div>
    </>
  )
}

export default Plan
