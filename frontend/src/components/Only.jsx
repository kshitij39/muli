import { Navigate } from 'react-router'
import { HOME } from '../modes.js'

function Only({ me, mode, children }) {
  if (!me) return <Navigate to="/" replace />
  if (mode && me.mode !== mode) return <Navigate to={HOME[me.mode]} replace />
  return children
}

export default Only
