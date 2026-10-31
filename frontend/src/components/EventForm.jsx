import { useState } from 'react'
import { useNavigate } from 'react-router'
import { api } from '../api.js'

const DAY = 24 * 60 * 60 * 1000

function dateValue(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function EventForm({ category, kind, venue }) {
  const navigate = useNavigate()
  const custom = kind.key === 'custom'
  const [form, setForm] = useState(() => ({
    title: custom ? '' : `${kind.name} at ${venue.name}`,
    date: dateValue(Date.now() + 14 * DAY),
    time: kind.start,
    hours: kind.hours,
    places: kind.places,
    volunteers: kind.volunteers,
    about: kind.about,
  }))
  const [tomorrow] = useState(() => dateValue(Date.now() + DAY))
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function publish(event) {
    event.preventDefault()
    if (form.title.trim().length < 5) return setError('The title needs at least 5 characters.')
    if (form.about.trim().length < 10) return setError(custom ? 'Write a short description of the event.' : 'Say what will happen at the event.')
    if (!(new Date(`${form.date}T${form.time}`).getTime() > Date.now())) return setError('Choose a date and time in the future.')
    setSending(true)
    try {
      const saved = await api('/api/events', {
        method: 'POST',
        body: {
          category,
          kind: kind.key,
          place_id: venue.id,
          title: form.title,
          about: form.about,
          starts_at: `${form.date}T${form.time}`,
          hours: Number(form.hours),
          places: Number(form.places),
          volunteers: Number(form.volunteers),
        },
      })
      navigate(`/events/${saved.id}`)
    } catch (problem) {
      setError(problem.message)
      setSending(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>4. Event details</h2>
        <span className="text-sm text-stone-500">
          {kind.name} at {venue.name}, {venue.ward} ward
        </span>
      </div>
      <form className="grid gap-4 p-5 sm:grid-cols-6" onSubmit={publish} noValidate>
        <div className="sm:col-span-6">
          <label htmlFor="title" className="label">
            Title
          </label>
          <input
            id="title"
            name="title"
            className="input w-full"
            maxLength={120}
            value={form.title}
            onChange={change}
            placeholder={custom ? 'For example, Free eye check-up and reading glasses' : undefined}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="date" className="label">
            Date
          </label>
          <input id="date" name="date" type="date" className="input w-full" min={tomorrow} value={form.date} onChange={change} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="time" className="label">
            Starts at
          </label>
          <input id="time" name="time" type="time" className="input w-full" value={form.time} onChange={change} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="hours" className="label">
            How long
          </label>
          <select id="hours" name="hours" className="input w-full" value={form.hours} onChange={change}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
              <option key={h} value={h}>
                {h} hour{h > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="places" className="label">
            Places for people attending
          </label>
          <input id="places" name="places" type="number" min="1" max="500" className="input w-full" value={form.places} onChange={change} />
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="volunteers" className="label">
            Volunteers needed
          </label>
          <input
            id="volunteers"
            name="volunteers"
            type="number"
            min="0"
            max="50"
            className="input w-full"
            value={form.volunteers}
            onChange={change}
          />
        </div>
        <div className="sm:col-span-6">
          <label htmlFor="about" className="label">
            {custom ? 'Description' : 'About'} <span className="hint">what will happen, and who it's for</span>
          </label>
          <textarea id="about" name="about" rows="3" maxLength={600} className="input w-full" value={form.about} onChange={change} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 pt-4 sm:col-span-6">
          <p className="mr-auto text-sm font-medium text-rose-700" role="alert">
            {error}
          </p>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            Publish event
          </button>
        </div>
      </form>
    </section>
  )
}

export default EventForm
