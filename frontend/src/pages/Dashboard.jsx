import { useState, useEffect } from 'react'
import { fetchAll } from '../api'
import { Send, CheckCircle, UserPlus, Target, CheckSquare, Rocket } from 'lucide-react'

function formatCurrency(amount) {
  if (amount >= 100000) {
    return '₹' + (amount / 100000).toFixed(1) + 'L'
  }
  return '₹' + amount.toLocaleString('en-IN')
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  let day
  if (msgDate.getTime() === today.getTime()) {
    day = 'Today'
  } else if (msgDate.getTime() === yesterday.getTime()) {
    day = 'Yesterday'
  } else {
    day = date.toLocaleDateString('en-IN')
  }
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return { day, time }
}

function getActivityIcon(type) {
  switch (type) {
    case 'proposal_sent': return <Send size={16} />
    case 'invoice_paid': return <CheckCircle size={16} />
    case 'new_lead': return <UserPlus size={16} />
    case 'milestone_done': return <Target size={16} />
    case 'task_completed': return <CheckSquare size={16} />
    case 'project_started': return <Rocket size={16} />
    default: return null
  }
}

function Dashboard() {
  const [opportunities, setOpportunities] = useState([])
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [o, p, i, a] = await Promise.all([
          fetchAll('opportunities'),
          fetchAll('projects'),
          fetchAll('invoices'),
          fetchAll('activities'),
        ])
        setOpportunities(o)
        setProjects(p)
        setInvoices(i)
        setActivities(a)
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  // Calculate stats
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  const revenueThisMonth = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)

  const activeProjects = projects.filter((p) => p.status === 'in_progress')
  const pipelineValue = opportunities
    .filter((o) => o.stage !== 'won' && o.stage !== 'lost')
    .reduce((sum, o) => sum + o.value, 0)

  const wonOpps = opportunities.filter((o) => o.stage === 'won')
  const conversionRate = opportunities.length > 0
    ? Math.round((wonOpps.length / opportunities.length) * 100)
    : 0

  const completedProjects = projects.filter((p) => p.status === 'completed')

  const outstandingInvoices = invoices
    .filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)

  // Group activities by day
  const grouped = {}
  activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((act) => {
      const { day } = formatDate(act.timestamp)
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(act)
    })

  return (
    <div>
      <h2 className="text-xl lg:text-2xl font-bold mb-4 text-white uppercase">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-4 lg:mb-6">
        <div className="bg-white rounded-lg shadow p-2.5 lg:p-3 hover:shadow-md transition-shadow">
          <div className="text-[10px] lg:text-xs text-gray-500">Revenue</div>
          <div className="text-lg lg:text-xl font-bold text-green-600">{formatCurrency(revenueThisMonth)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-2.5 lg:p-3 hover:shadow-md transition-shadow">
          <div className="text-[10px] lg:text-xs text-gray-500">Active Jobs</div>
          <div className="text-lg lg:text-xl font-bold text-blue-600">{activeProjects.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-2.5 lg:p-3 hover:shadow-md transition-shadow">
          <div className="text-[10px] lg:text-xs text-gray-500">Pipeline</div>
          <div className="text-lg lg:text-xl font-bold text-purple-600">{formatCurrency(pipelineValue)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-2.5 lg:p-3 hover:shadow-md transition-shadow">
          <div className="text-[10px] lg:text-xs text-gray-500">Conversion</div>
          <div className="text-lg lg:text-xl font-bold text-orange-600">{conversionRate}%</div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-2 gap-2 lg:gap-3 mb-4 lg:mb-6">
        <div className="bg-white rounded-lg shadow p-2.5 lg:p-3 hover:shadow-md transition-shadow">
          <div className="text-[10px] lg:text-xs text-gray-500">Completed</div>
          <div className="text-lg lg:text-xl font-bold">{completedProjects.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-2.5 lg:p-3 hover:shadow-md transition-shadow">
          <div className="text-[10px] lg:text-xs text-gray-500">Outstanding</div>
          <div className="text-lg lg:text-xl font-bold text-red-500">{formatCurrency(outstandingInvoices)}</div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg shadow p-3 lg:p-4">
        <h3 className="font-bold mb-2 lg:mb-3 text-xs lg:text-sm">Activity Timeline</h3>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-gray-400 text-xs py-4 text-center">No activity yet</p>
        ) : (
          Object.keys(grouped).map((day) => (
            <div key={day} className="mb-3 last:mb-0">
              <h4 className="text-xs font-semibold text-gray-600 mb-1.5">{day}</h4>
              {grouped[day].map((act) => {
                const { time } = formatDate(act.timestamp)
                return (
                  <div key={act.id} className="flex items-start gap-2 py-1.5 border-b last:border-b-0">
                    <span className="text-gray-500 mt-0.5">{getActivityIcon(act.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{act.message}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">{time}</span>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
