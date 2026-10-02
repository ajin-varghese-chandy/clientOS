import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll } from '../api'
import {
  Send,
  CheckCircle,
  UserPlus,
  Target,
  CheckSquare,
  Rocket,
  IndianRupee,
  TrendingUp,
  FolderOpen,
  Percent,
  AlertCircle,
  Clock,
  ListTodo,
  Receipt,
  ArrowRight,
  Activity,
} from 'lucide-react'

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

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.round((d - t) / 86400000)
}

function deadlineLabel(days) {
  if (days === null) return { text: 'No deadline', cls: 'bg-gray-100 text-gray-500' }
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: 'bg-red-100 text-red-600' }
  if (days === 0) return { text: 'Due today', cls: 'bg-orange-100 text-orange-600' }
  return { text: `${days}d left`, cls: days <= 7 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500' }
}

const ACTIVITY_STYLE = {
  proposal_sent: { icon: Send, cls: 'bg-blue-50 text-blue-600' },
  invoice_paid: { icon: CheckCircle, cls: 'bg-green-50 text-green-600' },
  new_lead: { icon: UserPlus, cls: 'bg-purple-50 text-purple-600' },
  milestone_done: { icon: Target, cls: 'bg-indigo-50 text-indigo-600' },
  task_completed: { icon: CheckSquare, cls: 'bg-teal-50 text-teal-600' },
  project_started: { icon: Rocket, cls: 'bg-orange-50 text-orange-600' },
}

