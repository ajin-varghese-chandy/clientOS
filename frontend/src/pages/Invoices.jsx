import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAll, update, logActivity } from '../api'
import {
  Receipt,
  Plus,
  Search,
  CalendarDays,
  Layers,
  FolderOpen,
  Download,
  CheckCircle2,
} from 'lucide-react'
import jsPDF from 'jspdf'

const STATUS_META = {
  unpaid: {
    label: 'Unpaid',
    badge: 'bg-yellow-100 text-yellow-700',
    bar: 'bg-yellow-500',
    accent: 'border-l-yellow-500',
  },
  paid: {
    label: 'Paid',
    badge: 'bg-green-100 text-green-700',
    bar: 'bg-green-500',
    accent: 'border-l-green-500',
  },
  overdue: {
    label: 'Overdue',
    badge: 'bg-red-100 text-red-700',
    bar: 'bg-red-500',
    accent: 'border-l-red-500',
  },
}

const STATUS_ORDER = ['unpaid', 'overdue', 'paid']

function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  return Math.round((d - t) / 86400000)
}

function dueLabel(days) {
  if (days === null) return { text: 'No due date', cls: 'bg-gray-100 text-gray-500' }
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, cls: 'bg-red-100 text-red-600' }
  if (days === 0) return { text: 'Due today', cls: 'bg-orange-100 text-orange-600' }
  return { text: `Due in ${days}d`, cls: days <= 7 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500' }
}

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const legacy = searchParams.toString()
    if (legacy) {
      navigate(`/invoices/new?${legacy}`, { replace: true })
      return
    }

    async function loadData() {
      try {
        const [invData, clientData] = await Promise.all([
          fetchAll('invoices'),
          fetchAll('clients'),
        ])
        setInvoices(invData)
        setClients(clientData)
      } catch (err) {
        console.error('Failed to load invoices', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [searchParams, navigate])

  function downloadInvoice(inv) {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('INVOICE', 20, 20)

    doc.setFontSize(12)
    doc.text(`Invoice #: ${inv.invoiceNumber}`, 20, 35)
    doc.text(`Client: ${getClientName(inv.clientId)}`, 20, 45)
    doc.text(`Status: ${inv.status}`, 20, 55)
    doc.text(`Issue Date: ${inv.issueDate}`, 20, 65)
    doc.text(`Due Date: ${inv.dueDate}`, 20, 75)
    if (inv.paidDate) {
      doc.text(`Paid Date: ${inv.paidDate}`, 20, 85)
    }

    doc.setFontSize(14)
    doc.text('Line Items', 20, 100)

    doc.setFontSize(11)
    let y = 110
    doc.text('Description', 25, y)
    doc.text('Amount', 140, y)
    y += 8
    doc.line(25, y, 180, y)
    y += 8

    inv.lineItems.forEach((item) => {
      doc.text(item.description, 25, y)
      doc.text(`Rs. ${item.amount.toLocaleString('en-IN')}`, 140, y)
      y += 8
    })

    y += 5
    doc.line(25, y, 180, y)
    y += 10

    doc.text(`Subtotal:`, 120, y)
    doc.text(`Rs. ${inv.subtotal.toLocaleString('en-IN')}`, 140, y)
    y += 8
    doc.text(`Tax (18%):`, 120, y)
    doc.text(`Rs. ${inv.tax.toLocaleString('en-IN')}`, 140, y)
    y += 8
    doc.setFontSize(13)
    doc.text(`Total:`, 120, y)
    doc.text(`Rs. ${inv.total.toLocaleString('en-IN')}`, 140, y)

    doc.save(`${inv.invoiceNumber}.pdf`)
  }

  async function markStatus(inv, newStatus) {
    const updated = { ...inv }
    updated.status = newStatus
    if (newStatus === 'paid') {
      updated.paidDate = new Date().toISOString().split('T')[0]
    } else {
      updated.paidDate = null
    }

    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updated : i)))
    try {
      await update('invoices', inv.id, updated)

      if (newStatus === 'paid' && inv.status !== 'paid') {
        logActivity(
          'invoice_paid',
          `Invoice ${inv.invoiceNumber} marked paid by ${getClientName(inv.clientId)}`,
          inv.id,
          'invoice'
        )
      }
    } catch (err) {
      setInvoices((prev) => prev.map((i) => (i.id === inv.id ? inv : i)))
      console.error('Failed to update invoice', err)
    }
  }

  function getClientName(clientId) {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : 'Unknown'
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const counts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1
    return acc
  }, {})

  const unpaidCount = counts.unpaid || 0
  const outstanding = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const filtered = invoices
    .filter((inv) => (filter === 'all' ? true : inv.status === filter))
    .filter((inv) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        getClientName(inv.clientId).toLowerCase().includes(q) ||
        inv.status.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      const rank = (s) => STATUS_ORDER.indexOf(s)
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status)
      return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')
    })

  const filterChips = [
    { key: 'all', label: 'All', count: invoices.length },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] || 0 })),
  ]

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Invoices</h2>
          <p className="text-xs lg:text-sm text-white/60 mt-0.5">
            {unpaidCount} unpaid · ₹{outstanding.toLocaleString('en-IN')} outstanding · {invoices.length} total
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <Plus size={14} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-3 mb-4 lg:mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-1">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === chip.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/90 text-gray-600 border border-gray-200 hover:bg-white'
              }`}
            >
              {chip.label}
              <span className={`ml-1.5 ${filter === chip.key ? 'text-white/80' : 'text-gray-400'}`}>
                {chip.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white rounded-lg shadow-sm border border-gray-100 pl-8 pr-3 py-2 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Receipt size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium text-sm">
            {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {invoices.length === 0
              ? 'Create an invoice to start billing clients'
              : 'Try a different status or search term'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
          {filtered.map((inv) => {
            const meta = STATUS_META[inv.status] || {
              label: inv.status,
              badge: 'bg-gray-100 text-gray-600',
              bar: 'bg-gray-400',
              accent: 'border-l-gray-300',
            }
            const days = daysUntil(inv.dueDate)
            const dl = dueLabel(days)
            const lineCount = inv.lineItems?.length || 0

            return (
              <div
                key={inv.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${meta.accent} p-4 hover:shadow-md transition-shadow duration-200 flex flex-col`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-bold text-gray-900 text-sm truncate">
                    {inv.invoiceNumber}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>

                <Link
                  to={`/clients/${inv.clientId}`}
                  className="text-xs text-gray-500 hover:text-blue-600 hover:underline truncate"
                >
                  {getClientName(inv.clientId)}
                </Link>

                <div className="mt-3 mb-2">
                  <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                    <span className="font-medium">Total</span>
                    <span>Tax 18% incl.</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{(inv.total || 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {lineCount} line item{lineCount === 1 ? '' : 's'}
                  </span>
                  {inv.status === 'paid' && inv.paidDate && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Paid {inv.paidDate}
                    </span>
                  )}
                  {inv.projectId && (
                    <Link
                      to={`/projects/${inv.projectId}`}
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <FolderOpen size={11} />
                      Project
                    </Link>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${dl.cls}`}>
                    <CalendarDays size={10} />
                    {dl.text}
                  </span>
                  <button
                    onClick={() => downloadInvoice(inv)}
                    className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    PDF <Download size={11} />
                  </button>
                </div>

                <div className="flex gap-1 flex-wrap mt-auto">
                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => markStatus(inv, 'paid')}
                      className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded-md hover:bg-green-100 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 size={10} />
                      Paid
                    </button>
                  )}
                  {inv.status !== 'unpaid' && (
                    <button
                      onClick={() => markStatus(inv, 'unpaid')}
                      className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-1 rounded-md hover:bg-yellow-100 transition-colors"
                    >
                      Unpaid
                    </button>
                  )}
                  {inv.status !== 'overdue' && (
                    <button
                      onClick={() => markStatus(inv, 'overdue')}
                      className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Overdue
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

export default Invoices
