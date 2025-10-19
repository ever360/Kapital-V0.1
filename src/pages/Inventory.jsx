import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit, Trash2, X, Save } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [sucursalId, setSucursalId] = useState(null)
  
  const [formData, setFormData] = useState({
    codigo_articulo: '',
    nombre: '',
    marca: '',
    precio_compra: '',
    precio_venta: '',
    cantidad: ''
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
          cargarProductos(userData.sucursal_id),
          cargarCategorias(userData.sucursal_id)
        ])
      }
    } catch (err) {
      console.error('Error al inicializar:', err)
    }
  }

  const cargarProductos = async (sucId) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('sucursal_id', sucId)
        .order('nombre')

      if (error) throw error
      setProductos(data || [])
    } catch (err) {
      console.error('Error al cargar productos:', err)
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const abrirModalNuevo = () => {
    setEditingProduct(null)
    setFormData({
      codigo_articulo: '',
      nombre: '',
      marca: '',
      precio_compra: '',
      precio_venta: '',
      cantidad: ''
    })
    setShowModal(true)
  }

  const abrirModalEditar = (producto) => {
    setEditingProduct(producto)
    setFormData({
      codigo_articulo: producto.codigo_articulo || '',
      nombre: producto.nombre || '',
      marca: producto.marca || '',
      precio_compra: producto.precio_compra || '',
      precio_venta: producto.precio_venta || '',
      cantidad: producto.cantidad || ''
    })
    setShowModal(true)
  }

  const guardarProducto = async (e) => {
    e.preventDefault()

    try {
      const productoData = {
        sucursal_id: sucursalId,
        codigo_articulo: formData.codigo_articulo,
        nombre: formData.nombre,
        marca: formData.marca || null,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        cantidad: parseInt(formData.cantidad) || 0,
        tiempo: new Date().toISOString()
      }

      if (editingProduct) {
        // Actualizar
        const { error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', editingProduct.id)

        if (error) throw error
        alert('Producto actualizado exitosamente')
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('productos')
          .insert(productoData)

        if (error) throw error
        alert('Producto creado exitosamente')
      }

      setShowModal(false)
      cargarProductos(sucursalId)
    } catch (err) {
      console.error('Error al guardar producto:', err)
      alert('Error al guardar el producto: ' + err.message)
    }
  }

  const eliminarProducto = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) return

    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Producto eliminado exitosamente')
      cargarProductos(sucursalId)
    } catch (err) {
      console.error('Error al eliminar producto:', err)
      alert('Error al eliminar el producto: ' + err.message)
    }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_articulo.toLowerCase().includes(search.toLowerCase()) ||
    (p.marca && p.marca.toLowerCase().includes(search.toLowerCase()))
  )

  const calcularEstadisticas = () => {
    const totalProductos = productos.length
    const stockTotal = productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)
    const valorInventario = productos.reduce((sum, p) => 
      sum + ((p.precio_compra || 0) * (p.cantidad || 0)), 0
    )
    const productosSinStock = productos.filter(p => 
      (p.cantidad || 0) === 0
    ).length

    return { totalProductos, stockTotal, valorInventario, productosSinStock }
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus productos</p>
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
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sin Stock</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.productosSinStock}</p>
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
            placeholder="Buscar productos por nombre, código o marca..."
          />
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Stock</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {search ? 'No se encontraron productos' : 'No hay productos registrados'}
                  </td>
                </tr>
              ) : (
                productosFiltrados.map(producto => (
                  <tr key={producto.id}>
                    <td className="font-mono text-sm">{producto.codigo_articulo}</td>
                    <td>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{producto.nombre}</p>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">{producto.marca || '-'}</td>
                    <td>
                      <span className={`badge ${
                        (producto.cantidad || 0) > 10 ? 'badge-success' : 
                        (producto.cantidad || 0) > 0 ? 'badge-warning' : 
                        'badge-danger'
                      }`}>
                        {producto.cantidad || 0}
                      </span>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">
                      ${(producto.precio_compra || 0).toLocaleString()}
                    </td>
                    <td className="font-semibold text-primary-600 dark:text-primary-400">
                      ${(producto.precio_venta || 0).toLocaleString()}
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
                    placeholder="COD001"
                    required
                    disabled={!!editingProduct}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Marca del producto"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio de Compra
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cantidad (Stock)
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="0"
                    min="0"
                  />
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
