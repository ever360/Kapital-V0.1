import { useState } from 'react'
import { TrendingUp, Calendar, DollarSign } from 'lucide-react'

export default function Sales() {
  const sampleSales = [
    { id: 1, date: '2024-10-15 14:30', customer: 'Cliente A', items: 5, total: 125000, payment: 'Efectivo' },
    { id: 2, date: '2024-10-15 13:15', customer: 'Cliente B', items: 3, total: 75000, payment: 'Tarjeta' },
    { id: 3, date: '2024-10-15 12:00', customer: 'Cliente C', items: 8, total: 200000, payment: 'Transferencia' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
        <p className="text-gray-600 mt-1">Historial de todas tus ventas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ventas hoy</p>
              <p className="text-2xl font-bold">$400,000</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total ventas</p>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Ticket promedio</p>
          <p className="text-2xl font-bold text-gray-900">$133,333</p>
        </div>
        
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Productos vendidos</p>
          <p className="text-2xl font-bold text-gray-900">16</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Historial de Ventas</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Método de Pago</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleSales.map(sale => (
                <tr key={sale.id}>
                  <td className="font-mono">#{sale.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {sale.date}
                    </div>
                  </td>
                  <td className="font-medium">{sale.customer}</td>
                  <td>{sale.items} productos</td>
                  <td className="font-semibold text-green-600">
                    ${sale.total.toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-info">{sale.payment}</span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm">
                      Ver ticket
                    </button>
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
