import { useState } from 'react'
import PageTop from '../components/PageTop.jsx'
import { CUSTOM, EVENT_KINDS } from '../kinds.js'
import { CATEGORIES, EVENT_CATEGORIES } from '../places.js'

const BLURB = {
  health: 'Check-up camps and vaccination awareness',
  sanitation: 'Cleanliness drives and hygiene awareness',
  education: 'Enrolment drives and learning camps',
}

function Plan() {
  const [category, setCategory] = useState(null)
  const [kind, setKind] = useState(null)

  function chooseCategory(key) {
    setCategory(key)
    setKind(null)
  }

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
      </div>
    </>
  )
}

export default Plan
