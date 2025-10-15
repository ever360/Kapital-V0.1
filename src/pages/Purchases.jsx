import { useState } from 'react'
import { ShoppingBag, Plus, Calendar } from 'lucide-react'

export default function Purchases() {
  const samplePurchases = [
    { id: 1, date: '2024-10-15', supplier: 'Proveedor A', total: 500000, status: 'Completada', items: 15 },
    { id: 2, date: '2024-10-14', supplier: 'Proveedor B', total: 750000, status: 'Completada', items: 23 },
    { id: 3, date: '2024-10-13', supplier: 'Proveedor C', total: 320000, status: 'Pendiente', items: 8 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600 mt-1">Registra tus compras a proveedores</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Compra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Compras del mes</p>
          <p className="text-2xl font-bold text-gray-900">$1,570,000</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Total compras</p>
          <p className="text-2xl font-bold text-gray-900">3</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-orange-600">1</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Historial de Compras</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {samplePurchases.map(purchase => (
                <tr key={purchase.id}>
                  <td className="font-mono">#{purchase.id}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {purchase.date}
                    </div>
                  </td>
                  <td className="font-medium">{purchase.supplier}</td>
                  <td>{purchase.items} productos</td>
                  <td className="font-semibold">${purchase.total.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      purchase.status === 'Completada' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {purchase.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm">
                      Ver detalles
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
