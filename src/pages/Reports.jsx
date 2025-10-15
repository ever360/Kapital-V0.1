import { useState } from 'react'
import { FileText, Calendar, DollarSign, TrendingUp, Download } from 'lucide-react'

export default function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const reportTypes = [
    { name: 'Reporte de Ventas', description: 'Ventas por período', icon: TrendingUp, color: 'bg-green-500' },
    { name: 'Cierre de Caja', description: 'Cierre diario', icon: DollarSign, color: 'bg-blue-500' },
    { name: 'Inventario', description: 'Estado del stock', icon: FileText, color: 'bg-purple-500' },
    { name: 'Compras', description: 'Reporte de compras', icon: Calendar, color: 'bg-orange-500' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">Genera reportes y análisis de tu negocio</p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Filtrar por Fecha</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary w-full">
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {reportTypes.map((report, index) => (
          <div key={index} className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`${report.color} p-3 rounded-lg`}>
                  <report.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{report.name}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Generar Reporte
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Cierre de Caja Actual</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Efectivo inicial</p>
            <p className="text-xl font-bold">$50,000</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Ventas en efectivo</p>
            <p className="text-xl font-bold text-green-600">$250,000</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Ventas con tarjeta</p>
            <p className="text-xl font-bold text-blue-600">$180,000</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total esperado</p>
            <p className="text-xl font-bold text-purple-600">$300,000</p>
          </div>
        </div>
        <button className="btn btn-success flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Cerrar Caja
        </button>
      </div>
    </div>
  )
}
