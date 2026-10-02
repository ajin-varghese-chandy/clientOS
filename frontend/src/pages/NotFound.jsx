import { Link } from 'react-router-dom'
import { Home, LayoutDashboard } from 'lucide-react'

function NotFound() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="min-h-screen bg-black/50 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-6xl lg:text-7xl font-bold mb-3">404</p>
          <p className="text-gray-300 text-sm lg:text-base mb-8">
            The page you are looking for does not exist.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Home size={16} />
              Go Home
            </Link>
            <Link
              to="/dashboard"
              className="border border-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
