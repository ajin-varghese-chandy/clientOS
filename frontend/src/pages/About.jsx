import { Link } from 'react-router-dom'
import { ArrowLeft, Users, GitPullRequestArrow, FolderOpen, DollarSign } from 'lucide-react'

const steps = [
  'Lead', 'Proposal', 'Negotiation', 'Won', 'Project', 'Invoice', 'Paid',
]

const howTos = [
  {
    icon: Users,
    title: 'Add a client',
    desc: 'Go to Clients and click "Add Client" to save contact and company details.',
  },
  {
    icon: GitPullRequestArrow,
    title: 'Create an opportunity',
    desc: 'Use "New Opportunity" to move a lead through the pipeline stages until it is Won.',
  },
  {
    icon: FolderOpen,
    title: 'Run a project',
    desc: 'Winning an opportunity creates a Project. Track milestones and tasks as you go.',
  },
  {
    icon: DollarSign,
    title: 'Send an invoice',
    desc: 'From a project, click "Create Invoice", add line items, and mark it Paid when settled.',
  },
]

function About() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="min-h-screen bg-black/50">
        <div className="max-w-3xl mx-auto p-4 lg:p-8 text-white">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-bold hover:underline mb-6"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>

          <div className="bg-white rounded-lg shadow p-5 lg:p-6 mb-4">
            <h1 className="text-xl lg:text-2xl font-bold uppercase text-gray-900 mb-2">About Client-OS</h1>
            <p className="text-sm text-gray-600">
              ClientOS is a small CRM for freelancers to manage leads, projects, and invoices —
              from first contact to final payment, in one place.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-5 lg:p-6 mb-4">
            <h2 className="text-sm font-bold uppercase text-gray-900 mb-3">How it works</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              {steps.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                    {step}
                  </span>
                  {i < steps.length - 1 && <span className="text-gray-400 text-xs">→</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5 lg:p-6 mb-4">
            <h2 className="text-sm font-bold uppercase text-gray-900 mb-4">Getting started</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {howTos.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={16} className="text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                  </div>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default About
