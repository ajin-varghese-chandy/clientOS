import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { create, fetchAll, logActivity } from '../api'
import { ArrowLeft } from 'lucide-react'
import ClientPicker from '../components/ClientPicker'

function NewProject() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [clientMode, setClientMode] = useState('existing')
  const [form, setForm] = useState({
    clientId: '',
    opportunityId: '',
    title: '',
    deadline: '',
  })
  const [newClient, setNewClient] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: 'Technology',
  })

  useEffect(() => {
    async function load() {
      try {
        const [clientData, oppData, projData] = await Promise.all([
          fetchAll('clients'),
          fetchAll('opportunities'),
          fetchAll('projects'),
        ])
        setClients(clientData)
        setOpportunities(oppData)
        setProjects(projData)
      } catch (err) {
        console.error('Failed to load new project data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'clientId' ? { opportunityId: '' } : {}),
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleNewClientChange(e) {
    const { name, value } = e.target
    setNewClient((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, clientName: '' }))
  }

  function switchClientMode(mode) {
    setClientMode(mode)
    setErrors((prev) => ({ ...prev, clientId: '', clientName: '' }))
  }

  const linkedOpportunities = opportunities.filter(
    (o) =>
      o.clientId === form.clientId &&
      o.stage === 'won' &&
      !projects.some((p) => p.opportunityId === o.id)
  )

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      let clientId = form.clientId
      let clientName = clients.find((c) => c.id === form.clientId)?.name || ''

      if (clientMode === 'new') {
        if (!newClient.name.trim()) {
          setErrors({ clientName: 'Client name is required' })
          return
        }
        const savedClient = await create('clients', {
          id: 'client_' + Date.now(),
          name: newClient.name.trim(),
          email: newClient.email,
          phone: newClient.phone,
          company: newClient.company,
          industry: newClient.industry,
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
        })
        clientId = savedClient.id
        clientName = savedClient.name
      }

      const newProject = {
        id: 'proj_' + Date.now(),
        clientId,
        opportunityId: clientMode === 'existing' ? form.opportunityId || null : null,
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

      const saved = await create('projects', newProject)
      logActivity(
        'project_started',
        `Project started: ${saved.title} for ${clientName}`,
        saved.id,
        'project'
      )
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
            <ClientPicker
              clients={clients}
              mode={clientMode}
              onModeChange={switchClientMode}
              clientId={form.clientId}
              onClientIdChange={handleChange}
              newClient={newClient}
              onNewClientChange={handleNewClientChange}
              errors={errors}
            />

            {clientMode === 'existing' && form.clientId && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Link to won opportunity <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  name="opportunityId"
                  value={form.opportunityId}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">No linked opportunity</option>
                  {linkedOpportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title} — ₹{o.value.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                {linkedOpportunities.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">No unlinked won opportunities for this client.</p>
                )}
              </div>
            )}

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
