import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, Search, Eye, FolderPlus, Tag, X, TrendingUp, ShoppingCart, RotateCcw, AlertTriangle, DollarSign } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function Inventory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showDetalleModal, setShowDetalleModal] = useState(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [sucursalId, setSucursalId] = useState(null)
  
  const [categoriaForm, setCategoriaForm] = useState({
    nombre: ''
  })

  useEffect(() => {
    inicializar()
  }, [])

  const inicializar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single()

      if (userData?.sucursal_id) {
        setSucursalId(userData.sucursal_id)
        await Promise.all([
          cargarInventario(userData.sucursal_id),
          cargarCategorias(userData.sucursal_id)
        ])
      }
    } catch (err) {
      console.error('Error al inicializar:', err)
    }
  }

  const cargarInventario = async (sucId) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('sucursal_id', sucId)
        .order('categoria')

      if (error) throw error
      
      setProductos(data || [])
      
    } catch (err) {
      console.error('Error al cargar inventario:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarCategorias = async (sucId) => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('sucursal_id', sucId)
        .order('nombre')

      if (error) throw error
      setCategorias(data || [])
    } catch (err) {
      console.error('Error al cargar categorías:', err)
    }
  }

  const crearCategoria = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('categorias')
        .insert({
          sucursal_id: sucursalId,
          nombre: categoriaForm.nombre,
          id_categoria: `CAT-${Date.now()}`
        })

      if (error) throw error

      alert('✅ Categoría creada')
      setCategoriaForm({ nombre: '' })
      await cargarCategorias(sucursalId)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  // Agrupar productos por categoría
  const agruparPorCategoria = () => {
    const grupos = {}
    
    productos.forEach(prod => {
      const cat = prod.categoria || 'Sin categoría'
      
      if (!grupos[cat]) {
        grupos[cat] = {
          categoria: cat,
          productos: [],
          productosSegunda: [],
          totales: {
            cantidad: 0,
            stockInicial: 0,
            compras: 0,
            ventas: 0,
            devoluciones: 0,
            valorCompra: 0,
            valorVenta: 0,
            utilidad: 0
          }
        }
      }
      
      // Separar primera de segunda
      if (prod.incluye_segundas || prod.categoria?.toLowerCase().includes('segunda')) {
        grupos[cat].productosSegunda.push(prod)
      } else {
        grupos[cat].productos.push(prod)
      }
      
      // Acumular totales
      grupos[cat].totales.cantidad += prod.stock_actual || 0
      grupos[cat].totales.stockInicial += prod.stock_inicial || 0
      grupos[cat].totales.compras += prod.compras || 0
      grupos[cat].totales.ventas += prod.ventas || 0
      grupos[cat].totales.devoluciones += prod.devoluciones || 0
      grupos[cat].totales.valorCompra += (prod.precio_compra || 0) * (prod.stock_actual || 0)
      grupos[cat].totales.valorVenta += (prod.precio_venta || 0) * (prod.stock_actual || 0)
      grupos[cat].totales.utilidad += (prod.utilidad_articulo || 0) * (prod.stock_actual || 0)
    })
    
    return Object.values(grupos)
  }

  const verDetalle = (grupo) => {
    setCategoriaSeleccionada(grupo)
    setShowDetalleModal(true)
  }

  const gruposFiltrados = agruparPorCategoria().filter(g =>
    g.categoria.toLowerCase().includes(search.toLowerCase())
  )

  const calcularEstadisticas = () => {
    const grupos = agruparPorCategoria()
    return {
      totalCategorias: grupos.length,
      totalProductos: productos.length,
      stockTotal: productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0),
      valorTotal: productos.reduce((sum, p) => sum + ((p.precio_compra || 0) * (p.stock_actual || 0)), 0)
    }
  }

  const stats = calcularEstadisticas()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Inventario por Categorías</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Vista agrupada con detalle</p>
        </div>
        <button 
          onClick={() => setShowCategoriaModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FolderPlus className="w-5 h-5" />
          Gestionar Categorías
        </button>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categorías</p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.totalCategorias}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Productos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProductos}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stock Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.stockTotal}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${stats.valorTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar categorías..."
          />
        </div>
      </div>

      {/* Lista de categorías agrupadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gruposFiltrados.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {search ? 'No se encontraron categorías' : 'No hay productos en inventario'}
            </p>
          </div>
        ) : (
          gruposFiltrados.map((grupo, idx) => (
            <div key={idx} className="card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => verDetalle(grupo)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {grupo.categoria}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {grupo.productos.length + grupo.productosSegunda.length} productos
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Eye className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Stock actual:</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                    {grupo.totales.cantidad} unidades
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Valor inventario:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    ${grupo.totales.valorCompra.toLocaleString()}
                  </span>
                </div>
              </div>

              {grupo.productosSegunda.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-2">
                  <p className="text-xs text-orange-800 dark:text-orange-400 font-medium">
                    ⚠️ Incluye {grupo.productosSegunda.length} productos de segunda
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Compras</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    +{grupo.totales.compras}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ventas</p>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    -{grupo.totales.ventas}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Devol.</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {grupo.totales.devoluciones}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de gestión de categorías */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Gestionar Categorías
              </h3>
              <button 
                onClick={() => setShowCategoriaModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={crearCategoria} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva categoría
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={categoriaForm.nombre}
                  onChange={(e) => setCategoriaForm({ nombre: e.target.value })}
                  className="input flex-1"
                  placeholder="Ej: Estructura, Electrónica, etc."
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Categorías existentes ({categorias.length})
              </p>
              {categorias.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay categorías creadas
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {categorias.map(cat => (
                    <div 
                      key={cat.id}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <Tag className="w-4 h-4 text-primary-600" />
                      <span className="font-medium text-gray-900 dark:text-gray-100 flex-1">
                        {cat.nombre}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de categoría */}
      {showDetalleModal && categoriaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Detalle: {categoriaSeleccionada.categoria}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {categoriaSeleccionada.productos.length + categoriaSeleccionada.productosSegunda.length} productos en total
                </p>
              </div>
              <button 
                onClick={() => setShowDetalleModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dashboard de totales */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Stock Inicial</p>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {categoriaSeleccionada.totales.stockInicial}
                </p>
              </div>

              <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Compras</p>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{categoriaSeleccionada.totales.compras}
                </p>
              </div>

              <div className="card bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Ventas</p>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  -{categoriaSeleccionada.totales.ventas}
                </p>
              </div>

              <div className="card bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <RotateCcw className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Devoluciones</p>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {categoriaSeleccionada.totales.devoluciones}
                </p>
              </div>

              <div className="card bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Stock Actual</p>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {categoriaSeleccionada.totales.cantidad}
                </p>
              </div>

              <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Valor Total</p>
                </div>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${categoriaSeleccionada.totales.valorCompra.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Lista de productos de primera */}
            {categoriaSeleccionada.productos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Productos ({categoriaSeleccionada.productos.length})
                </h4>
                <div className="card overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                        <th>P. Compra</th>
                        <th>P. Venta</th>
                        <th>Ventas</th>
                        <th>Compras</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {categoriaSeleccionada.productos.map(prod => (
                        <tr key={prod.id}>
                          <td className="font-mono text-sm">{prod.codigo_articulo}</td>
                          <td className="font-medium">{prod.nombre}</td>
                          <td>
                            <span className={`badge ${
                              prod.stock_actual > prod.alerta_stock ? 'badge-success' : 'badge-warning'
                            }`}>
                              {prod.stock_actual || 0}
                            </span>
                          </td>
                          <td>${(prod.precio_compra || 0).toLocaleString()}</td>
                          <td className="font-semibold text-primary-600">
                            ${(prod.precio_venta || 0).toLocaleString()}
                          </td>
                          <td>{prod.ventas || 0}</td>
                          <td>{prod.compras || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Lista de productos de segunda */}
            {categoriaSeleccionada.productosSegunda.length > 0 && (
              <div>
                <h4 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Materiales de Segunda ({categoriaSeleccionada.productosSegunda.length})
                </h4>
                <div className="card overflow-x-auto bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                        <th>P. Compra</th>
                        <th>P. Venta</th>
                        <th>Calidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-200 dark:divide-orange-800">
                      {categoriaSeleccionada.productosSegunda.map(prod => (
                        <tr key={prod.id}>
                          <td className="font-mono text-sm">{prod.codigo_articulo}</td>
                          <td className="font-medium">{prod.nombre}</td>
                          <td>
                            <span className="badge badge-warning">
                              {prod.stock_actual || 0}
                            </span>
                          </td>
                          <td>${(prod.precio_compra || 0).toLocaleString()}</td>
                          <td className="font-semibold">
                            ${(prod.precio_venta || 0).toLocaleString()}
                          </td>
                          <td>
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              Segunda
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
