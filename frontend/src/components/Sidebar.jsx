import { NavLink } from 'react-router-dom'
import { LayoutDashboard, GitPullRequestArrow, Users, FolderOpen, DollarSign, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

function Sidebar({ open, onToggle, onClose }) {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/pipeline', icon: GitPullRequestArrow, label: 'Pipeline' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/projects', icon: FolderOpen, label: 'Projects' },
    { to: '/invoices', icon: DollarSign, label: 'Invoices' },
  ]

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-40
      ${open ? 'w-56 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'}
      bg-black/60 text-white flex flex-col transition-all duration-300
    `}>
      <div className="p-4 flex items-center justify-between">
        {open && (
          <h1 className="text-lg font-bold">CLIENT-<span className="uppercase">OS</span></h1>
        )}
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white p-1 ml-auto"
        >
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
      <nav className="flex-1 mt-2">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {open && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
