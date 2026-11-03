import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router'
import { api } from './api.js'
import Header from './components/Header.jsx'
import Only from './components/Only.jsx'
import Event from './pages/Event.jsx'
import Events from './pages/Events.jsx'
import Home from './pages/Home.jsx'
import NearMe from './pages/NearMe.jsx'
import Plan from './pages/Plan.jsx'
import Profile from './pages/Profile.jsx'
import Report from './pages/Report.jsx'
import Reports from './pages/Reports.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import WardMap from './pages/WardMap.jsx'

function App() {
  const [me, setMe] = useState(undefined)

  useEffect(() => {
    api('/api/me').then((data) => setMe(data.user))
  }, [])

  if (me === undefined) return null

  return (
    <>
      <Header me={me} />
      <main>
        <Routes>
          <Route path="/" element={<Home me={me} />} />
          <Route
            path="/near"
            element={
              <Only me={me} mode="civic">
                <NearMe />
              </Only>
            }
          />
          <Route
            path="/plan"
            element={
              <Only me={me} mode="ngo">
                <Plan />
              </Only>
            }
          />
          <Route
            path="/events"
            element={
              <Only me={me}>
                <Events me={me} />
              </Only>
            }
          />
          <Route
            path="/events/:id"
            element={
              <Only me={me}>
                <Event me={me} />
              </Only>
            }
          />
          <Route
            path="/report"
            element={
              <Only me={me} mode="civic">
                <Report />
              </Only>
            }
          />
          <Route
            path="/reports"
            element={
              <Only me={me} mode="ngo">
                <Reports />
              </Only>
            }
          />
          <Route
            path="/wards"
            element={
              <Only me={me}>
                <WardMap />
              </Only>
            }
          />
          <Route path="/signin" element={<SignIn me={me} setMe={setMe} />} />
          <Route path="/signup" element={<SignUp me={me} setMe={setMe} />} />
          <Route path="/profile" element={<Profile me={me} setMe={setMe} />} />
        </Routes>
      </main>
      <footer className="mt-12 border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-sm text-stone-500 sm:px-6">
          Places: BMC's map layers, from OpenCity. People per ward: BMC, mid-year 2023. Map: © OpenStreetMap contributors.
        </div>
      </footer>
    </>
  )
}

export default App
