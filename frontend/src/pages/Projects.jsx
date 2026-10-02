import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll, update } from '../api'
import {
  FolderOpen,
  Plus,
  Search,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react'

const STATUS_META = {
  in_progress: {
    label: 'In Progress',
    badge: 'bg-blue-100 text-blue-700',
    bar: 'bg-blue-500',
    accent: 'border-l-blue-500',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-green-100 text-green-700',
    bar: 'bg-green-500',
    accent: 'border-l-green-500',
  },
  on_hold: {
    label: 'On Hold',
    badge: 'bg-yellow-100 text-yellow-700',
    bar: 'bg-yellow-500',
    accent: 'border-l-yellow-500',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
    accent: 'border-l-red-500',
  },
}

const STATUS_ORDER = ['in_progress', 'completed', 'on_hold', 'cancelled']

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

function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [projData, clientData, taskData] = await Promise.all([
          fetchAll('projects'),
          fetchAll('clients'),
          fetchAll('tasks'),
        ])
        setProjects(projData)
        setClients(clientData)
        setTasks(taskData)
      } catch (err) {
        console.error('Failed to load projects', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function changeStatus(project, newStatus) {
    const updated = { ...project, status: newStatus }
    setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)))
    try {
      await update('projects', project.id, updated)
    } catch (err) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)))
      console.error('Failed to update project', err)
    }
  }

  function getClientName(clientId) {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : 'Unknown'
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const counts = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1
    return acc
  }, {})

  const activeCount = projects.filter((p) => p.status === 'in_progress').length

  const filtered = projects
    .filter((p) => (filter === 'all' ? true : p.status === filter))
    .filter((p) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        getClientName(p.clientId).toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const rank = (s) => STATUS_ORDER.indexOf(s)
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
      return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31')
    })

  const openTasksFor = (projectId) =>
    tasks.filter((t) => t.projectId === projectId && t.status !== 'completed').length

  const filterChips = [
    { key: 'all', label: 'All', count: projects.length },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] || 0 })),
  ]

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Projects</h2>
          <p className="text-xs lg:text-sm text-white/60 mt-0.5">
            {activeCount} active · {projects.length} total
          </p>
        </div>
        <Link
          to="/projects/new"
          className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-3 mb-4 lg:mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === chip.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 text-gray-600 border border-gray-200 hover:bg-white'
              }`}
            >
              {chip.label}
              <span className={`ml-1.5 ${filter === chip.key ? 'text-white/80' : 'text-gray-400'}`}>
                {chip.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-lg shadow-sm border border-gray-100 pl-8 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FolderOpen size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium text-sm">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {projects.length === 0 ? 'Win an opportunity to start a project' : 'Try a different status or search term'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {filtered.map((project) => {
            const meta = STATUS_META[project.status] || {
              label: project.status,
              badge: 'bg-gray-100 text-gray-600',
              bar: 'bg-gray-400',
              accent: 'border-l-gray-300',
            }
            const days = daysUntil(project.deadline)
            const dl = deadlineLabel(days)
            const doneMilestones = project.milestones?.filter((m) => m.done).length || 0
            const totalMilestones = project.milestones?.length || 0
            const openTasks = openTasksFor(project.id)

            return (
              <div
                key={project.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${meta.accent} p-4 hover:shadow-md transition-shadow duration-200 flex flex-col`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-bold text-gray-900 hover:text-blue-600 text-sm truncate transition-colors"
                  >
                    {project.title}
                  </Link>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                <Link
                  to={`/clients/${project.clientId}`}
                  className="text-xs text-gray-500 hover:text-blue-600 hover:underline truncate"
                >
                  {getClientName(project.clientId)}
                </Link>

                <div className="mt-3 mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span className="font-medium">Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${meta.bar}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {doneMilestones}/{totalMilestones} milestones
                  </span>
                  <span className="flex items-center gap-1">
                    <ListTodo size={11} />
                    {openTasks} open task{openTasks === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${dl.cls}`}>
                    <CalendarDays size={10} />
                    {dl.text}
                  </span>
                  <Link
                    to={`/projects/${project.id}`}
                    className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    Open <ArrowRight size={11} />
                  </Link>
                </div>

                <div className="flex gap-1 flex-wrap mt-auto">
                  {project.status !== 'in_progress' && (
                    <button
                      onClick={() => changeStatus(project, 'in_progress')}
                      className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      In Progress
                    </button>
                  )}
                  {project.status !== 'completed' && (
                    <button
                      onClick={() => changeStatus(project, 'completed')}
                      className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={10} />
                      Completed
                    </button>
                  )}
                  {project.status !== 'on_hold' && (
                    <button
                      onClick={() => changeStatus(project, 'on_hold')}
                      className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md hover:bg-yellow-100 transition-colors"
                    >
                      On Hold
                    </button>
                  )}
                  {project.status !== 'cancelled' && (
                    <button
                      onClick={() => changeStatus(project, 'cancelled')}
                      className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Cancelled
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Projects