function StatCard({ to, icon: Icon, iconCls, label, value, sub }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 lg:p-4 hover:shadow-md hover:-translate-y-0.5 transition-all block"
    >
      <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-lg flex items-center justify-center mb-2.5 ${iconCls}`}>
        <Icon size={16} />
      </div>
      <div className="text-[10px] lg:text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg lg:text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
      {sub && <div className="text-[10px] lg:text-[11px] text-gray-400 mt-0.5 truncate">{sub}</div>}
    </Link>
  )
}

function SectionCard({ title, icon: Icon, action, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-gray-400" />}
          <h3 className="text-xs lg:text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Dashboard() {
  const [opportunities, setOpportunities] = useState([])
  const [projects, setProjects] = useState([])
  const [invoices, setInvoices] = useState([])
  const [activities, setActivities] = useState([])
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [o, p, i, a, t, c] = await Promise.all([
          fetchAll('opportunities'),
          fetchAll('projects'),
          fetchAll('invoices'),
          fetchAll('activities'),
          fetchAll('tasks'),
          fetchAll('clients'),
        ])
        setOpportunities(o)
        setProjects(p)
        setInvoices(i)
        setActivities(a)
        setTasks(t)
        setClients(c)
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

  const clientName = (id) => clients.find((c) => c.id === id)?.name || 'Unknown'
  const projectName = (id) => projects.find((p) => p.id === id)?.title || 'Unknown project'

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')
  const revenuePaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

  const outstandingList = invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue')
  const outstandingTotal = outstandingList.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

  const activeProjects = projects.filter((p) => p.status === 'in_progress')
  const completedProjects = projects.filter((p) => p.status === 'completed')

  const openOpps = opportunities.filter((o) => o.stage !== 'won' && o.stage !== 'lost')
  const pipelineValue = openOpps.reduce((sum, o) => sum + Number(o.value || 0), 0)

  const wonOpps = opportunities.filter((o) => o.stage === 'won')
  const conversionRate = opportunities.length > 0
    ? Math.round((wonOpps.length / opportunities.length) * 100)
    : 0
  const avgDeal = wonOpps.length > 0
    ? Math.round(wonOpps.reduce((s, o) => s + Number(o.value || 0), 0) / wonOpps.length)
    : 0

  const openTasks = tasks.filter((t) => t.status !== 'completed')
  const dueSoonTasks = openTasks
    .filter((t) => {
      const d = daysUntil(t.dueDate)
      return d !== null && d <= 7
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const overdueInvoices = invoices
    .filter((inv) => inv.status !== 'paid' && daysUntil(inv.dueDate) < 0)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

  const sortedProjects = [...activeProjects].sort(
    (a, b) => new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31')
  )

  const grouped = {}
  activities
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .forEach((act) => {
      const { day } = formatDate(act.timestamp)
      if (!grouped[day]) grouped[day] = []
      grouped[day].push(act)
    })

  function activityLink(act) {
    if (!act.relatedId) return null
    switch (act.entityType) {
      case 'client': return `/clients/${act.relatedId}`
      case 'project': return `/projects/${act.relatedId}`
      case 'opportunity': return '/pipeline'
      case 'invoice': return '/invoices'
      case 'task': {
        const task = tasks.find((t) => t.id === act.relatedId)
        return task ? `/projects/${task.projectId}` : null
      }
      default: return null
    }
  }

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div>
      <div className="mb-4 lg:mb-6">
        <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Dashboard</h2>
        <p className="text-xs lg:text-sm text-white/60 mt-0.5">{todayLabel} — here's your business at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-2 lg:mb-3">
        <StatCard
          to="/invoices"
          icon={IndianRupee}
          iconCls="bg-green-50 text-green-600"
          label="Revenue"
          value={formatCurrency(revenuePaid)}
          sub={`${paidInvoices.length} paid invoice${paidInvoices.length === 1 ? '' : 's'}`}
        />
        <StatCard
          to="/pipeline"
          icon={TrendingUp}
          iconCls="bg-purple-50 text-purple-600"
          label="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          sub={`${openOpps.length} open deal${openOpps.length === 1 ? '' : 's'}`}
        />
        <StatCard
          to="/projects"
          icon={FolderOpen}
          iconCls="bg-blue-50 text-blue-600"
          label="Active Jobs"
          value={activeProjects.length}
          sub="in progress now"
        />
        <StatCard
          to="/pipeline"
          icon={Percent}
          iconCls="bg-orange-50 text-orange-600"
          label="Win Rate"
          value={`${conversionRate}%`}
          sub={`${wonOpps.length} won of ${opportunities.length}`}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-4 lg:mb-6">
        <Link to="/invoices" className="bg-white/95 rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all block">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Outstanding</div>
          <div className="text-base lg:text-xl font-bold text-red-500 mt-0.5">{formatCurrency(outstandingTotal)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {outstandingList.length} unpaid
          </div>
        </Link>
        <Link to="/projects" className="bg-white/95 rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all block">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Completed</div>
          <div className="text-base lg:text-xl font-bold text-gray-900 mt-0.5">{completedProjects.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">projects delivered</div>
        </Link>
        <Link to="/projects" className="bg-white/95 rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all block">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Open Tasks</div>
          <div className="text-base lg:text-xl font-bold text-indigo-600 mt-0.5">{openTasks.length}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{dueSoonTasks.length} due this week</div>
        </Link>
        <Link to="/pipeline" className="bg-white/95 rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition-all block">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Avg Deal</div>
          <div className="text-base lg:text-xl font-bold text-green-600 mt-0.5">{formatCurrency(avgDeal)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">per won deal</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-4 lg:mb-5">
        <div className="lg:col-span-2">
          <SectionCard
            title="Active Projects"
            icon={FolderOpen}
            action={
              <Link to="/projects" className="text-[11px] font-medium text-blue-600 hover:underline flex items-center gap-0.5">
                View all <ArrowRight size={12} />
              </Link>
            }
          >
            {sortedProjects.length === 0 ? (
              <p className="text-gray-400 text-xs py-6 text-center">No active projects right now</p>
            ) : (
              <div className="space-y-3.5">
                {sortedProjects.slice(0, 5).map((p) => {
                  const days = daysUntil(p.deadline)
                  const dl = deadlineLabel(days)
                  const barCls = p.progress >= 100 ? 'bg-green-500' : p.progress >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                  return (
                    <Link key={p.id} to={`/projects/${p.id}`} className="block group">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {p.title}
                          </div>
                          <div className="text-[11px] text-gray-400 truncate">{clientName(p.clientId)}</div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${dl.cls}`}>
                          {dl.text}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all ${barCls}`} style={{ width: `${p.progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-400">
                          {p.milestones?.filter((m) => m.done).length || 0}/{p.milestones?.length || 0} milestones
                        </span>
                        <span className="text-[10px] font-medium text-gray-500">{p.progress}%</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="lg:col-span-1">
          <SectionCard title="Needs Attention" icon={AlertCircle}>
            {overdueInvoices.length === 0 && dueSoonTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle size={22} className="text-green-500 mb-2" />
                <p className="text-xs text-gray-400">You're all caught up</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueInvoices.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Receipt size={12} className="text-red-500" />
                      <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wide">Overdue invoices</span>
                    </div>
                    <div className="space-y-1.5">
                      {overdueInvoices.slice(0, 3).map((inv) => (
                        <Link
                          key={inv.id}
                          to="/invoices"
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-red-50/60 hover:bg-red-50 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-900 truncate">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-gray-500 truncate">{clientName(inv.clientId)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-red-600">{formatCurrency(inv.total)}</div>
                            <div className="text-[10px] text-red-400">{Math.abs(daysUntil(inv.dueDate))}d late</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {dueSoonTasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <ListTodo size={12} className="text-orange-500" />
                      <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide">Tasks due soon</span>
                    </div>
                    <div className="space-y-1.5">
                      {dueSoonTasks.slice(0, 4).map((task) => {
                        const days = daysUntil(task.dueDate)
                        return (
                          <Link
                            key={task.id}
                            to={`/projects/${task.projectId}`}
                            className="flex items-start gap-2 p-2 rounded-lg bg-orange-50/60 hover:bg-orange-50 transition-colors"
                          >
                            <Clock size={12} className="text-orange-400 mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-gray-900 truncate">{task.title}</div>
                              <div className="text-[10px] text-gray-500 truncate">{projectName(task.projectId)}</div>
                            </div>
                            <span className={`text-[10px] font-medium whitespace-nowrap shrink-0 ${days < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                              {days < 0 ? `${Math.abs(days)}d late` : days === 0 ? 'today' : `${days}d`}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Activity Timeline"
        icon={Activity}
        action={<span className="text-[11px] text-gray-400">{activities.length} events</span>}
      >
        {Object.keys(grouped).length === 0 ? (
          <p className="text-gray-400 text-xs py-6 text-center">No activity yet</p>
        ) : (
          <div className="space-y-4">
            {Object.keys(grouped).slice(0, 5).map((day) => (
              <div key={day}>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{day}</h4>
                <div className="space-y-1">
                  {grouped[day].map((act) => {
                    const { time } = formatDate(act.timestamp)
                    const style = ACTIVITY_STYLE[act.type] || { icon: Activity, cls: 'bg-gray-100 text-gray-500' }
                    const Icon = style.icon
                    const to = activityLink(act)
                    const rowCls = `flex items-start gap-2.5 py-1.5 border-b border-gray-50 last:border-b-0 ${
                      to ? 'hover:bg-gray-50 -mx-1.5 px-1.5 rounded-lg transition-colors' : ''
                    }`
                    const inner = (
                      <>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${style.cls}`}>
                          <Icon size={12} />
                        </span>
                        <p className={`flex-1 min-w-0 text-xs truncate ${to ? 'text-gray-700' : 'text-gray-600'}`}>
                          {act.message}
                        </p>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap mt-0.5">{time}</span>
                      </>
                    )
                    return to ? (
                      <Link key={act.id} to={to} className={rowCls}>{inner}</Link>
                    ) : (
                      <div key={act.id} className={rowCls}>{inner}</div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default Dashboard
