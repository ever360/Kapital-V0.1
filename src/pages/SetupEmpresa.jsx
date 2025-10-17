import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { Building2, MapPin, CheckCircle, ArrowRight } from 'lucide-react'

export default function SetupEmpresa() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    // Datos empresa
    nombre_empresa: '',
    nit_empresa: '',
    direccion_empresa: '',
    telefono_empresa: '',
    email_empresa: '',
    tipo_negocio: 'retail',
    
    // Datos sucursal principal
    nombre_sucursal: '',
    direccion_sucursal: '',
    telefono_sucursal: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Crear empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .insert({
          nombre: formData.nombre_empresa,
          nit: formData.nit_empresa,
          direccion: formData.direccion_empresa,
          telefono: formData.telefono_empresa,
          email: formData.email_empresa,
          propietario_id: user.id,
          sucursales_contratadas: 1, // Plan inicial: 1 sucursal gratis
          fecha_vencimiento_plan: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días de prueba
        })
        .select()
        .single()

      if (empresaError) throw empresaError

      // 2. Crear configuración de empresa
      const { error: configError } = await supabase
        .from('configuracion_empresa')
        .insert({
          empresa_id: empresa.id,
          tipo_negocio: formData.tipo_negocio
        })

      if (configError) console.error('Error config:', configError)

      // 3. Crear sucursal principal
      const { data: sucursal, error: sucursalError } = await supabase
        .from('sucursales')
        .insert({
          empresa_id: empresa.id,
          nombre: formData.nombre_sucursal || 'Principal',
          direccion: formData.direccion_sucursal || formData.direccion_empresa,
          telefono: formData.telefono_sucursal || formData.telefono_empresa,
          nit_sucursal: formData.nit_empresa,
          estado: 'activa',
          orden: 1
        })
        .select()
        .single()

      if (sucursalError) throw sucursalError

      // 4. Actualizar usuario con empresa y sucursal
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          empresa_id: empresa.id,
          sucursal_id: sucursal.id,
          es_propietario: true,
          primer_login: false
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 5. Éxito - redirigir al dashboard
      setPaso(3)
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)

    } catch (err) {
      console.error('Error al configurar empresa:', err)
      setError(err.message || 'Error al configurar la empresa')
    } finally {
      setLoading(false)
    }
  }

  if (paso === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ¡Empresa configurada!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirigiendo al sistema...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-900 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Configurar mi empresa
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Paso {paso} de 2
            </p>
          </div>

          {/* Indicador de pasos */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${paso >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${paso >= 1 ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Empresa</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300 mx-4"></div>
            <div className={`flex items-center ${paso >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${paso >= 2 ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Sucursal</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Paso 1: Datos de la empresa */}
            {paso === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Datos de tu empresa
                  </h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de negocio
                  </label>
                  <select
                    name="tipo_negocio"
                    value={formData.tipo_negocio}
                    onChange={handleChange}
                    className="input"
                    required
                  >
                    <option value="retail">Retail / Comercio</option>
                    <option value="taller">Taller / Mecánica</option>
                    <option value="construccion">Construcción / PVC</option>
                    <option value="servicios">Servicios</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la empresa *
                  </label>
                  <input
                    type="text"
                    name="nombre_empresa"
                    value={formData.nombre_empresa}
                    onChange={handleChange}
                    className="input"
                    placeholder="Mi Empresa S.A.S"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      NIT
                    </label>
                    <input
                      type="text"
                      name="nit_empresa"
                      value={formData.nit_empresa}
                      onChange={handleChange}
                      className="input"
                      placeholder="123456789-0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="telefono_empresa"
                      value={formData.telefono_empresa}
                      onChange={handleChange}
                      className="input"
                      placeholder="300-123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="direccion_empresa"
                    value={formData.direccion_empresa}
                    onChange={handleChange}
                    className="input"
                    placeholder="Calle 123 #45-67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email_empresa"
                    value={formData.email_empresa}
                    onChange={handleChange}
                    className="input"
                    placeholder="contacto@empresa.com"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPaso(2)}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  Siguiente
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Paso 2: Datos de sucursal principal */}
            {paso === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-6 h-6 text-primary-600" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Sucursal principal
                  </h2>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-400">
                    <strong>Plan de prueba:</strong> Incluye 1 sucursal gratis por 15 días.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la sucursal
                  </label>
                  <input
                    type="text"
                    name="nombre_sucursal"
                    value={formData.nombre_sucursal}
                    onChange={handleChange}
                    className="input"
                    placeholder="Principal (opcional)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Si no especificas, se llamará "Principal"
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Dirección de la sucursal
                  </label>
                  <input
                    type="text"
                    name="direccion_sucursal"
                    value={formData.direccion_sucursal}
                    onChange={handleChange}
                    className="input"
                    placeholder={formData.direccion_empresa || "Misma dirección de la empresa"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono de la sucursal
                  </label>
                  <input
                    type="text"
                    name="telefono_sucursal"
                    value={formData.telefono_sucursal}
                    onChange={handleChange}
                    className="input"
                    placeholder={formData.telefono_empresa || "Mismo teléfono de la empresa"}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPaso(1)}
                    className="flex-1 btn btn-secondary"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn btn-primary"
                  >
                    {loading ? 'Configurando...' : 'Finalizar configuración'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
