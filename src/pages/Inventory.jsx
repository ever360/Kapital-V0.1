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
  const [showProductoModal, setShowProductoModal] = useState(false)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [sucursalId, setSucursalId] = useState(null)
  
  const [categoriaForm, setCategoriaForm] = useState({
    nombre: ''
  })

  const [productoForm, setProductoForm] = useState({
    nombre: '',
    codigo_articulo: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock_inicial: '',
    alerta_stock: '5',
    unidad_medida: 'unidad',
    incluye_segundas: false
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

  const crearProducto = async (e) => {
    e.preventDefault()
    
    try {
      // Validaciones
      if (!productoForm.nombre || !productoForm.codigo_articulo) {
        alert('⚠️ Nombre y código son obligatorios')
        return
      }

      const precioCompra = parseFloat(productoForm.precio_compra) || 0
      const precioVenta = parseFloat(productoForm.precio_venta) || 0
      const stockInicial = parseInt(productoForm.stock_inicial) || 0

      const nuevoProducto = {
        sucursal_id: sucursalId,
        nombre: productoForm.nombre,
        codigo_articulo: productoForm.codigo_articulo,
        categoria: productoForm.categoria || 'Sin categoría',
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        stock_inicial: stockInicial,
        stock_actual: stockInicial,
        alerta_stock: parseInt(productoForm.alerta_stock) || 5,
        unidad_medida: productoForm.unidad_medida,
        incluye_segundas: productoForm.incluye_segundas,
        utilidad_articulo: precioVenta - precioCompra,
        ventas: 0,
        compras: 0,
        devoluciones: 0
      }

      console.log('Creando producto:', nuevoProducto)

      const { data, error } = await supabase
        .from('inventario')
        .insert(nuevoProducto)
        .select()

      if (error) {
        console.error('Error de Supabase:', error)
        throw error
      }

      console.log('Producto creado:', data)
      alert('✅ Producto creado exitosamente')
      
      // Resetear formulario
      setProductoForm({
        nombre: '',
        codigo_articulo: '',
        categoria: '',
        precio_compra: '',
        precio_venta: '',
        stock_inicial: '',
        alerta_stock: '5',
        unidad_medida: 'unidad',
        incluye_segundas: false
      })
      
      setShowProductoModal(false)
      await cargarInventario(sucursalId)
      
    } catch (err) {
      console.error('Error completo:', err)
      alert('❌ Error al crear producto: ' + err.message)
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Inventario por Categorías
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Vista agrupada con detalle</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCategoriaModal(true)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FolderPlus className="w-5 h-5" />
            Categorías
          </button>
          <button 
            onClick={() => setShowProductoModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Producto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categorías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalCategorias}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Productos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalProductos}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.stockTotal}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${stats.valorTotal.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Lista de categorías */}
      <div className="space-y-4">
        {gruposFiltrados.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No hay productos en el inventario
            </p>
          </div>
        ) : (
          gruposFiltrados.map((grupo) => (
            <div key={grupo.categoria} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Tag className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {grupo.categoria}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {grupo.productos.length + grupo.productosSegunda.length} productos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => verDetalle(grupo)}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver detalle
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stock Inicial</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {grupo.totales.stockInicial}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Compras</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    +{grupo.totales.compras}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ventas</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    -{grupo.totales.ventas}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Devoluciones</p>
                  <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {grupo.totales.devoluciones}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stock Actual</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {grupo.totales.cantidad}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Valor Total</p>
                  <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                    ${grupo.totales.valorCompra.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========== MODAL DE CATEGORÍAS ========== */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Gestión de Categorías
              </h3>
              <button 
                onClick={() => setShowCategoriaModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={crearCategoria} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Nombre de la categoría"
                  value={categoriaForm.nombre}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, nombre: e.target.value })}
                  className="input flex-1"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Categorías existentes ({categorias.length})
              </h4>
              {categorias.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
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

      {/* ========== MODAL DE AGREGAR PRODUCTO ========== */}
      {showProductoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Agregar Nuevo Producto
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Complete los datos del producto
                </p>
              </div>
              <button 
                onClick={() => setShowProductoModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={crearProducto} className="space-y-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Producto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productoForm.nombre}
                    onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                    className="input w-full"
                    placeholder="Ej: Cemento gris 50kg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código del Artículo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productoForm.codigo_articulo}
                    onChange={(e) => setProductoForm({ ...productoForm, codigo_articulo: e.target.value })}
                    className="input w-full"
                    placeholder="Ej: CEM-001"
                    required
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría
                </label>
                <select
                  value={productoForm.categoria}
                  onChange={(e) => setProductoForm({ ...productoForm, categoria: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio de Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productoForm.precio_compra}
                    onChange={(e) => setProductoForm({ ...productoForm, precio_compra: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio de Venta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productoForm.precio_venta}
                    onChange={(e) => setProductoForm({ ...productoForm, precio_venta: e.target.value })}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stock y alertas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    value={productoForm.stock_inicial}
                    onChange={(e) => setProductoForm({ ...productoForm, stock_inicial: e.target.value })}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alerta de Stock
                  </label>
                  <input
                    type="number"
                    value={productoForm.alerta_stock}
                    onChange={(e) => setProductoForm({ ...productoForm, alerta_stock: e.target.value })}
                    className="input w-full"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unidad de Medida
                  </label>
                  <select
                    value={productoForm.unidad_medida}
                    onChange={(e) => setProductoForm({ ...productoForm, unidad_medida: e.target.value })}
                    className="input w-full"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>
              </div>

              {/* Checkbox de segunda */}
              <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <input
                  type="checkbox"
                  id="incluye_segundas"
                  checked={productoForm.incluye_segundas}
                  onChange={(e) => setProductoForm({ ...productoForm, incluye_segundas: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <label htmlFor="incluye_segundas" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Material de segunda calidad
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowProductoModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL DE DETALLE DE CATEGORÍA ========== */}
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
