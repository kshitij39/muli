import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { api } from '../api.js'
import CategoryTag from '../components/CategoryTag.jsx'
import LoadingPanel from '../components/LoadingPanel.jsx'
import PageTop from '../components/PageTop.jsx'
import { agoText, dayText, timeText } from '../dates.js'
import { MODES } from '../modes.js'

const STATUS = {
  waiting: <span className="tag tag-warn">Waiting</span>,
  accepted: <span className="tag tag-good">Accepted</span>,
  rejected: <span className="tag tag-plain">Not accepted</span>,
}

function CivicActivity({ activity, onCancel }) {
  return (
    <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2">
      <section className="panel">
        <div className="panel-head">
          <h2>Events you've signed up for</h2>
          <Link to="/events" className="text-sm">
            All events
          </Link>
        </div>
        {activity.signups.length ? (
          <ul className="divide-y divide-stone-200">
            {activity.signups.map((event) => (
              <li key={event.id} className="grid grid-cols-[5.5rem_1fr_auto] gap-x-4 px-4 py-3">
                <div>
                  <div className="font-semibold">{dayText(event.starts_at)}</div>
                  <div className="text-sm text-stone-500">{timeText(event.starts_at)}</div>
                </div>
                <div className="min-w-0">
                  <Link to={`/events/${event.id}`} className="font-semibold">
                    {event.title}
                  </Link>
                  <div className="text-sm text-stone-600">{event.my_signup === 'attend' ? 'Attending' : 'Volunteering'}</div>
                </div>
                <button type="button" className="linklike self-start text-sm" onClick={() => onCancel(event.id)}>
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-stone-600">None yet.</p>
        )}
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Your reports</h2>
          <Link to="/report" className="text-sm">
            Report a problem
          </Link>
        </div>
        {activity.reports.length ? (
          <ul className="divide-y divide-stone-200">
            {activity.reports.map((report) => (
              <li key={report.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryTag category={report.category} />
                    <span className="text-sm text-stone-600">
                      {report.ward ? `${report.ward} ward` : "Outside BMC's wards"}. Sent {agoText(`${report.created_at}Z`)}.
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{report.what_wrong}</p>
                </div>
                {STATUS[report.status]}
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-stone-600">You haven't reported anything.</p>
        )}
      </section>
    </div>
  )
}

function NgoActivity({ activity }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <section className="panel">
        <div className="panel-head">
          <h2>Your upcoming events</h2>
          <Link to="/plan" className="btn btn-primary btn-sm">
            Plan an event
          </Link>
        </div>
        {activity.events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-left text-stone-500">
                <tr>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">Date</th>
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 text-right font-medium">Coming</th>
                  <th className="px-4 py-2 text-right font-medium">Helping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {activity.events.map((event) => (
                  <tr key={event.id}>
                    <td className="hidden px-4 py-3 align-top whitespace-nowrap sm:table-cell">
                      {dayText(event.starts_at)}
                      <div className="text-stone-500">{timeText(event.starts_at)}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="mb-1">
                        <CategoryTag category={event.category} />
                      </div>
                      <Link to={`/events/${event.id}`} className="font-semibold">
                        {event.title}
                      </Link>
                      <div className="text-stone-500">
                        {event.ward} ward
                        <span className="sm:hidden">
                          , {dayText(event.starts_at)}, {timeText(event.starts_at)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top tabular-nums">
                      {event.attending} / {event.places}
                    </td>
                    <td className="px-4 py-3 text-right align-top tabular-nums">
                      {event.volunteering} / {event.volunteers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-stone-600">Nothing planned yet.</p>
        )}
      </section>
    </div>
  )
}

function Profile({ me, setMe }) {
  const navigate = useNavigate()
  const [activity, setActivity] = useState(null)

  useEffect(() => {
    if (me) api('/api/me/activity').then(setActivity)
  }, [me])

  if (!me) return <Navigate to="/" replace />

  async function signOut() {
    await api('/api/session', { method: 'DELETE' })
    setMe(null)
    navigate('/')
  }

  async function cancel(id) {
    await api(`/api/events/${id}/signup`, { method: 'DELETE' })
    setActivity(await api('/api/me/activity'))
  }

  const about =
    me.mode === 'ngo'
      ? `NGO account, run by ${me.name}. Username: ${me.username}.`
      : `${MODES[me.mode]} account. Username: ${me.username}.`

  return (
    <>
      <PageTop title={me.mode === 'ngo' ? me.ngo_name : me.name} text={about}>
        <button type="button" className="btn" onClick={signOut}>
          Sign out
        </button>
      </PageTop>
      {!activity && (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <LoadingPanel title={me.mode === 'ngo' ? "Loading your NGO's events" : 'Loading your events and reports'} />
        </div>
      )}
      {activity && me.mode === 'civic' && <CivicActivity activity={activity} onCancel={cancel} />}
      {activity && me.mode === 'ngo' && <NgoActivity activity={activity} />}
    </>
  )
}

export default Profile
