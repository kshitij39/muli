import { Navigate, useNavigate } from 'react-router'
import { api } from '../api.js'
import PageTop from '../components/PageTop.jsx'
import { MODES } from '../modes.js'

function Profile({ me, setMe }) {
  const navigate = useNavigate()

  if (!me) return <Navigate to="/" replace />

  async function signOut() {
    await api('/api/session', { method: 'DELETE' })
    setMe(null)
    navigate('/')
  }

  const about =
    me.mode === 'ngo'
      ? `NGO account, run by ${me.name}. Username: ${me.username}.`
      : `${MODES[me.mode]} account. Username: ${me.username}.`

  return (
    <PageTop title={me.mode === 'ngo' ? me.ngo_name : me.name} text={about}>
      <button type="button" className="btn" onClick={signOut}>
        Sign out
      </button>
    </PageTop>
  )
}

export default Profile
