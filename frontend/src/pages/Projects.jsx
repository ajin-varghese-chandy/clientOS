import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll, update } from '../api'
import { FolderOpen, Plus } from 'lucide-react'

function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [projData, clientData] = await Promise.all([
          fetchAll('projects'),
          fetchAll('clients'),
        ])
        setProjects(projData)
        setClients(clientData)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Projects</h2>
        <Link
          to="/projects/new"
          className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white/10 rounded-lg p-12 text-center">
          <FolderOpen size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-300 font-medium">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1">Win an opportunity to start a project</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0">
                  <Link to={`/projects/${project.id}`} className="font-bold text-blue-600 hover:underline text-sm">
                    {project.title}
                  </Link>
                  <p className="text-xs text-gray-500 truncate">{getClientName(project.clientId)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
                  project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  project.status === 'completed' ? 'bg-green-100 text-green-700' :
                  project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-700' :
                  project.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
                  <span>{project.progress}%</span>
                  <span>{project.milestones.filter((m) => m.done).length}/{project.milestones.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 mb-2">
                Due: {project.deadline}
              </div>

              <div className="border-t pt-2 flex gap-1 flex-wrap">
                {project.status !== 'in_progress' && (
                  <button
                    onClick={() => changeStatus(project, 'in_progress')}
                    className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors"
                  >
                    In Progress
                  </button>
                )}
                {project.status !== 'completed' && (
                  <button
                    onClick={() => changeStatus(project, 'completed')}
                    className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded hover:bg-green-100 transition-colors"
                  >
                    Completed
                  </button>
                )}
                {project.status !== 'on_hold' && (
                  <button
                    onClick={() => changeStatus(project, 'on_hold')}
                    className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded hover:bg-yellow-100 transition-colors"
                  >
                    On Hold
                  </button>
                )}
                {project.status !== 'cancelled' && (
                  <button
                    onClick={() => changeStatus(project, 'cancelled')}
                    className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded hover:bg-red-100 transition-colors"
                  >
                    Cancelled
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Projects
