import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api.js'
import PageTop from '../components/PageTop.jsx'
import { HOME, MODES } from '../modes.js'

function SignIn({ me, setMe }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const mode = params.get('as')

  if (me) return <Navigate to={HOME[me.mode]} replace />
  if (!MODES[mode]) return <Navigate to="/" replace />
  const other = mode === 'ngo' ? 'civic' : 'ngo'

  async function submit(event) {
    event.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password.')
      return
    }
    try {
      const user = await api('/api/session', { method: 'POST', body: { mode, username, password } })
      setMe(user)
      navigate(HOME[user.mode])
    } catch (problem) {
      setError(problem.message)
    }
  }

  return (
    <>
      <PageTop
        title={`${MODES[mode]} sign in`}
        text={
          mode === 'ngo'
            ? 'Plan health, sanitation and education events, and check the problems people report.'
            : "See what's near you, join events and report problems."
        }
      >
        <p className="text-sm">
          Not {mode === 'ngo' ? 'an NGO' : 'Civic'}? <Link to={`/signin?as=${other}`}>{MODES[other]} sign in</Link>
        </p>
      </PageTop>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="panel max-w-md">
          <form className="grid gap-3 p-5" onSubmit={submit} noValidate>
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <input
                id="username"
                className="input w-full"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input w-full"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="mt-1 text-sm font-medium text-rose-700" role="alert">
                {error}
              </p>
            </div>
            <div>
              <button type="submit" className="btn btn-primary">
                Sign in
              </button>
            </div>
          </form>
          <p className="border-t border-stone-200 px-5 py-3 text-sm">
            New here? <Link to={`/signup?as=${mode}`}>Create {mode === 'ngo' ? 'an NGO' : 'a Civic'} account</Link>
          </p>
        </section>
      </div>
    </>
  )
}

export default SignIn
