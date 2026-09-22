import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll, create } from '../api'
import { Plus } from 'lucide-react'

const INDUSTRIES = ['All', 'Technology', 'Healthcare', 'Design', 'Finance', 'Retail']
const STATUSES = ['All', 'active', 'inactive']

function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All')
  const [status, setStatus] = useState('All')
  const [sortBy, setSortBy] = useState('name')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: 'Technology',
    status: 'active',
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

    const newClient = {
      id: 'client_' + Date.now(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      industry: form.industry,
      status: form.status,
      totalRevenue: 0,
      createdAt: new Date().toISOString().split('T')[0],
    }

    try {
      const saved = await create('clients', newClient)
      setClients((prev) => [...prev, saved])
      setShowForm(false)
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        industry: 'Technology',
        status: 'active',
      })
    } catch (err) {
      console.error('Failed to create client', err)
    }
  }

  let filtered = clients.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = industry === 'All' || c.industry === industry
    const matchStatus = status === 'All' || c.status === status
    return matchSearch && matchIndustry && matchStatus
  })

  filtered.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt)
    return 0
  })

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Clients</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 lg:gap-2 transition-colors"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Client</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Add Client Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Add Client</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
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
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Industry</label>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  {INDUSTRIES.filter((i) => i !== 'All').map((ind) => (
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
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
              >
                Add Client
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-3 lg:p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind === 'All' ? 'All Industries' : ind}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="date">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Name</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Company</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Industry</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-500">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3">
                  <Link to={`/clients/${client.id}`} className="text-blue-600 hover:underline font-medium text-sm">
                    {client.name}
                  </Link>
                  <div className="text-xs text-gray-400">{client.email}</div>
                </td>
                <td className="px-6 py-3 text-sm">{client.company}</td>
                <td className="px-6 py-3 text-sm">{client.industry}</td>
                <td className="px-6 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-right font-medium">
                  ₹{client.totalRevenue.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-2">
        {filtered.map((client) => (
          <Link
            key={client.id}
            to={`/clients/${client.id}`}
            className="block bg-white rounded-lg shadow p-3 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="min-w-0">
                <div className="font-medium text-sm text-blue-600">{client.name}</div>
                <div className="text-xs text-gray-500 truncate">{client.company}</div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {client.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{client.industry}</span>
              <span className="font-medium">₹{client.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">No clients found</div>
      )}
    </div>
  )
}

export default Clients
