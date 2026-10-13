import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { api } from '../api.js'
import PageTop from '../components/PageTop.jsx'
import { HOME, MODES } from '../modes.js'

const USERNAME = /^[a-z0-9._-]{3,30}$/

function Field({ id, label, hint, error, ...input }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="input w-full" {...input} />
      {hint && <p className="hint mt-1">{hint}</p>}
      <p className="mt-1 text-sm font-medium text-rose-700">{error}</p>
    </div>
  )
}

function SignUp({ me, setMe }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', ngo_name: '', username: '', password: '' })
  const [errors, setErrors] = useState({})
  const mode = params.get('as')

  if (me) return <Navigate to={HOME[me.mode]} replace />
  if (!MODES[mode]) return <Navigate to="/" replace />
  const other = mode === 'ngo' ? 'civic' : 'ngo'

  function change(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function submit(event) {
    event.preventDefault()
    const problems = {}
    if (form.name.trim().length < 2) problems.name = 'Enter your name.'
    if (mode === 'ngo' && form.ngo_name.trim().length < 2) problems.ngo_name = "Enter your NGO's name."
    if (!USERNAME.test(form.username.trim().toLowerCase())) problems.username = 'Use 3 to 30 small letters, numbers, dots or dashes.'
    if (form.password.length < 8) problems.password = 'Use at least 8 characters.'
    setErrors(problems)
    if (Object.keys(problems).length) return
    try {
      const user = await api('/api/accounts', { method: 'POST', body: { ...form, mode } })
      setMe(user)
      navigate(HOME[user.mode])
    } catch (problem) {
      setErrors({ username: problem.message })
    }
  }

  return (
    <>
      <PageTop
        title={mode === 'ngo' ? 'Create an NGO account' : 'Create a Civic account'}
        text={
          mode === 'ngo'
            ? 'For organisations that plan events and check the problems people report.'
            : 'For people in Mumbai. No email needed.'
        }
      >
        <p className="text-sm">
          Not {mode === 'ngo' ? 'an NGO' : 'Civic'}?{' '}
          <Link to={`/signup?as=${other}`}>Create {other === 'ngo' ? 'an NGO' : 'a Civic'} account</Link>
        </p>
      </PageTop>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="panel max-w-md">
          <form className="grid gap-3 p-5" onSubmit={submit} noValidate>
            <Field id="name" name="name" label="Your name" autoComplete="name" value={form.name} onChange={change} error={errors.name} />
            {mode === 'ngo' && (
              <Field
                id="ngo_name"
                name="ngo_name"
                label="NGO name"
                autoComplete="organization"
                value={form.ngo_name}
                onChange={change}
                error={errors.ngo_name}
              />
            )}
            <Field
              id="username"
              name="username"
              label="Username"
              hint="Small letters, numbers, dots and dashes."
              autoComplete="username"
              autoCapitalize="none"
              value={form.username}
              onChange={change}
              error={errors.username}
            />
            <Field
              id="password"
              name="password"
              type="password"
              label="Password"
              hint="At least 8 characters."
              autoComplete="new-password"
              value={form.password}
              onChange={change}
              error={errors.password}
            />
            <div>
              <button type="submit" className="btn btn-primary">
                Create account
              </button>
            </div>
          </form>
          <p className="border-t border-stone-200 px-5 py-3 text-sm">
            Already have an account? <Link to={`/signin?as=${mode}`}>Sign in</Link>
          </p>
        </section>
      </div>
    </>
  )
}

export default SignUp
