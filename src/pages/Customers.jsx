import { useState } from 'react'
import { Users, Plus, Search, Edit, Trash2, Phone, Mail } from 'lucide-react'

export default function Customers() {
  const [search, setSearch] = useState('')

  const sampleCustomers = [
    { id: 1, name: 'Juan Pérez', document: '1234567890', phone: '300-123-4567', email: 'juan@email.com', purchases: 15 },
    { id: 2, name: 'María García', document: '0987654321', phone: '310-987-6543', email: 'maria@email.com', purchases: 8 },
    { id: 3, name: 'Carlos Rodríguez', document: '1122334455', phone: '320-555-1234', email: 'carlos@email.com', purchases: 23 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Gestiona tu base de clientes</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold">{sampleCustomers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Clientes nuevos (mes)</p>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Compras promedio</p>
          <p className="text-2xl font-bold text-gray-900">15.3</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar clientes por nombre o documento..."
          />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Compras</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleCustomers.map(customer => (
                <tr key={customer.id}>
                  <td className="font-medium">{customer.name}</td>
                  <td className="font-mono text-sm">{customer.document}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {customer.phone}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {customer.email}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{customer.purchases}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
