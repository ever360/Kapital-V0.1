import { TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const stats = [
    { name: 'Ventas del día', value: '$1,234,567', icon: DollarSign, color: 'bg-green-500' },
    { name: 'Productos vendidos', value: '156', icon: ShoppingCart, color: 'bg-blue-500' },
    { name: 'Productos en stock', value: '1,234', icon: Package, color: 'bg-purple-500' },
    { name: 'Crecimiento', value: '+12.5%', icon: TrendingUp, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Bienvenido a Kapital POS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Ventas Recientes</h2>
          <p className="text-gray-500">No hay ventas recientes</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Productos con bajo stock</h2>
          <p className="text-gray-500">Todos los productos tienen stock suficiente</p>
        </div>
      </div>
    </div>
  )
}
