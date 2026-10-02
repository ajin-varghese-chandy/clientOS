import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchAll, update } from '../api'
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Receipt,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const INDUSTRIES = ['All', 'Technology', 'Healthcare', 'Design', 'Finance', 'Retail']

const STATUS_META = {
  active: {
    label: 'Active',
    badge: 'bg-green-100 text-green-700',
    bar: 'bg-green-500',
    accent: 'border-l-green-500',
  },
  inactive: {
    label: 'Inactive',
    badge: 'bg-gray-100 text-gray-600',
    bar: 'bg-gray-400',
    accent: 'border-l-gray-300',
  },
}

const STATUS_ORDER = ['active', 'inactive']

function Clients() {
  const [clients, setClients] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industry, setIndustry] = useState('All')
  const [status, setStatus] = useState('All')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    async function load() {
      try {
        const [clientData, invoiceData] = await Promise.all([
          fetchAll('clients'),
          fetchAll('invoices'),
        ])
        setClients(clientData)
        setInvoices(invoiceData)
      } catch (err) {
        console.error('Failed to load clients', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const revenueByClient = invoices
    .filter((i) => i.status === 'paid')
    .reduce((map, i) => {
      map[i.clientId] = (map[i.clientId] || 0) + i.total
      return map
    }, {})

  const invoicesByClient = invoices.reduce((map, i) => {
    map[i.clientId] = (map[i.clientId] || 0) + 1
    return map
  }, {})

  const paidByClient = invoices
    .filter((i) => i.status === 'paid')
    .reduce((map, i) => {
      map[i.clientId] = (map[i.clientId] || 0) + 1
      return map
    }, {})

  async function changeStatus(client, newStatus) {
    const updated = { ...client, status: newStatus }
    setClients((prev) => prev.map((c) => (c.id === client.id ? updated : c)))
    try {
      await update('clients', client.id, updated)
    } catch (err) {
      setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)))
      console.error('Failed to update client', err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const counts = clients.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  const activeCount = counts.active || 0

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
    if (sortBy === 'revenue') return (revenueByClient[b.id] || 0) - (revenueByClient[a.id] || 0)
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt)
    return 0
  })

  const filterChips = [
    { key: 'All', label: 'All', count: clients.length },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] || 0 })),
  ]

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Clients</h2>
          <p className="text-xs lg:text-sm text-white/60 mt-0.5">
            {activeCount} active · {clients.length} total
          </p>
        </div>
        <Link
          to="/clients/new"
          className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Client</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-3 mb-4 lg:mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setStatus(chip.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                status === chip.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 text-gray-600 border border-gray-200 hover:bg-white'
              }`}
            >
              {chip.label}
              <span className={`ml-1.5 ${status === chip.key ? 'text-white/80' : 'text-gray-400'}`}>
                {chip.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-2 text-sm"
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind === 'All' ? 'All Industries' : ind}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white rounded-lg shadow-sm border border-gray-100 px-3 py-2 text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="revenue">Sort by Revenue</option>
            <option value="date">Sort by Date</option>
          </select>
          <div className="relative sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white rounded-lg shadow-sm border border-gray-100 pl-8 pr-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Users size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium text-sm">
            {clients.length === 0 ? 'No clients yet' : 'No clients match your filters'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {clients.length === 0
              ? 'Add a client to start tracking work and revenue'
              : 'Try a different status, industry or search term'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {filtered.map((client) => {
            const meta = STATUS_META[client.status] || {
              label: client.status,
              badge: 'bg-gray-100 text-gray-600',
              bar: 'bg-gray-400',
              accent: 'border-l-gray-300',
            }
            const revenue = revenueByClient[client.id] || 0
            const invCount = invoicesByClient[client.id] || 0
            const paidCount = paidByClient[client.id] || 0

            return (
              <div
                key={client.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${meta.accent} p-4 hover:shadow-md transition-shadow duration-200 flex flex-col`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <Link
                    to={`/clients/${client.id}`}
                    className="font-bold text-gray-900 hover:text-blue-600 text-sm truncate transition-colors"
                  >
                    {client.name}
                  </Link>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                <span className="text-xs text-gray-500 truncate">{client.company}</span>

                <div className="mt-3 mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span className="font-medium">Revenue</span>
                    <span>
                      {paidCount}/{invCount} paid
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{revenue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building2 size={11} />
                    {client.industry}
                  </span>
                  <span className="flex items-center gap-1 min-w-0">
                    <Mail size={11} />
                    <span className="truncate">{client.email}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 bg-gray-100 text-gray-500">
                    <Receipt size={10} />
                    {invCount} invoice{invCount === 1 ? '' : 's'}
                  </span>
                  <Link
                    to={`/clients/${client.id}`}
                    className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    Open <ArrowRight size={11} />
                  </Link>
                </div>

                <div className="flex gap-1 flex-wrap mt-auto">
                  {client.status !== 'active' && (
                    <button
                      onClick={() => changeStatus(client, 'active')}
                      className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={10} />
                      Active
                    </button>
                  )}
                  {client.status !== 'inactive' && (
                    <button
                      onClick={() => changeStatus(client, 'inactive')}
                      className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      Inactive
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

export default Clients
