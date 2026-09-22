import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll, update, create } from '../api'
import { ChevronLeft, ChevronRight, MousePointerClick, FolderOpen, X } from 'lucide-react'

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-100 border-gray-300', hint: 'New leads go here' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 border-blue-300', hint: 'Awaiting response' },
  { key: 'proposal', label: 'Proposal Sent', color: 'bg-yellow-50 border-yellow-300', hint: 'Proposal out' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 border-orange-300', hint: 'In discussion' },
  { key: 'won', label: 'Won', color: 'bg-green-50 border-green-300', hint: 'Ready to start' },
]

function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN')
}

function getStageIndex(stageKey) {
  return STAGES.findIndex((s) => s.key === stageKey)
}

function Pipeline() {
  const [opportunities, setOpportunities] = useState([])
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([])
  const [wonModal, setWonModal] = useState({ show: false, opp: null })
  const [projectForm, setProjectForm] = useState({ title: '', deadline: '' })

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

  function toggleSelect(id) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  function clearSelection() {
    setSelected([])
  }

  async function moveSelected(direction) {
    const selectedOpps = opportunities.filter((o) => selected.includes(o.id))
    const updates = []
    let movingToWon = false
    let wonOpp = null

    for (const opp of selectedOpps) {
      const currentIndex = getStageIndex(opp.stage)
      const newIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1

      if (newIndex < 0 || newIndex >= STAGES.length) continue

      const newStage = STAGES[newIndex].key
      const updated = { ...opp, stage: newStage }
      updates.push({ opp, updated })

      if (newStage === 'won') {
        movingToWon = true
        wonOpp = opp
      }
    }

    if (updates.length === 0) return

    setOpportunities((prev) =>
      prev.map((o) => {
        const u = updates.find((upd) => upd.opp.id === o.id)
        return u ? u.updated : o
      })
    )
    setSelected([])

    for (const { opp, updated } of updates) {
      try {
        await update('opportunities', opp.id, updated)
      } catch (err) {
        setOpportunities((prev) =>
          prev.map((o) => (o.id === opp.id ? opp : o))
        )
        console.error('Failed to update opportunity', err)
      }
    }

    if (movingToWon && wonOpp) {
      openWonModal(wonOpp)
    }
  }

  function getClientName(clientId) {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : 'Unknown'
  }

  function hasProject(oppId) {
    return projects.some((p) => p.opportunityId === oppId)
  }

  function canMoveLeft() {
    return selected.some((id) => {
      const opp = opportunities.find((o) => o.id === id)
      return opp && getStageIndex(opp.stage) > 0
    })
  }

  function canMoveRight() {
    return selected.some((id) => {
      const opp = opportunities.find((o) => o.id === id)
      return opp && getStageIndex(opp.stage) < STAGES.length - 1
    })
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
      id: 'proj_' + Date.now(),
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
      await create('projects', newProject)
      closeWonModal()
    } catch (err) {
      console.error('Failed to create project', err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="pb-20">
      <h2 className="text-xl lg:text-2xl font-bold mb-4 text-white uppercase">Pipeline</h2>

      {/* Mobile: horizontal scroll, Desktop: flex */}
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-3 px-3 lg:mx-0 lg:px-0">
        {STAGES.map((stage) => {
          const stageOpps = opportunities.filter((o) => o.stage === stage.key)
          const totalValue = stageOpps.reduce((sum, o) => sum + o.value, 0)
          const allSelected = stageOpps.length > 0 && stageOpps.every((o) => selected.includes(o.id))

          return (
            <div
              key={stage.key}
              className={`min-w-[240px] lg:min-w-0 flex-1 rounded-lg border-2 ${stage.color} p-3`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        setSelected((prev) => prev.filter((id) => !stageOpps.some((o) => o.id === id)))
                      } else {
                        setSelected((prev) => [...new Set([...prev, ...stageOpps.map((o) => o.id)])])
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <h3 className="font-bold text-xs lg:text-sm">{stage.label}</h3>
                </div>
                <span className="text-[10px] lg:text-xs bg-white rounded-full px-1.5 lg:px-2 py-0.5 font-medium">
                  {stageOpps.length} · {formatCurrency(totalValue)}
                </span>
              </div>

              <div className="space-y-2 min-h-[60px] lg:min-h-[80px]">
                {stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => toggleSelect(opp.id)}
                    className={`bg-white rounded-lg p-2 lg:p-2.5 border cursor-pointer transition-all duration-150 ${
                      selected.includes(opp.id)
                        ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                        : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected.includes(opp.id)}
                        onChange={() => toggleSelect(opp.id)}
                        className="w-3.5 h-3.5 mt-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs lg:text-sm truncate">{opp.title}</div>
                        <div className="text-[10px] lg:text-xs text-gray-500 truncate">
                          {getClientName(opp.clientId)}
                        </div>
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
                            <div className="mt-2 flex items-center justify-center gap-1 text-[10px] bg-gray-50 text-gray-400 px-2 py-1 rounded w-full cursor-not-allowed">
                              <FolderOpen size={10} />
                              Project Exists
                            </div>
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

      {/* Selection Bar */}
      <div className={`fixed bottom-0 left-0 right-0 transition-all duration-300 z-20 ${
        selected.length > 0 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="bg-gray-900 text-white px-4 lg:px-6 py-3 flex items-center justify-center gap-2 lg:gap-4 shadow-2xl">
          <span className="text-xs lg:text-sm font-medium">
            {selected.length} selected
          </span>
          <div className="h-4 w-px bg-gray-600 hidden sm:block"></div>
          <button
            onClick={() => moveSelected('left')}
            disabled={!canMoveLeft()}
            className="flex items-center gap-1 px-2 lg:px-3 py-1.5 bg-gray-700 rounded text-xs lg:text-sm hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Move Left</span>
            <span className="sm:hidden">Left</span>
          </button>
          <button
            onClick={() => moveSelected('right')}
            disabled={!canMoveRight()}
            className="flex items-center gap-1 px-2 lg:px-3 py-1.5 bg-gray-700 rounded text-xs lg:text-sm hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Move Right</span>
            <span className="sm:hidden">Right</span>
            <ChevronRight size={14} />
          </button>
          <div className="h-4 w-px bg-gray-600 hidden sm:block"></div>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-white text-xs lg:text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Won Modal */}
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
