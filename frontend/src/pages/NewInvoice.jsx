import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { create, fetchAll } from '../api'
import { ArrowLeft, Plus, X } from 'lucide-react'

function generateId() {
  return 'inv_' + Date.now()
}

function NewInvoice() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState(() => {
    const base = {
      clientId: '',
      projectId: '',
      invoiceNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      lineItems: [{ description: '', amount: '' }],
    }
    const clientId = searchParams.get('clientId')
    if (!clientId) return base
    return {
      ...base,
      clientId,
      projectId: searchParams.get('projectId') || '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lineItems: [
        {
          description: searchParams.get('desc') || '',
          amount: searchParams.get('amount') || '',
        },
      ],
    }
  })

  useEffect(() => {
    async function load() {
      try {
        const [clientData, projData] = await Promise.all([
          fetchAll('clients'),
          fetchAll('projects'),
        ])
        setClients(clientData)
        setProjects(projData)
      } catch (err) {
        console.error('Failed to load invoice data', err)
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
      ...(name === 'clientId' ? { projectId: '' } : {}),
    }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

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
    setErrors((prev) => ({ ...prev, lineItems: '' }))
  }

  function removeLineItem(index) {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }))
  }

  const subtotal = form.lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  )
  const taxTotal = Math.round(subtotal * 0.18)
  const grandTotal = subtotal + taxTotal

  async function handleSubmit(e) {
    e.preventDefault()

    const nextErrors = {}
    if (!form.clientId) nextErrors.clientId = 'Client is required'
    if (!form.invoiceNumber.trim()) nextErrors.invoiceNumber = 'Invoice number is required'
    if (!form.dueDate) nextErrors.dueDate = 'Due date is required'
    const validItems = form.lineItems.filter((item) => item.description && item.amount)
    if (validItems.length === 0) nextErrors.lineItems = 'Add at least one line item'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const newInvoice = {
      id: generateId(),
      clientId: form.clientId,
      projectId: form.projectId || null,
      invoiceNumber: form.invoiceNumber,
      status: 'unpaid',
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      paidDate: null,
      lineItems: validItems,
      subtotal,
      tax: taxTotal,
      total: grandTotal,
    }

    try {
      await create('invoices', newInvoice)
      navigate('/invoices')
    } catch (err) {
      console.error('Failed to create invoice', err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link to="/invoices" className="text-white text-sm font-bold hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} />
        Back to Invoices
      </Link>

      <h2 className="text-xl lg:text-2xl font-bold mb-4 text-white uppercase">New Invoice</h2>

      <div className="bg-white rounded-lg shadow p-4 lg:p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select
                name="clientId"
                value={form.clientId}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.clientId ? 'border-red-400' : ''}`}
                required
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                disabled={!form.clientId}
              >
                <option value="">{form.clientId ? 'No project' : 'Select client first'}</option>
                {projects
                  .filter((p) => p.clientId === form.clientId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number *</label>
              <input
                type="text"
                name="invoiceNumber"
                value={form.invoiceNumber}
                onChange={handleChange}
                placeholder="INV-105"
                className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.invoiceNumber ? 'border-red-400' : ''}`}
                required
              />
              {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Issue Date *</label>
                <input
                  type="date"
                  name="issueDate"
                  value={form.issueDate}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date *</label>
                <input
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm ${errors.dueDate ? 'border-red-400' : ''}`}
                  required
                />
                {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Line Items *</label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add line item
                </button>
              </div>
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
                      aria-label="Remove line item"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {errors.lineItems && <p className="text-red-500 text-xs mt-1">{errors.lineItems}</p>}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 ml-auto max-w-xs">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tax (18%):</span>
                <span>₹{taxTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                <span>Total:</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Create Invoice
            </button>
            <Link
              to="/invoices"
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

export default NewInvoice
