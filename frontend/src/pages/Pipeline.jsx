import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll, update, create, logActivity } from '../api'
import { MousePointerClick, FolderOpen, X } from 'lucide-react'

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-100 border-gray-300', ring: 'ring-gray-500', hint: 'New leads go here' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 border-blue-300', ring: 'ring-blue-500', hint: 'Awaiting response' },
  { key: 'proposal', label: 'Proposal Sent', color: 'bg-yellow-50 border-yellow-300', ring: 'ring-yellow-500', hint: 'Proposal out' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 border-orange-300', ring: 'ring-orange-500', hint: 'In discussion' },
  { key: 'won', label: 'Won', color: 'bg-green-50 border-green-300', ring: 'ring-green-500', hint: 'Ready to start' },
]

function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN')
}

function newId(prefix) {
  return prefix + Date.now()
}

function Pipeline() {
  const [opportunities, setOpportunities] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [wonModal, setWonModal] = useState({ show: false, opp: null })
  const [projectForm, setProjectForm] = useState({ title: '', deadline: '' })
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStage, setDragOverStage] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [oppData, clientData, projData] = await Promise.all([
          fetchAll('opportunities'),
          fetchAll('clients'),
          fetchAll('projects'),
        ])
        setOpportunities(oppData)
        setClients(clientData)
        setProjects(projData)
      } catch (err) {
        console.error('Failed to load pipeline', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function moveOppToStage(opp, newStage) {
    if (!newStage || opp.stage === newStage) return

    const updated = { ...opp, stage: newStage }
    setOpportunities((prev) => prev.map((o) => (o.id === opp.id ? updated : o)))

    try {
      await update('opportunities', opp.id, updated)
      if (newStage === 'proposal' && opp.stage !== 'proposal') {
        logActivity(
          'proposal_sent',
          `Proposal sent to ${getClientName(opp.clientId)} for ${opp.title}`,
          opp.id,
          'opportunity'
        )
      }
    } catch (err) {
      setOpportunities((prev) => prev.map((o) => (o.id === opp.id ? opp : o)))
      console.error('Failed to update opportunity', err)
      return
    }

    if (newStage === 'won') {
      openWonModal(opp)
    }
  }

  function handleDragOver(e, stageKey) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStage !== stageKey) setDragOverStage(stageKey)
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStage(null)
    }
  }

  function handleDrop(e, stageKey) {
    e.preventDefault()
    setDraggingId(null)
    setDragOverStage(null)
    const id = e.dataTransfer.getData('text/plain')
    const opp = opportunities.find((o) => o.id === id)
    if (opp) moveOppToStage(opp, stageKey)
  }

  function getClientName(clientId) {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : 'Unknown'
  }

  function hasProject(oppId) {
    return projects.some((p) => p.opportunityId === oppId)
  }

  function getProjectForOpp(oppId) {
    return projects.find((p) => p.opportunityId === oppId)
  }

  function openWonModal(opp) {
    setWonModal({ show: true, opp })
    setProjectForm({ title: opp.title, deadline: '' })
  }

  function closeWonModal() {
    setWonModal({ show: false, opp: null })
    setProjectForm({ title: '', deadline: '' })
  }

  async function createProjectFromWon() {
    if (!projectForm.deadline) return

    const newProject = {
      id: newId('proj_'),
      clientId: wonModal.opp.clientId,
      opportunityId: wonModal.opp.id,
      title: projectForm.title,
      status: 'in_progress',
      deadline: projectForm.deadline,
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
      const saved = await create('projects', newProject)
      setProjects((prev) => [...prev, saved])
      logActivity(
        'project_started',
        `Project started: ${saved.title} for ${getClientName(saved.clientId)}`,
        saved.id,
        'project'
      )
      closeWonModal()
    } catch (err) {
      console.error('Failed to create project', err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Pipeline</h2>
        <span className="text-xs text-white/60">Drag cards between stages</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 px-3 lg:mx-0 lg:px-0">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stage === stage.key)
          const totalValue = stageOpps.reduce((sum, o) => sum + o.value, 0)

          return (
            <div
              key={stage.key}
              onDragOver={(e) => handleDragOver(e, stage.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`min-w-[240px] lg:min-w-0 flex-1 rounded-lg border-2 ${stage.color} p-3 transition-all duration-150 ${
                dragOverStage === stage.key ? `ring-2 ${stage.ring} scale-[1.01]` : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xs lg:text-sm">{stage.label}</h3>
                <span className="text-[10px] lg:text-xs bg-white rounded-full px-1.5 lg:px-2 py-0.5 font-medium">
                  {stageOpps.length} · {formatCurrency(totalValue)}
                </span>
              </div>

              <div className="space-y-2 min-h-[60px] lg:min-h-[80px]">
                {stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', opp.id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggingId(opp.id)
                    }}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDragOverStage(null)
                    }}
                    className={`bg-white rounded-lg p-2 lg:p-2.5 border border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all duration-150 ${
                      draggingId === opp.id ? 'opacity-40' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs lg:text-sm truncate">{opp.title}</div>
                      <Link
                        to={`/clients/${opp.clientId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] lg:text-xs text-gray-500 truncate block hover:text-blue-600 hover:underline"
                      >
                        {getClientName(opp.clientId)}
                      </Link>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] lg:text-xs font-bold text-green-600">
                          {formatCurrency(opp.value)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {opp.probability}%
                        </span>
                      </div>
                      {opp.stage === 'won' && (
                        hasProject(opp.id) ? (
                          <Link
                            to={`/projects/${getProjectForOpp(opp.id).id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 flex items-center justify-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors w-full"
                          >
                            <FolderOpen size={10} />
                            View Project
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); openWonModal(opp) }}
                            className="mt-2 flex items-center justify-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100 transition-colors w-full"
                          >
                            <FolderOpen size={10} />
                            Create Project
                          </button>
                        )
                      )}
                    </div>
                  </div>
                ))}
                {stageOpps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-4 lg:py-6 text-gray-400">
                    <MousePointerClick size={18} className="mb-1 opacity-50" />
                    <p className="text-[10px] lg:text-xs">{stage.hint}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {wonModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold">Create Project from Won Deal</h3>
              <button onClick={closeWonModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Title</label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline *</label>
                <input
                  type="date"
                  value={projectForm.deadline}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Client: {getClientName(wonModal.opp?.clientId)} | Value: {formatCurrency(wonModal.opp?.value || 0)}
              </p>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={closeWonModal}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Skip
              </button>
              <button
                onClick={createProjectFromWon}
                disabled={!projectForm.deadline || hasProject(wonModal.opp?.id)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasProject(wonModal.opp?.id) ? 'Project Exists' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pipeline
