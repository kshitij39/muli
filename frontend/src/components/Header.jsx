import { Link, NavLink } from 'react-router'

function Header() {
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
      </div>
    </header>
  )
}

export default Header
