import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { create, logActivity } from '../api'
import { ArrowLeft } from 'lucide-react'

const INDUSTRIES = ['Technology', 'Healthcare', 'Design', 'Finance', 'Retail']

function generateId() {
  return 'client_' + Date.now()
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function NewClient() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Technology',
    status: 'active',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (!form.email.trim()) nextErrors.email = 'Email is required'
    if (!form.company.trim()) nextErrors.company = 'Company is required'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const newClient = {
      id: generateId(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      industry: form.industry,
      status: form.status,
      createdAt: today(),
    }

    try {
      const saved = await create('clients', newClient)
      logActivity(
        'new_lead',
        `New lead: ${saved.name} (${saved.company})`,
        saved.id,
        'client'
      )
      navigate('/clients')
    } catch (err) {
      console.error('Failed to create client', err)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/clients" className="text-white text-sm font-bold hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} />
        Back to Clients
      </Link>

      <h2 className="text-xl lg:text-2xl font-bold mb-4 text-white uppercase">New Client</h2>

      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.name ? 'border-red-400' : ''}`}
                required
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.email ? 'border-red-400' : ''}`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Company *</label>
              <input
                type="text"
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Acme Corp"
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.company ? 'border-red-400' : ''}`}
                required
              />
              {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Add Client
            </button>
            <Link
              to="/clients"
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

export default NewClient
