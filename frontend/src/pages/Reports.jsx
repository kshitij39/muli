import L from 'leaflet'
import { useEffect, useState } from 'react'
import { Marker } from 'react-leaflet'
import { api } from '../api.js'
import CategoryTag from '../components/CategoryTag.jsx'
import MapView from '../components/MapView.jsx'
import PageTop from '../components/PageTop.jsx'
import { agoText } from '../dates.js'
import { loadOutlines } from '../outlines.js'
import { numberPin } from '../pins.js'
import { CATEGORIES, EVENT_CATEGORIES } from '../places.js'

const REASONS = {
  elsewhere: 'Not at this spot',
  photo: "The photo doesn't show it",
  fixed: 'Already fixed',
  other: 'Another reason',
}

function boundsOf(list) {
  return list.length ? L.latLngBounds(list.map((report) => [report.lat, report.lon])) : null
}

function inTab(report, tab) {
  return tab === 'waiting' ? report.status === 'waiting' : report.status !== 'waiting'
}

function Decide({ report, onDecided }) {
  const [reason, setReason] = useState('')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  async function decide(decision) {
    if (decision === 'reject' && !reason) return setError('Choose a reason first.')
    if (decision === 'reject' && reason === 'other' && text.trim().length < 3) return setError('Write the reason in the box.')
    try {
      await api(`/api/reports/${report.id}/decision`, { method: 'POST', body: { decision, reason, text } })
      onDecided()
    } catch (problem) {
      setError(problem.message)
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => decide('accept')}>
          Accept
        </button>
        <span className="px-1 text-sm text-stone-400">or</span>
        <label htmlFor={`why-${report.id}`} className="sr-only">
          Reason for rejecting
        </label>
        <select
          id={`why-${report.id}`}
          className="input h-8 text-sm"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value)
            setError('')
          }}
        >
          <option value="">Choose a reason</option>
          {Object.entries(REASONS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-sm" onClick={() => decide('reject')}>
          Reject
        </button>
      </div>
      {reason === 'other' && (
        <div className="mt-3 max-w-md">
          <label htmlFor={`why-text-${report.id}`} className="label">
            What's the reason?
          </label>
          <input
            id={`why-text-${report.id}`}
            className="input w-full"
            maxLength={150}
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
      )}
      <p className="mt-2 text-sm font-medium text-rose-700" role="alert">
        {error}
      </p>
    </>
  )
}

function Reports() {
  const [reports, setReports] = useState(null)
  const [tab, setTab] = useState('waiting')
  const [category, setCategory] = useState('')
  const [ward, setWard] = useState('')
  const [wards, setWards] = useState([])
  const [picked, setPicked] = useState(null)
  const [asked, setAsked] = useState(0)
  const [bounds, setBounds] = useState(null)

  useEffect(() => {
    loadOutlines('wards').then((outlines) => setWards(outlines.features.map((feature) => feature.properties.code).sort()))
  }, [])

  useEffect(() => {
    api(`/api/reports?category=${category}&ward=${encodeURIComponent(ward)}`).then((data) => {
      setReports(data)
      setBounds(boundsOf(data.filter((report) => inTab(report, tab))))
    })
  }, [category, ward, asked, tab])

  const waiting = reports?.filter((report) => inTab(report, 'waiting')) || []
  const checked = reports?.filter((report) => inTab(report, 'checked')) || []
  const shown = tab === 'waiting' ? waiting : checked

  function tabButton(key, text) {
    const look = tab === key ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'
    return (
      <button
        type="button"
        aria-pressed={tab === key}
        className={`px-4 py-2 text-sm font-medium ${look}`}
        onClick={() => {
          setTab(key)
          setPicked(null)
        }}
      >
        {text}
      </button>
    )
  }

  return (
    <>
      <PageTop
        title="Reports to check"
        text="People send these from anywhere in the city. Accept the ones that are real, so they're on record. You won't see who sent them."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex divide-x divide-stone-300 overflow-hidden rounded border border-stone-300">
            {tabButton('waiting', `Waiting (${waiting.length})`)}
            {tabButton('checked', `Checked (${checked.length})`)}
          </div>
          <label htmlFor="category" className="sr-only">
            Category
          </label>
          <select id="category" className="input w-44" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {CATEGORIES[key].name}
              </option>
            ))}
          </select>
          <label htmlFor="ward" className="sr-only">
            Ward
          </label>
          <select id="ward" className="input w-44" value={ward} onChange={(event) => setWard(event.target.value)}>
            <option value="">All wards</option>
            {wards.map((code) => (
              <option key={code} value={code}>
                {code} ward
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-5">
          <div className="lg:order-2 lg:col-span-2">
            <MapView bounds={bounds} className="h-72 lg:sticky lg:top-4 lg:h-[30rem]">
              {shown.map((report, i) => (
                <Marker
                  key={report.id}
                  position={[report.lat, report.lon]}
                  icon={numberPin(i + 1, report.id === picked)}
                  title={CATEGORIES[report.category].name}
                  eventHandlers={{ click: () => setPicked(report.id) }}
                />
              ))}
            </MapView>
          </div>
          <ul className="panel divide-y divide-stone-200 lg:order-1 lg:col-span-3">
            {!reports && <li className="p-4 text-stone-600">Loading reports...</li>}
            {reports && !shown.length && (
              <li className="p-4 text-stone-600">{tab === 'waiting' ? 'Nothing waiting to be checked.' : 'No checked reports yet.'}</li>
            )}
            {shown.map((report, i) => (
              <li key={report.id} className={`grid gap-4 p-4 sm:grid-cols-[1fr_10rem] ${report.id === picked ? 'bg-amber-50' : ''}`}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className={`num ${report.id === picked ? 'picked' : ''}`}
                      aria-label={`Show report ${i + 1} on the map`}
                      onClick={() => setPicked(report.id)}
                    >
                      {i + 1}
                    </button>
                    <CategoryTag category={report.category} />
                    {report.status === 'accepted' && <span className="tag tag-good">Accepted</span>}
                    {report.status === 'rejected' && <span className="tag tag-plain">Rejected</span>}
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {report.ward ? `${report.ward} ward` : "Outside BMC's wards"}. Sent {agoText(`${report.created_at}Z`)}.
                  </p>
                  <p className="mt-2 border-l-2 border-stone-300 pl-3 text-stone-700">{report.what_wrong}</p>
                  {report.status === 'waiting' && <Decide report={report} onDecided={() => setAsked(asked + 1)} />}
                  {report.status === 'accepted' && (
                    <p className="mt-3 text-sm text-stone-600">
                      Accepted by {report.decided_by}, {agoText(`${report.decided_at}Z`)}.
                    </p>
                  )}
                  {report.status === 'rejected' && (
                    <p className="mt-3 text-sm text-stone-600">
                      Rejected by {report.decided_by}, {agoText(`${report.decided_at}Z`)}:{' '}
                      {report.reject_reason === 'other' ? `"${report.reject_text}"` : `${REASONS[report.reject_reason].toLowerCase()}.`}
                    </p>
                  )}
                </div>
                <div className="max-w-48">
                  {report.has_photo ? (
                    <img
                      src={`/api/reports/${report.id}/photo`}
                      alt="Photo sent with the report"
                      className="aspect-[4/3] w-full rounded-sm border border-stone-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-full items-center justify-center rounded-sm border border-dashed border-stone-300 text-sm text-stone-400">
                      No photo
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}

export default Reports
