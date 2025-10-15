import { Settings as SettingsIcon, Building2, Users, MapPin, Bell } from 'lucide-react'

export default function Settings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Configura tu sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">Información de la Empresa</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Empresa
              </label>
              <input
                type="text"
                className="input"
                placeholder="Mi Empresa S.A.S"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIT
              </label>
              <input
                type="text"
                className="input"
                placeholder="123456789-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                className="input"
                placeholder="Calle 123 #45-67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="text"
                className="input"
                placeholder="300-123-4567"
              />
            </div>
            <button className="btn btn-primary w-full">
              Guardar Cambios
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold">Sucursales</h2>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Sucursal Principal</p>
                  <p className="text-sm text-gray-600">Bogotá, Colombia</p>
                </div>
                <span className="badge badge-success">Activa</span>
              </div>
            </div>
            <button className="btn btn-secondary w-full">
              + Agregar Sucursal
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Usuarios</h2>
          </div>
          <p className="text-gray-600 mb-4">Gestiona los usuarios del sistema</p>
          <button className="btn btn-secondary w-full">
            Ver Usuarios
          </button>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold">Notificaciones</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Stock bajo</span>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Nuevas ventas</span>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm font-medium">Reportes diarios</span>
              <input type="checkbox" className="w-5 h-5" />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
