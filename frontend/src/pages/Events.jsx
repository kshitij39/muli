import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api } from '../api.js'
import CategoryTag from '../components/CategoryTag.jsx'
import LoadingPanel from '../components/LoadingPanel.jsx'
import PageTop from '../components/PageTop.jsx'
import { dayText, timeText } from '../dates.js'
import { CATEGORIES, EVENT_CATEGORIES } from '../places.js'

function Events({ me }) {
  const [category, setCategory] = useState('')
  const [mine, setMine] = useState(false)
  const [events, setEvents] = useState(null)
  const ngo = me.mode === 'ngo'

  useEffect(() => {
    api(`/api/events?category=${category}${mine ? '&mine=1' : ''}`).then(setEvents)
  }, [category, mine])

  return (
    <>
      <PageTop
        title="Events"
        text={
          ngo
            ? 'Health, sanitation and education events that NGOs have planned across Mumbai.'
            : "Health, sanitation and education events that NGOs have planned across Mumbai. Open one to say you'll attend or volunteer."
        }
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="panel">
          <div className="panel-head">
            <h2>
              {events ? `${events.length} upcoming ${events.length === 1 ? 'event' : 'events'}` : 'Upcoming events'}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              {ngo && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-stone-900" checked={mine} onChange={(e) => setMine(e.target.checked)} />
                  Only my NGO's events
                </label>
              )}
              <label htmlFor="show" className="sr-only">
                Category
              </label>
              <select id="show" className="input h-9 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {EVENT_CATEGORIES.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORIES[key].name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!events && <LoadingPanel title="Loading events" className="rounded-none border-0" />}
          {events?.length === 0 && <p className="px-4 py-3 text-stone-600">Nothing like that planned yet.</p>}
          {events?.length > 0 && (
            <ul className="divide-y divide-stone-200">
              {events.map((event) => (
                <li key={event.id} className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[6.5rem_1fr_9.5rem]">
                  <div>
                    <div className="font-semibold">{dayText(event.starts_at)}</div>
                    <div className="text-sm text-stone-500">{timeText(event.starts_at)}</div>
                  </div>
                  <div className="min-w-0">
                    <div className="mb-1">
                      <CategoryTag category={event.category} />
                    </div>
                    <Link to={`/events/${event.id}`} className="font-semibold">
                      {event.title}
                    </Link>
                    <div className="text-sm text-stone-600">
                      {event.organisation}. {event.venue.name}, {event.ward} ward.
                    </div>
                  </div>
                  <div className="col-start-2 text-sm sm:col-start-auto sm:text-right">
                    <div>{event.places > event.attending ? `${event.places - event.attending} places left` : 'Full'}</div>
                    <div className="text-stone-500">
                      {event.volunteers > event.volunteering
                        ? `${event.volunteers - event.volunteering} volunteers needed`
                        : 'Enough volunteers'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

export default Events
