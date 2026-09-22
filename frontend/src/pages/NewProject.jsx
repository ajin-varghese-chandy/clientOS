import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { create, fetchAll } from '../api'
import { ArrowLeft } from 'lucide-react'

function NewProject() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    clientId: '',
    title: '',
    deadline: '',
  })

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAll('clients')
        setClients(data)
      } catch (err) {
        console.error('Failed to load clients', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const newProject = {
      id: 'proj_' + Date.now(),
      clientId: form.clientId,
      opportunityId: null,
      title: form.title,
      status: 'in_progress',
      deadline: form.deadline,
      progress: 0,
      milestones: [
        { name: 'Planning', done: false },
        { name: 'Development', done: false },
        { name: 'Review', done: false },
        { name: 'Launch', done: false },
      ],
      createdAt: new Date().toISOString().split('T')[0],
    }

    try {
      await create('projects', newProject)
      navigate('/projects')
    } catch (err) {
      console.error('Failed to create project', err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/projects" className="text-white text-sm font-bold hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} />
        Back to Projects
      </Link>

      <h2 className="text-xl lg:text-2xl font-bold mb-4 text-white uppercase">New Project</h2>

      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Select a client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Project Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Website Redesign"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Deadline *</label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Create Project
            </button>
            <Link
              to="/projects"
              className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewProject
