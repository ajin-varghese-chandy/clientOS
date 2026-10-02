import { Link } from 'react-router-dom'
import { GitPullRequestArrow, Users, FolderOpen, DollarSign, ArrowRight, Info } from 'lucide-react'

const quickLinks = [
  { to: '/pipeline', icon: GitPullRequestArrow, label: 'Pipeline', desc: 'Track leads through every stage' },
  { to: '/clients', icon: Users, label: 'Clients', desc: 'Manage contacts and details' },
  { to: '/projects', icon: FolderOpen, label: 'Projects', desc: 'Milestones, tasks and progress' },
  { to: '/invoices', icon: DollarSign, label: 'Invoices', desc: 'Create and track payments' },
]

function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="min-h-screen bg-black/50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center text-white">
          <img src="/favicon.png" alt="Logo" className="w-14 h-14 mx-auto mb-4" />
          <h1 className="text-3xl lg:text-4xl font-bold uppercase mb-3">
            CLIENT-OS
          </h1>
          <p className="text-gray-300 text-[min(2.5vw,1rem)] mb-8 whitespace-nowrap">
            A small CRM for freelancers to manage leads, projects, and invoices.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {quickLinks.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg p-4 text-left transition-colors"
              >
                <Icon size={20} className="text-blue-400 mb-2" />
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Go to Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/about"
              className="border border-white/30 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Info size={16} />
              About / Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
