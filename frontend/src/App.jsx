import { Route, Routes } from 'react-router'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import NearMe from './pages/NearMe.jsx'

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/near" element={<NearMe />} />
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
