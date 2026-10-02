import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { create, fetchAll, logActivity } from '../api'
import ClientPicker from '../components/ClientPicker'

function NewOpportunity() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [clientMode, setClientMode] = useState('existing')
  const [form, setForm] = useState({
    clientId: '',
    title: '',
    value: '',
    probability: 50,
    expectedClose: '',
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

  function validateStep1() {
    const newErrors = {}
    if (clientMode === 'existing' && !form.clientId) {
      newErrors.clientId = 'Please select a client'
    }
    if (clientMode === 'new' && !newClient.name.trim()) {
      newErrors.clientName = 'Client name is required'
    }
    if (!form.title.trim()) newErrors.title = 'Title is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function validateStep2() {
    const newErrors = {}
    if (!form.value || Number(form.value) <= 0) newErrors.value = 'Enter a valid amount'
    if (!form.expectedClose) newErrors.expectedClose = 'Pick a date'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function nextStep() {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const selectedClient = clients.find((c) => c.id === form.clientId)
  const reviewClientName =
    clientMode === 'new'
      ? newClient.name + (newClient.company ? ` (${newClient.company})` : '')
      : selectedClient?.name || '—'

  async function handleSubmit() {
    try {
      let clientId = form.clientId
      let clientName = selectedClient?.name || ''

      if (clientMode === 'new') {
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

      const newOpp = {
        id: 'opp_' + Date.now(),
        clientId,
        title: form.title,
        value: Number(form.value),
        probability: Number(form.probability),
        stage: 'lead',
        expectedClose: form.expectedClose,
        createdAt: new Date().toISOString().split('T')[0],
      }

      await create('opportunities', newOpp)
      logActivity('new_lead', `New lead: ${form.title} — ${clientName}`, clientId, 'client')
      navigate('/pipeline')
    } catch (err) {
      console.error('Failed to create opportunity', err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-white">New Opportunity</h2>

      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {step === 1 && (
          <div>
            <h3 className="font-bold mb-4">Client & Project Info</h3>
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
              <div>
                <label className="block text-sm font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Website Redesign"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 className="font-bold mb-4">Value & Timeline</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Value (₹) *</label>
                <input
                  type="number"
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  placeholder="e.g. 50000"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Probability: {form.probability}%
                </label>
                <input
                  type="range"
                  name="probability"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Close Date *</label>
                <input
                  type="date"
                  name="expectedClose"
                  value={form.expectedClose}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {errors.expectedClose && <p className="text-red-500 text-xs mt-1">{errors.expectedClose}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 className="font-bold mb-4">Review & Submit</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Client:</span>
                <span className="font-medium text-right">
                  {reviewClientName}
                  {clientMode === 'new' && (
                    <span className="ml-1.5 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full align-middle">
                      new
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Title:</span>
                <span className="font-medium">{form.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Value:</span>
                <span className="font-medium">₹{Number(form.value).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Probability:</span>
                <span className="font-medium">{form.probability}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Expected Close:</span>
                <span className="font-medium">{form.expectedClose}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={nextStep}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Create Opportunity
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default NewOpportunity
