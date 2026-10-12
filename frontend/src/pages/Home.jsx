import { Link } from 'react-router'
import PageTop from '../components/PageTop.jsx'

const CIVIC = [
  'See health posts, toilets, schools and more near you',
  'Come along to an event, or volunteer',
  'Report a problem anywhere in the city',
]

const NGO = [
  "See how many people each ward's places serve",
  'Plan a health, sanitation or education event',
  'Check the problems people report',
]

function Side({ mode, title, who, things }) {
  return (
    <section className="panel flex flex-col">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className="text-sm text-stone-500">{who}</span>
      </div>
      <ul className="flex-1 list-disc space-y-1.5 py-4 pr-5 pl-9">
        {things.map((thing) => (
          <li key={thing}>{thing}</li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-200 px-5 py-4">
        <Link to={`/signin?as=${mode}`} className="btn btn-primary">
          Sign in
        </Link>
        <Link to={`/signup?as=${mode}`} className="text-sm">
          New here? Create {mode === 'ngo' ? 'an NGO' : 'a Civic'} account
        </Link>
      </div>
    </section>
  )
}

function Home() {
  return (
    <>
      <PageTop
        title="Health, toilets and schools, ward by ward"
        text="BMC maps thousands of public places across Mumbai: health posts, dispensaries, public toilets, schools and more. MULI puts them next to how many people live in each of the 24 wards. NGOs plan events where each place has to serve the most people, and people nearby come along, volunteer or tell NGOs about problems."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <p className="mb-4 text-stone-600">How will you use MULI? An account is either Civic or NGO.</p>
        <div className="grid gap-6 md:grid-cols-2">
          <Side mode="civic" title="Civic" who="For people in Mumbai" things={CIVIC} />
          <Side mode="ngo" title="NGO" who="For organisations" things={NGO} />
        </div>
        <section className="panel mt-6 p-4 text-sm text-stone-600">
          <h2 className="mb-1 font-semibold text-stone-900">Where the numbers come from</h2>
          <p>
            Places come from BMC's map layers, downloaded from OpenCity. People per ward are BMC's figures for mid-2023.
            Wards are compared by how many people each health post or dispensary, public toilet and school has to serve.
            That counts places, not how good or busy they are. Some health places are only roughly placed on BMC's map,
            and are marked as approximate.
          </p>
        </section>
      </div>
    </>
  )
}

export default Home
