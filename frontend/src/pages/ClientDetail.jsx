import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchById, fetchAll } from '../api'
import { ArrowLeft } from 'lucide-react'

function formatCurrency(amount) {
  return '₹' + amount.toLocaleString('en-IN')
}

function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const clientData = await fetchById('clients', id)
        setClient(clientData)

        const [allOpps, allInvoices] = await Promise.all([
          fetchAll('opportunities'),
          fetchAll('invoices'),
        ])
        setOpportunities(allOpps.filter((o) => o.clientId === id))
        setInvoices(allInvoices.filter((i) => i.clientId === id))
      } catch (err) {
        console.error('Failed to load client', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!client) {
    return <div className="text-center py-12 text-gray-500">Client not found</div>
  }

  return (
    <div>
      <Link to="/clients" className="text-white text-sm font-bold hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft size={14} />
        Back to Clients
      </Link>

      {/* Client Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white uppercase">{client.name}</h2>
            <p className="text-gray-500">{client.company}</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full ${
            client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {client.status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-xs text-gray-400">Email</div>
            <div className="text-sm">{client.email}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Phone</div>
            <div className="text-sm">{client.phone}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Industry</div>
            <div className="text-sm">{client.industry}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total Revenue</div>
            <div className="text-sm font-bold text-green-600">{formatCurrency(client.totalRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Opportunities */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Opportunities</h3>
        {opportunities.length === 0 ? (
          <p className="text-gray-400 text-sm">No opportunities yet</p>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div key={opp.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{opp.title}</div>
                  <div className="text-xs text-gray-400 capitalize">{opp.stage.replace('_', ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{formatCurrency(opp.value)}</div>
                  <div className="text-xs text-gray-400">{opp.probability}% probability</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-gray-400 text-sm">No invoices yet</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <div className="font-medium text-sm">{inv.invoiceNumber}</div>
                  <div className="text-xs text-gray-400">Due: {inv.dueDate}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm">{formatCurrency(inv.total)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetail
