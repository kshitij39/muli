import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { api } from '../api.js'
import CategoryTag from '../components/CategoryTag.jsx'
import PageTop from '../components/PageTop.jsx'
import { longDayText, timeText } from '../dates.js'
import { kindName } from '../kinds.js'
import { directionsLink, placeDetails } from '../places.js'

function Fact({ label, children }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-3 px-4 py-3 sm:grid-cols-[8rem_1fr]">
      <dt className="text-stone-500">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function SignUp({ event, me, onChange }) {
  const [error, setError] = useState('')
  const placesLeft = event.places - event.attending
  const volunteersLeft = event.volunteers - event.volunteering

  async function send(method, role) {
    setError('')
    try {
      onChange(await api(`/api/events/${event.id}/signup`, { method, body: role ? { role } : undefined }))
    } catch (problem) {
      setError(problem.message)
    }
  }

  if (event.past) return <p>This event has already happened.</p>
  if (event.mine) {
    return <p className="text-sm text-stone-600">This is your NGO's event. The people who signed up are listed under "Who's signed up".</p>
  }
  if (me.mode !== 'civic') return <p className="text-sm text-stone-600">People sign up with a Civic account. NGOs can't sign up for events.</p>
  if (event.my_signup) {
    return (
      <>
        <p className="font-semibold text-green-800">You're signed up to {event.my_signup === 'attend' ? 'attend' : 'volunteer'}.</p>
        <button type="button" className="btn mt-3 w-full" onClick={() => send('DELETE')}>
          Cancel my place
        </button>
      </>
    )
  }
  return (
    <>
      <p className="font-semibold">Are you coming?</p>
      <div className="mt-3 grid gap-2">
        <button type="button" className="btn btn-primary" disabled={placesLeft <= 0} onClick={() => send('POST', 'attend')}>
          I'll attend
        </button>
        <button type="button" className="btn" disabled={volunteersLeft <= 0} onClick={() => send('POST', 'volunteer')}>
          I'll volunteer
        </button>
      </div>
      <p className="mt-2 text-sm font-medium text-rose-700" role="alert">
        {error}
      </p>
    </>
  )
}

function Event({ me }) {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [layers, setLayers] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api(`/api/events/${id}`).then(setEvent, (problem) => setError(problem.message))
    api('/api/layers').then((list) => setLayers(Object.fromEntries(list.map((layer) => [layer.key, layer]))))
  }, [id])

  if (error) {
    return (
      <>
        <PageTop title="Event not found" text="It may have been taken down." />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Link to="/events">See all events</Link>
        </div>
      </>
    )
  }
  if (!event || !layers) return <p className="mx-auto max-w-6xl px-4 py-6 text-stone-600 sm:px-6">Loading the event...</p>

  const venue = event.venue
  const kind = layers[venue.layer].one
  const kindLine = [kind === venue.name ? '' : kind, placeDetails(venue)].filter(Boolean).join(', ')
  const placesLeft = event.places - event.attending
  const volunteersLeft = event.volunteers - event.volunteering
  const ends = new Date(new Date(event.starts_at).getTime() + event.hours * 60 * 60 * 1000)

  return (
    <>
      <PageTop
        title={event.title}
        text={`${kindName(event)}, organised by ${event.organisation}.`}
        above={
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Link to="/events" className="text-sm">
              All events
            </Link>
            <CategoryTag category={event.category} />
          </div>
        }
      />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-3">
        <div className="grid content-start gap-6 lg:col-span-2">
          <section className="panel">
            <div className="panel-head">
              <h2>When and where</h2>
            </div>
            <dl className="divide-y divide-stone-200">
              <Fact label="When">
                {longDayText(event.starts_at)}, {timeText(event.starts_at)} to {timeText(ends)}
              </Fact>
              <Fact label="Where">
                <span className="font-semibold">{venue.name}</span>
                {kindLine && <span className="block text-sm text-stone-600">{kindLine}</span>}
                {venue.address && <span className="block text-sm text-stone-600">{venue.address}</span>}
                {venue.rough === 1 && <span className="block text-sm text-amber-800">Approximate location on BMC's map</span>}
                <a href={directionsLink(venue)} target="_blank" rel="noreferrer" className="text-sm">
                  Walking directions
                </a>
              </Fact>
              <Fact label="Ward">{event.ward} ward</Fact>
              <Fact label="Places">
                {placesLeft > 0 ? `${placesLeft} of ${event.places} left` : `Full (${event.places} places)`}
              </Fact>
              <Fact label="Volunteers">
                {volunteersLeft > 0 ? `${volunteersLeft} of ${event.volunteers} still needed` : `All ${event.volunteers} found`}
              </Fact>
            </dl>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>About</h2>
            </div>
            <p className="p-4">{event.about}</p>
          </section>
          {event.mine && (
            <section className="panel">
              <div className="panel-head">
                <h2>Who's signed up</h2>
                <span className="text-sm text-stone-500">
                  {event.attending} attending, {event.volunteering} volunteering
                </span>
              </div>
              {event.people.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-stone-50 text-left text-stone-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Coming as</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {event.people.map((person, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2">{person.name}</td>
                        <td className="px-4 py-2">{person.role === 'attend' ? 'Attending' : 'Volunteer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-stone-600">Nobody yet.</p>
              )}
              <p className="border-t border-stone-200 px-4 py-2 text-xs text-stone-500">Only your NGO can see this list.</p>
            </section>
          )}
        </div>
        <aside className="panel p-4">
          <SignUp event={event} me={me} onChange={setEvent} />
        </aside>
      </div>
    </>
  )
}

export default Event
