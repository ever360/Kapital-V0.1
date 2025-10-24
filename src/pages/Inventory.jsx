import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit, Trash2, X, Save, AlertTriangle } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [sucursalId, setSucursalId] = useState(null)
  
  const [formData, setFormData] = useState({
    codigo_articulo: '',
    nombre: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock_inicial: '',
    alerta_stock: '10'
  })

  useEffect(() => {
    inicializar()
  }, [])

  const inicializar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ No hay usuario autenticado')
        return
      }

      console.log('👤 Usuario autenticado:', user.email)

      const { data: userData } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single()

      console.log('🏢 Datos del usuario:', userData)

      if (userData?.sucursal_id) {
        setSucursalId(userData.sucursal_id)
        console.log('✅ Sucursal ID asignada:', userData.sucursal_id)
        await cargarInventario(userData.sucursal_id)
      } else {
        console.error('❌ Usuario sin sucursal_id asignada')
        alert('❌ Tu usuario no tiene una sucursal asignada.')
      }
    } catch (err) {
      console.error('💥 Error al inicializar:', err)
    }
  }

  const cargarInventario = async (sucId) => {
    try {
      setLoading(true)
      
      console.log('📦 Cargando inventario para sucursal:', sucId)
      
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .eq('sucursal_id', sucId)
        .order('nombre')

      if (error) {
        console.error('❌ Error al cargar inventario:', error)
        throw error
      }

      console.log('✅ Inventario cargado de BD:', data?.length || 0, data)
      setProductos(data || [])
      
    } catch (err) {
      console.error('💥 Error completo al cargar inventario:', err)
      alert('Error al cargar inventario: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const calcularUtilidad = (precioCompra, precioVenta) => {
    const compra = parseFloat(precioCompra) || 0
    const venta = parseFloat(precioVenta) || 0
    const utilidad = venta - compra
    const porcentaje = compra > 0 ? ((utilidad / compra) * 100).toFixed(2) : 0
    return { utilidad, porcentaje }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value
    }
    
    // Recalcular utilidad si cambian los precios
    if (name === 'precio_compra' || name === 'precio_venta') {
      const { utilidad, porcentaje } = calcularUtilidad(
        name === 'precio_compra' ? value : formData.precio_compra,
        name === 'precio_venta' ? value : formData.precio_venta
      )
      console.log('💰 Utilidad calculada:', utilidad, 'Porcentaje:', porcentaje + '%')
    }
    
    setFormData(newFormData)
  }

  const abrirModalNuevo = async () => {
    setEditingProduct(null)
    
    // Generar código automático
    const timestamp = Date.now()
    const codigoAuto = `INV${timestamp.toString().slice(-8)}`
    
    setFormData({
      codigo_articulo: codigoAuto,
      nombre: '',
      categoria: '',
      precio_compra: '',
      precio_venta: '',
      stock_inicial: '',
      alerta_stock: '10'
    })
    setShowModal(true)
  }

  const abrirModalEditar = (producto) => {
    setEditingProduct(producto)
    setFormData({
      codigo_articulo: producto.codigo_articulo || '',
      nombre: producto.nombre || '',
      categoria: producto.categoria || '',
      precio_compra: producto.precio_compra || '',
      precio_venta: producto.precio_venta || '',
      stock_inicial: producto.stock_inicial || '',
      alerta_stock: producto.alerta_stock || '10'
    })
    setShowModal(true)
  }

  const guardarProducto = async (e) => {
    e.preventDefault()

    if (!sucursalId) {
      alert('❌ ERROR: No tienes sucursal asignada.')
      return
    }

    console.log('🔍 Datos del producto a guardar:', {
      sucursal_id: sucursalId,
      codigo_articulo: formData.codigo_articulo,
      nombre: formData.nombre
    })

    try {
      const precioCompra = parseFloat(formData.precio_compra) || 0
      const precioVenta = parseFloat(formData.precio_venta) || 0
      const stockInicial = parseInt(formData.stock_inicial) || 0
      
      const { utilidad, porcentaje } = calcularUtilidad(precioCompra, precioVenta)
      
      const productoData = {
        sucursal_id: sucursalId,
        codigo_articulo: formData.codigo_articulo,
        nombre: formData.nombre,
        categoria: formData.categoria || null,
        precio_compra: precioCompra,
        precio_venta: precioVenta,
        utilidad_articulo: utilidad,
        porcentaje_utilidad: parseFloat(porcentaje),
        stock_inicial: stockInicial,
        stock_actual: stockInicial, // Al crear, stock_actual = stock_inicial
        alerta_stock: parseInt(formData.alerta_stock) || 10,
        compras: 0,
        ventas: 0,
        devoluciones: 0,
        segundas_enviadas: 0
      }

      if (editingProduct) {
        console.log('🔄 Actualizando producto ID:', editingProduct.id)
        
        // Al editar, mantener el stock_actual pero actualizar stock_inicial si cambió
        productoData.stock_actual = editingProduct.stock_actual
        
        const { data, error } = await supabase
          .from('inventario')
          .update(productoData)
          .eq('id', editingProduct.id)
          .select()

        if (error) {
          console.error('❌ Error de Supabase:', error)
          throw error
        }
        
        console.log('✅ Producto actualizado en BD:', data)
        alert('✅ Producto actualizado exitosamente')
      } else {
        console.log('➕ Creando nuevo producto...')
        
        const { data, error } = await supabase
          .from('inventario')
          .insert({
            ...productoData,
            id_inventario: `INV-${Date.now()}`
          })
          .select()

        if (error) {
          console.error('❌ Error de Supabase:', error)
          throw error
        }
        
        console.log('✅ Producto creado en BD:', data)
        alert('✅ Producto creado exitosamente')
      }

      setShowModal(false)
      await cargarInventario(sucursalId)
      
    } catch (err) {
      console.error('💥 Error completo:', err)
      
      let errorMessage = 'Error al guardar el producto:\n\n'
      
      if (err.message.includes('permission')) {
        errorMessage += '❌ PROBLEMA DE PERMISOS (RLS)\n'
        errorMessage += 'Ejecuta el SQL para corregir políticas RLS'
      } else if (err.message.includes('duplicate')) {
        errorMessage += '❌ CÓDIGO DUPLICADO\n'
        errorMessage += 'Ya existe un producto con ese código'
      } else {
        errorMessage += err.message
      }
      
      alert(errorMessage)
    }
  }

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}" del inventario?`)) return

    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('✅ Producto eliminado del inventario')
      cargarInventario(sucursalId)
    } catch (err) {
      console.error('Error al eliminar:', err)
      alert('Error al eliminar: ' + err.message)
    }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_articulo.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(search.toLowerCase()))
  )

  const calcularEstadisticas = () => {
    const totalProductos = productos.length
    const stockTotal = productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0)
    const valorInventario = productos.reduce((sum, p) => 
      sum + ((p.precio_compra || 0) * (p.stock_actual || 0)), 0
    )
    const productosAlertaStock = productos.filter(p => 
      (p.stock_actual || 0) <= (p.alerta_stock || 10)
    ).length

    return { totalProductos, stockTotal, valorInventario, productosAlertaStock }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Inventario</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Control completo de tu inventario</p>
        </div>
        <button 
          onClick={abrirModalNuevo}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Productos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProductos}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Stock Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.stockTotal}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valor Inventario</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${stats.valorInventario.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Alerta Stock</p>
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.productosAlertaStock}</p>
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
            placeholder="Buscar por nombre, código o categoría..."
          />
        </div>
      </div>

      {/* Tabla de inventario */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Utilidad</th>
                <th>%</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {search ? 'No se encontraron productos' : 'No hay productos en inventario'}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(producto => (
                  <tr key={producto.id}>
                    <td className="font-mono text-sm">{producto.codigo_articulo}</td>
                    <td>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{producto.nombre}</p>
                    </td>
                    <td>
                      {producto.categoria ? (
                        <span className="badge badge-info text-xs">
                          {producto.categoria}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          (producto.stock_actual || 0) > (producto.alerta_stock || 10) ? 'badge-success' : 
                          (producto.stock_actual || 0) > 0 ? 'badge-warning' : 
                          'badge-danger'
                        }`}>
                          {producto.stock_actual || 0}
                        </span>
                        {(producto.stock_actual || 0) <= (producto.alerta_stock || 10) && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" title="Alerta de stock bajo" />
                        )}
                      </div>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">
                      ${(producto.precio_compra || 0).toLocaleString()}
                    </td>
                    <td className="font-semibold text-primary-600 dark:text-primary-400">
                      ${(producto.precio_venta || 0).toLocaleString()}
                    </td>
                    <td className="text-green-600 dark:text-green-400">
                      ${(producto.utilidad_articulo || 0).toLocaleString()}
                    </td>
                    <td>
                      <span className={`text-sm font-semibold ${
                        (producto.porcentaje_utilidad || 0) > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-400'
                      }`}>
                        {(producto.porcentaje_utilidad || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => abrirModalEditar(producto)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => eliminarProducto(producto.id, producto.nombre)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de crear/editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código del Artículo *
                  </label>
                  <input
                    type="text"
                    name="codigo_articulo"
                    value={formData.codigo_articulo}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Se genera automáticamente"
                    required
                    disabled={!!editingProduct}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingProduct ? 'No se puede modificar' : 'Puedes modificar el código'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <input
                    type="text"
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Ej: Electrónica, Papelería"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Nombre del producto"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio de Compra *
                  </label>
                  <input
                    type="number"
                    name="precio_compra"
                    value={formData.precio_compra}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio de Venta *
                  </label>
                  <input
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Mostrar utilidad calculada */}
              {(formData.precio_compra && formData.precio_venta) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Utilidad por unidad</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${calcularUtilidad(formData.precio_compra, formData.precio_venta).utilidad.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Porcentaje de ganancia</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {calcularUtilidad(formData.precio_compra, formData.precio_venta).porcentaje}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock Inicial *
                  </label>
                  <input
                    type="number"
                    name="stock_inicial"
                    value={formData.stock_inicial}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0"
                    min="0"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {editingProduct ? 'Stock inicial registrado' : 'Se copiará a stock actual'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alerta de Stock Bajo
                  </label>
                  <input
                    type="number"
                    name="alerta_stock"
                    value={formData.alerta_stock}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="10"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Te avisará cuando llegue a este nivel
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingProduct ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
