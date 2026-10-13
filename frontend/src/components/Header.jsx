import { Link, NavLink } from 'react-router'

function Header({ me }) {
  return (
    <header className="bg-stone-900">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="logo">
          MULI
        </Link>
        <nav className="flex h-full gap-5 text-sm">
          <NavLink to="/near" className="nav-link">
            Near me
          </NavLink>
        </nav>
        {me && (
          <NavLink to="/profile" className="nav-link ml-auto h-full text-sm">
            {me.mode === 'ngo' ? me.ngo_name : me.name}
          </NavLink>
        )}
      </div>
    </header>
  )
}

export default Header
