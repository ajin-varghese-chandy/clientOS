const INDUSTRIES = ['Technology', 'Healthcare', 'Design', 'Finance', 'Retail']

function ClientPicker({
  clients = [],
  mode,
  onModeChange,
  clientId,
  onClientIdChange,
  newClient,
  onNewClientChange,
  errors = {},
}) {
  const modeBtn = (value) =>
    `px-2.5 py-1 font-medium transition-colors ${
      mode === value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
    }`

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium">Client *</label>
        <div className="flex rounded-lg border overflow-hidden text-xs">
          <button type="button" onClick={() => onModeChange('existing')} className={modeBtn('existing')}>
            Existing
          </button>
          <button
            type="button"
            onClick={() => onModeChange('new')}
            className={`${modeBtn('new')} border-l`}
          >
            + New
          </button>
        </div>
      </div>

      {mode === 'existing' ? (
        <>
          <select
            name="clientId"
            value={clientId}
            onChange={onClientIdChange}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.company ? ` - ${c.company}` : ''}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No clients yet — switch to “+ New” to add one.
            </p>
          )}
          {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId}</p>}
        </>
      ) : (
        <div className="border rounded-lg p-3 space-y-3 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={newClient.name}
                onChange={onNewClientChange}
                placeholder="John Doe"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={newClient.company}
                onChange={onNewClientChange}
                placeholder="Acme Corp"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={newClient.email}
                onChange={onNewClientChange}
                placeholder="john@example.com"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={newClient.phone}
                onChange={onNewClientChange}
                placeholder="+91 98765 43210"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
            <select
              name="industry"
              value={newClient.industry}
              onChange={onNewClientChange}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>
          {errors.clientName && <p className="text-red-500 text-xs">{errors.clientName}</p>}
        </div>
      )}
    </div>
  )
}

export default ClientPicker
