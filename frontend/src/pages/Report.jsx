import L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Marker } from 'react-leaflet'
import { api } from '../api.js'
import MapView from '../components/MapView.jsx'
import PageTop from '../components/PageTop.jsx'
import { findMe, locationPermission, savedSpot } from '../location.js'
import { dropPin } from '../pins.js'
import { CATEGORIES, EVENT_CATEGORIES } from '../places.js'

function Report() {
  const [spot, setSpot] = useState(savedSpot)
  const [where, setWhere] = useState(() =>
    savedSpot()
      ? 'The spot starts where you were on Near me. Drag the pin if the problem is somewhere else.'
      : 'Click the map to place the spot, or use your location. You can drag the pin to move it.',
  )
  const [finding, setFinding] = useState(false)
  const [category, setCategory] = useState('')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(null)
  const stopFinding = useRef(() => {})
  const [startSpot] = useState(savedSpot)

  useEffect(() => {
    if (!savedSpot()) {
      locationPermission().then((answer) => {
        if (answer === 'granted') startFinding()
      })
    }
    return () => stopFinding.current()
  }, [])

  const bounds = useMemo(() => (startSpot ? L.latLng(startSpot.lat, startSpot.lon).toBounds(500) : null), [startSpot])

  function place(newSpot, message) {
    stopFinding.current()
    setFinding(false)
    setSpot({ lat: newSpot.lat, lon: newSpot.lon })
    setWhere(message)
  }

  function startFinding() {
    stopFinding.current()
    setFinding(true)
    setWhere('Finding where you are. On a laptop this can take up to half a minute.')
    stopFinding.current = findMe(
      (found) => {
        setFinding(false)
        setSpot({ lat: found.lat, lon: found.lon })
        setWhere("The spot is where your browser placed you. Drag the pin if that's not quite right.")
      },
      (problem) => {
        setFinding(false)
        setWhere(`${problem} Click the map to place the spot instead.`)
      },
    )
  }

  async function send(event) {
    event.preventDefault()
    setError('')
    if (!spot) return setError('Place the spot on the map.')
    if (!category) return setError('Choose a category.')
    if (text.trim().length < 10) return setError("Say what's wrong in a few words.")
    if (photo && photo.size > 5 * 1024 * 1024) return setError('That photo is over 5 MB. Choose a smaller one.')
    const form = new FormData()
    form.append('category', category)
    form.append('what_wrong', text.trim())
    form.append('lat', spot.lat)
    form.append('lon', spot.lon)
    if (photo) form.append('photo', photo)
    try {
      setSent(await api('/api/reports', { method: 'POST', body: form }))
      stopFinding.current()
    } catch (problem) {
      setError(problem.message)
    }
  }

  if (sent) {
    return (
      <>
        <PageTop title="Report sent" />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="panel max-w-3xl p-5">
            <p>
              Your {CATEGORIES[sent.category].name.toLowerCase()} report {sent.ward ? `in ${sent.ward} ward` : "outside BMC's wards"}{' '}
              will be checked by an NGO. You can follow it on your profile.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/profile" className="btn btn-primary">
                Go to my profile
              </Link>
              <button type="button" className="btn" onClick={() => window.location.reload()}>
                Report another problem
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageTop
        title="Report a problem"
        text="Anywhere in the city. An NGO checks every report before acting on it, and won't see your name."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <form className="panel max-w-3xl" onSubmit={send} noValidate>
          <div className="border-b border-stone-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Where</h2>
              <button type="button" className="btn btn-sm" onClick={startFinding} disabled={finding}>
                Use my location
              </button>
            </div>
            <p className="mt-1 text-sm text-stone-600" role="status">
              {where}
            </p>
            <MapView
              bounds={bounds}
              onClick={(clicked) => place(clicked, 'Spot placed. Drag the pin to move it.')}
              className="mt-3 h-72 sm:h-80"
            >
              {spot && (
                <Marker
                  position={[spot.lat, spot.lon]}
                  icon={dropPin}
                  draggable
                  title="The spot"
                  eventHandlers={{
                    dragend: (event) => {
                      const at = event.target.getLatLng()
                      place({ lat: at.lat, lon: at.lng }, 'Spot moved.')
                    },
                  }}
                />
              )}
            </MapView>
          </div>
          <fieldset className="border-b border-stone-200 p-5">
            <legend className="sr-only">Category</legend>
            <h2 className="font-semibold">Category</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {EVENT_CATEGORIES.map((key) => (
                <label key={key} className="option">
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={category === key}
                    onChange={() => {
                      setCategory(key)
                      setError('')
                    }}
                  />
                  <span className="flex items-center gap-2">
                    <span className="mark" style={{ background: CATEGORIES[key].color }} />
                    {CATEGORIES[key].name}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 border-b border-stone-200 p-5">
            <div>
              <label htmlFor="text" className="label">
                What's wrong <span className="hint">up to 300 characters</span>
              </label>
              <textarea
                id="text"
                rows="3"
                maxLength={300}
                className="input w-full"
                placeholder="What did you see, and when?"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="photo" className="label">
                Photo <span className="hint">optional</span>
              </label>
              <input
                id="photo"
                type="file"
                accept="image/jpeg,image/png"
                className="w-full text-sm"
                onChange={(event) => setPhoto(event.target.files[0] || null)}
              />
              <p className="hint mt-1">One JPEG or PNG under 5 MB. Only NGOs see it, and we remove the location saved in the photo.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 bg-stone-50 px-5 py-3">
            <p className="mr-auto text-sm font-medium text-rose-700" role="alert">
              {error}
            </p>
            <button type="submit" className="btn btn-primary">
              Send report
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default Report
