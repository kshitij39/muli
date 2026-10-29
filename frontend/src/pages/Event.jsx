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

function Event() {
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
              <Fact label="Places">{event.places}</Fact>
              <Fact label="Volunteers">{event.volunteers} needed</Fact>
            </dl>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>About</h2>
            </div>
            <p className="p-4">{event.about}</p>
          </section>
        </div>
      </div>
    </>
  )
}

export default Event
