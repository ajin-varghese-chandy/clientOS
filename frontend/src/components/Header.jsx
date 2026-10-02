import { Link, useNavigate } from 'react-router-dom'
import { Plus, Menu, X } from 'lucide-react'

function Header({ sidebarOpen, onToggleSidebar }) {
  const navigate = useNavigate()

  return (
    <header className="bg-black/40 shadow-sm px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-gray-300 hover:text-white lg:hidden"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/favicon.png" alt="Logo" className="w-7 h-7 lg:w-8 lg:h-8" />
          <h1 className="text-base lg:text-lg font-bold text-white uppercase">CLIENT-OS</h1>
        </Link>
      </div>
      <button
        onClick={() => navigate('/new-opportunity')}
        className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5"
      >
        <Plus size={14} />
        <span className="hidden sm:inline">New Lead</span>
        <span className="sm:hidden">New</span>
      </button>
    </header>
  )
}

export default Header
