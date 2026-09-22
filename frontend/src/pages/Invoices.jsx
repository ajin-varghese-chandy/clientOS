import { useState, useEffect } from 'react'
import { fetchAll, create, update } from '../api'
import { Download } from 'lucide-react'
import jsPDF from 'jspdf'

function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    clientId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    lineItems: [{ description: '', amount: '' }],
  })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
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
  }, [])

  function addLineItem() {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', amount: '' }],
    }))
  }

  function updateLineItem(index, field, value) {
    setForm((prev) => {
      const items = [...prev.lineItems]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, lineItems: items }
    })
  }

  function removeLineItem(index) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

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

  function calculateTotals() {
    const subtotal = form.lineItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    )
    const tax = Math.round(subtotal * 0.18)
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { subtotal, tax, total } = calculateTotals()

    const newInvoice = {
      id: 'inv_' + Date.now(),
      clientId: form.clientId,
      projectId: null,
      invoiceNumber: form.invoiceNumber,
      status: 'unpaid',
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      paidDate: null,
      lineItems: form.lineItems.filter((item) => item.description && item.amount),
      subtotal,
      tax,
      total,
    }

    try {
      const saved = await create('invoices', newInvoice)
      setInvoices((prev) => [...prev, saved])
      setShowForm(false)
      setForm({
        clientId: '',
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        lineItems: [{ description: '', amount: '' }],
      })
    } catch (err) {
      console.error('Failed to create invoice', err)
    }
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

      // Update client totalRevenue when invoice is paid
      if (newStatus === 'paid' && inv.status !== 'paid') {
        const client = clients.find((c) => c.id === inv.clientId)
        if (client) {
          const newRevenue = client.totalRevenue + inv.total
          await update('clients', client.id, { ...client, totalRevenue: newRevenue })
          setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, totalRevenue: newRevenue } : c)))
        }
      }
      // Deduct revenue when unmarking paid
      if (inv.status === 'paid' && newStatus !== 'paid') {
        const client = clients.find((c) => c.id === inv.clientId)
        if (client) {
          const newRevenue = client.totalRevenue - inv.total
          await update('clients', client.id, { ...client, totalRevenue: newRevenue })
          setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, totalRevenue: newRevenue } : c)))
        }
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

  const filtered = invoices.filter((inv) => {
    if (filter === 'all') return true
    return inv.status === filter
  })

  const { subtotal, tax, total } = calculateTotals()

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-bold text-white uppercase">Invoices</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {/* Create Invoice Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-bold mb-4">Create Invoice</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Client</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="INV-105"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date</label>
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Line Items</label>
              {form.lineItems.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                    placeholder="Amount"
                    className="w-32 border rounded-lg px-3 py-2 text-sm"
                  />
                  {form.lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(index)}
                      className="text-red-500 hover:text-red-700 px-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addLineItem}
                className="text-blue-600 text-sm hover:underline"
              >
                + Add line item
              </button>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 ml-auto max-w-xs">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tax (18%):</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                <span>Total:</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Create Invoice
            </button>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'unpaid', 'paid', 'overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-2 lg:space-y-3">
        {filtered.map((inv) => (
          <div key={inv.id} className="bg-white rounded-lg shadow p-3 lg:p-5">
            <div className="flex items-start justify-between mb-2 lg:mb-3">
              <div className="min-w-0">
                <div className="font-bold text-sm lg:text-base">{inv.invoiceNumber}</div>
                <div className="text-xs lg:text-sm text-gray-500 truncate">{getClientName(inv.clientId)}</div>
              </div>
              <div className="flex items-center gap-1.5 lg:gap-2 shrink-0 ml-2">
                <button
                  onClick={() => downloadInvoice(inv)}
                  className="flex items-center gap-1 text-[10px] lg:text-xs bg-gray-100 text-gray-600 px-1.5 lg:px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                >
                  <Download size={10} />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <span className={`text-[10px] lg:text-xs px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full ${
                  inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                  inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {inv.status}
                </span>
              </div>
            </div>

            <div className="text-xs lg:text-sm mb-2 lg:mb-3">
              {inv.lineItems.map((item, i) => (
                <div key={i} className="flex justify-between py-0.5 lg:py-1">
                  <span className="text-gray-600 truncate mr-2">{item.description}</span>
                  <span className="shrink-0">₹{item.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-2 lg:pt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] lg:text-xs text-gray-500">
                Due: {inv.dueDate}
                {inv.paidDate && <span className="ml-1 lg:ml-2">Paid: {inv.paidDate}</span>}
              </div>
              <div className="flex items-center gap-2 lg:gap-3">
                <span className="font-bold text-sm lg:text-base">₹{inv.total.toLocaleString('en-IN')}</span>
                <div className="flex gap-1">
                  {inv.status !== 'paid' && (
                    <button
                      onClick={() => markStatus(inv, 'paid')}
                      className="text-[10px] lg:text-xs bg-green-50 text-green-600 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded hover:bg-green-100 transition-colors"
                    >
                      Paid
                    </button>
                  )}
                  {inv.status !== 'unpaid' && (
                    <button
                      onClick={() => markStatus(inv, 'unpaid')}
                      className="text-[10px] lg:text-xs bg-yellow-50 text-yellow-600 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded hover:bg-yellow-100 transition-colors"
                    >
                      Unpaid
                    </button>
                  )}
                  {inv.status !== 'overdue' && (
                    <button
                      onClick={() => markStatus(inv, 'overdue')}
                      className="text-[10px] lg:text-xs bg-red-50 text-red-600 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded hover:bg-red-100 transition-colors"
                    >
                      Overdue
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">No invoices found</div>
      )}
    </div>
  )
}

export default Invoices
