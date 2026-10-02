import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchById, fetchAll, create, update, logActivity } from '../api'
import { ArrowLeft, Download } from 'lucide-react'
import jsPDF from 'jspdf'

function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [client, setClient] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const projData = await fetchById('projects', id)
        setProject(projData)

        const [clientData, allTasks] = await Promise.all([
          fetchById('clients', projData.clientId),
          fetchAll('tasks'),
        ])
        setClient(clientData)
        setTasks(allTasks.filter((t) => t.projectId === id))
      } catch (err) {
        console.error('Failed to load project', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function toggleMilestone(index) {
    const wasDone = project.milestones[index].done
    const milestones = project.milestones.map((m, i) =>
      i === index ? { ...m, done: !m.done } : m
    )
    const doneCount = milestones.filter((m) => m.done).length
    const updated = {
      ...project,
      milestones,
      progress: Math.round((doneCount / milestones.length) * 100),
    }

    setProject(updated)
    try {
      await update('projects', id, updated)
      if (!wasDone) {
        logActivity(
          'milestone_done',
          `Project milestone completed: ${milestones[index].name} for ${project.title}`,
          id,
          'project'
        )
      }
    } catch (err) {
      console.error('Failed to update milestone', err)
    }
  }

  async function addTask(e) {
    e.preventDefault()
    if (!newTask.trim()) return

    const task = {
      id: 'task_' + Date.now(),
      projectId: id,
      title: newTask,
      status: 'todo',
      assignedTo: 'Me',
      dueDate: project.deadline,
      createdAt: new Date().toISOString().split('T')[0],
    }

    try {
      const saved = await create('tasks', task)
      setTasks((prev) => [...prev, saved])
      setNewTask('')
    } catch (err) {
      console.error('Failed to add task', err)
    }
  }

  async function toggleTask(task) {
    const updated = { ...task }
    updated.status = task.status === 'completed' ? 'todo' : 'completed'

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
    try {
      await update('tasks', task.id, updated)
      if (updated.status === 'completed' && task.status !== 'completed') {
        logActivity('task_completed', `Task completed: ${task.title}`, task.id, 'task')
      }
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      console.error('Failed to update task', err)
    }
  }

  async function changeStatus(newStatus) {
    const updated = { ...project, status: newStatus }
    setProject(updated)
    try {
      await update('projects', id, updated)
    } catch (err) {
      setProject(project)
      console.error('Failed to update project', err)
    }
  }

  async function createInvoice() {
    const opp = project.opportunityId
      ? await fetchById('opportunities', project.opportunityId).catch(() => null)
      : null

    const query = new URLSearchParams({
      clientId: project.clientId,
      projectId: project.id,
      desc: project.title,
      amount: opp ? String(opp.value) : '',
    })
    navigate(`/invoices/new?${query}`)
  }

  function downloadStatusReport() {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Project Status Report', 20, 20)

    doc.setFontSize(12)
    doc.text(`Project: ${project.title}`, 20, 35)
    doc.text(`Client: ${client?.name || 'Unknown'}`, 20, 45)
    doc.text(`Status: ${project.status.replace('_', ' ')}`, 20, 55)
    doc.text(`Progress: ${project.progress}%`, 20, 65)
    doc.text(`Deadline: ${project.deadline}`, 20, 75)
    doc.text(`Started: ${project.createdAt}`, 20, 85)

    doc.setFontSize(14)
    doc.text('Milestones', 20, 100)

    doc.setFontSize(11)
    let y = 110
    project.milestones.forEach((ms) => {
      doc.text(`${ms.done ? '[x]' : '[ ]'} ${ms.name}`, 25, y)
      y += 8
    })

    y += 10
    doc.setFontSize(14)
    doc.text('Tasks', 20, y)
    y += 10

    doc.setFontSize(11)
    if (tasks.length === 0) {
      doc.text('No tasks', 25, y)
    } else {
      tasks.forEach((task) => {
        doc.text(`${task.status === 'completed' ? '[x]' : '[ ]'} ${task.title} (due: ${task.dueDate})`, 25, y)
        y += 8
      })
    }

    doc.save(`${project.title.replace(/\s+/g, '_')}_status_report.pdf`)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!project) {
    return <div className="text-center py-12 text-gray-500">Project not found</div>
  }

  return (
    <div>
      <Link to="/projects" className="text-white text-sm font-bold hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} />
        Back to Projects
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white uppercase">{project.title}</h2>
            <p className="text-gray-500 text-sm">Client: {client?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={createInvoice}
              className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 transition-colors"
            >
              Create Invoice
            </button>
            <button
              onClick={downloadStatusReport}
              className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
            >
              <Download size={14} />
              Report
            </button>
            <span className={`text-xs px-3 py-1 rounded-full ${
              project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
              project.status === 'completed' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-400">Deadline</div>
            <div className="text-sm font-medium">{project.deadline}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Progress</div>
            <div className="text-sm font-medium">{project.progress}%</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Started</div>
            <div className="text-sm font-medium">{project.createdAt}</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>

        <div className="flex gap-2">
          {project.status !== 'in_progress' && (
            <button
              onClick={() => changeStatus('in_progress')}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100"
            >
              In Progress
            </button>
          )}
          {project.status !== 'completed' && (
            <button
              onClick={() => changeStatus('completed')}
              className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100"
            >
              Completed
            </button>
          )}
          {project.status !== 'on_hold' && (
            <button
              onClick={() => changeStatus('on_hold')}
              className="text-xs bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded hover:bg-yellow-100"
            >
              On Hold
            </button>
          )}
          {project.status !== 'cancelled' && (
            <button
              onClick={() => changeStatus('cancelled')}
              className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100"
            >
              Cancelled
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-4">Milestones</h3>
          <div className="space-y-2">
            {project.milestones.map((ms, index) => (
              <label
                key={index}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                  ms.done ? 'line-through text-gray-400' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={ms.done}
                  onChange={() => toggleMilestone(index)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{ms.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-bold mb-4">Tasks</h3>
          <form onSubmit={addTask} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a task..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </form>
          <div className="space-y-2">
            {tasks.map((task) => (
              <label
                key={task.id}
                className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                  task.status === 'completed' ? 'line-through text-gray-400' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => toggleTask(task)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <span className="text-sm">{task.title}</span>
                  <span className="text-xs text-gray-400 ml-2">due {task.dueDate}</span>
                </div>
              </label>
            ))}
            {tasks.length === 0 && (
              <p className="text-gray-400 text-sm">No tasks yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail
