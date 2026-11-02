import { Link, NavLink } from 'react-router'
import { HOME, MODES } from '../modes.js'

const MENUS = {
  civic: [
    ['/near', 'Near me'],
    ['/wards', 'Ward map'],
    ['/events', 'Events'],
    ['/report', 'Report a problem'],
  ],
  ngo: [
    ['/plan', 'Plan an event'],
    ['/wards', 'Ward map'],
    ['/events', 'Events'],
  ],
}

function Header({ me }) {
  const links = me ? MENUS[me.mode] : []
  return (
    <header className="bg-stone-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 px-4 sm:h-14 sm:flex-nowrap sm:px-6">
        <Link to={me ? HOME[me.mode] : '/'} className="logo my-2.5 sm:my-0">
          MULI
        </Link>
        {links.length > 0 && (
          <nav className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-5 overflow-x-auto px-4 text-sm sm:order-none sm:mx-0 sm:h-full sm:w-auto sm:px-0">
            {links.map(([to, text]) => (
              <NavLink key={to} to={to} className="nav-link shrink-0 py-2.5 sm:py-0">
                {text}
              </NavLink>
            ))}
          </nav>
        )}
        {me && (
          <div className="ml-auto flex items-baseline gap-2 text-sm">
            <span className="text-stone-400">{MODES[me.mode]}</span>
            <Link to="/profile" className="font-medium text-white no-underline hover:underline">
              {me.mode === 'ngo' ? me.ngo_name : me.name}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
