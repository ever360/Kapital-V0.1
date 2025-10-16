import { useState } from 'react'
import { Package, Plus, Search, Edit, Trash2 } from 'lucide-react'

export default function Inventory() {
  const [search, setSearch] = useState('')

  const sampleProducts = [
    { id: 1, sku: 'PROD001', name: 'Producto 1', category: 'Categoría A', stock: 50, cost: 8000, price: 10000 },
    { id: 2, sku: 'PROD002', name: 'Producto 2', category: 'Categoría B', stock: 30, cost: 20000, price: 25000 },
    { id: 3, sku: 'PROD003', name: 'Producto 3', category: 'Categoría A', stock: 15, cost: 12000, price: 15000 },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-1">Gestiona tus productos</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar productos por nombre o SKU..."
          />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Costo</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sampleProducts.map(product => (
                <tr key={product.id}>
                  <td className="font-mono text-sm">{product.sku}</td>
                  <td className="font-medium">{product.name}</td>
                  <td>{product.category}</td>
                  <td>
                    <span className={`badge ${
                      product.stock > 20 ? 'badge-success' : 
                      product.stock > 10 ? 'badge-warning' : 
                      'badge-danger'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>${product.cost.toLocaleString()}</td>
                  <td className="font-semibold text-primary-600">
                    ${product.price.toLocaleString()}
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
