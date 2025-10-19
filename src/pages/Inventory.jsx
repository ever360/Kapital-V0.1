import { useState, useEffect } from 'react'
import { Package, Plus, Search, Edit, Trash2, X, Save, Tag, FolderPlus } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [sucursalId, setSucursalId] = useState(null)
  
  const [formData, setFormData] = useState({
    codigo_articulo: '',
    nombre: '',
    marca: '',
    categoria_id: '',
    precio_compra: '',
    precio_venta: '',
    cantidad: '',
    es_segunda: false,
    calidad: 'primera'
  })

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
      
      console.log('📦 Cargando productos para sucursal:', sucId)
      
      // Primero cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('*')
        .eq('sucursal_id', sucId)
        .order('nombre')

      if (productosError) {
        console.error('❌ Error al cargar productos:', productosError)
        throw productosError
      }

      console.log('✅ Productos cargados de BD:', productosData?.length || 0, productosData)

      // Luego cargar categorías para hacer el join manual
      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('sucursal_id', sucId)

      // Mapear productos con sus categorías
      const productosConCategoria = (productosData || []).map(producto => {
        const categoria = categoriasData?.find(c => c.id === producto.categoria_id)
        return {
          ...producto,
          categoria_nombre: categoria?.nombre || null
        }
      })

      console.log('✅ Productos procesados con categorías:', productosConCategoria.length)
      setProductos(productosConCategoria)
      
    } catch (err) {
      console.error('💥 Error completo al cargar productos:', err)
      alert('Error al cargar productos: ' + err.message)
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

      alert('Categoría creada exitosamente')
      setCategoriaForm({ nombre: '' })
      setShowCategoriaModal(false)
      cargarCategorias(sucursalId)
    } catch (err) {
      console.error('Error al crear categoría:', err)
      alert('Error al crear categoría: ' + err.message)
    }
  }

  const eliminarCategoria = async (id, nombre) => {
    if (!confirm(`¿Eliminar la categoría "${nombre}"? Los productos asociados quedarán sin categoría.`)) return

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Categoría eliminada')
      cargarCategorias(sucursalId)
      cargarProductos(sucursalId)
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const abrirModalNuevo = async () => {
    setEditingProduct(null)
    
    // Generar código automático
    const timestamp = Date.now()
    const codigoAuto = `PROD${timestamp.toString().slice(-8)}`
    
    setFormData({
      codigo_articulo: codigoAuto, // Código auto-generado
      nombre: '',
      marca: '',
      categoria_id: '',
      precio_compra: '',
      precio_venta: '',
      cantidad: '',
      es_segunda: false,
      calidad: 'primera'
    })
    setShowModal(true)
  }

  const abrirModalEditar = (producto) => {
    setEditingProduct(producto)
    setFormData({
      codigo_articulo: producto.codigo_articulo || '',
      nombre: producto.nombre || '',
      marca: producto.marca || '',
      categoria_id: producto.categoria_id || '',
      precio_compra: producto.precio_compra || '',
      precio_venta: producto.precio_venta || '',
      cantidad: producto.cantidad || '',
      es_segunda: producto.es_segunda || false,
      calidad: producto.calidad || 'primera'
    })
    setShowModal(true)
  }

  const guardarProducto = async (e) => {
    e.preventDefault()

    // DEBUG: Verificar sucursal_id
    if (!sucursalId) {
      alert('❌ ERROR: No tienes sucursal asignada. Tu usuario debe tener una sucursal_id en la tabla usuarios.')
      console.error('Usuario sin sucursal_id')
      return
    }

    console.log('🔍 Datos del producto a guardar:', {
      sucursal_id: sucursalId,
      codigo_articulo: formData.codigo_articulo,
      nombre: formData.nombre
    })

    try {
      const productoData = {
        sucursal_id: sucursalId,
        codigo_articulo: formData.codigo_articulo,
        nombre: formData.nombre,
        marca: formData.marca || null,
        categoria_id: formData.categoria_id || null,
        precio_compra: parseFloat(formData.precio_compra) || 0,
        precio_venta: parseFloat(formData.precio_venta) || 0,
        cantidad: parseInt(formData.cantidad) || 0,
        es_segunda: formData.es_segunda,
        calidad: formData.calidad,
        tiempo: new Date().toISOString()
      }

      if (editingProduct) {
        console.log('🔄 Actualizando producto ID:', editingProduct.id)
        
        const { data, error } = await supabase
          .from('productos')
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
          .from('productos')
          .insert({
            ...productoData,
            pid_ms: `PROD-${Date.now()}`
          })
          .select()

        if (error) {
          console.error('❌ Error de Supabase:', error)
          console.error('Detalles del error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
        
        console.log('✅ Producto creado en BD:', data)
        alert('✅ Producto creado exitosamente en la base de datos')
      }

      setShowModal(false)
      await cargarProductos(sucursalId)
      
    } catch (err) {
      console.error('💥 Error completo:', err)
      
      let errorMessage = 'Error al guardar el producto:\n\n'
      
      if (err.message.includes('permission')) {
        errorMessage += '❌ PROBLEMA DE PERMISOS (RLS)\n'
        errorMessage += 'Ejecuta el SQL para corregir políticas RLS'
      } else if (err.message.includes('duplicate')) {
        errorMessage += '❌ CÓDIGO DUPLICADO\n'
        errorMessage += 'Ya existe un producto con ese código'
      } else if (err.message.includes('violates foreign key')) {
        errorMessage += '❌ SUCURSAL NO VÁLIDA\n'
        errorMessage += 'Tu sucursal_id no existe en la tabla sucursales'
      } else {
        errorMessage += err.message
      }
      
      errorMessage += '\n\nRevisa la consola (F12) para más detalles'
      
      alert(errorMessage)
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
    (p.marca && p.marca.toLowerCase().includes(search.toLowerCase())) ||
    (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(search.toLowerCase()))
  )

  const calcularEstadisticas = () => {
    const totalProductos = productos.length
    const stockTotal = productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)
    const valorInventario = productos.reduce((sum, p) => 
      sum + ((p.precio_compra || 0) * (p.cantidad || 0)), 0
    )
    const productosSinStock = productos.filter(p => (p.cantidad || 0) === 0).length
    const productosSegunda = productos.filter(p => p.es_segunda).length

    return { totalProductos, stockTotal, valorInventario, productosSinStock, productosSegunda }
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus productos y categorías</p>
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
            onClick={abrirModalNuevo}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <div className="card">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Material 2da</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.productosSegunda}</p>
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
            placeholder="Buscar productos por nombre, código, marca o categoría..."
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
                <th>Categoría</th>
                <th>Marca</th>
                <th>Calidad</th>
                <th>Stock</th>
                <th>P. Compra</th>
                <th>P. Venta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                    <td>
                      {producto.categoria_nombre ? (
                        <span className="badge badge-info">
                          {producto.categoria_nombre}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin categoría</span>
                      )}
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">{producto.marca || '-'}</td>
                    <td>
                      {producto.es_segunda ? (
                        <span className="badge badge-warning">
                          {producto.calidad || 'Segunda'}
                        </span>
                      ) : (
                        <span className="badge badge-success">Primera</span>
                      )}
                    </td>
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

      {/* Modal de gestión de categorías */}
      {showCategoriaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            {/* Formulario nueva categoría */}
            <form onSubmit={crearCategoria} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={categoriaForm.nombre}
                  onChange={(e) => setCategoriaForm({ nombre: e.target.value })}
                  className="input flex-1"
                  placeholder="Nombre de la categoría"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Lista de categorías */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Categorías existentes ({categorias.length})
              </p>
              {categorias.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay categorías creadas
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categorias.map(cat => (
                    <div 
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {cat.nombre}
                        </span>
                      </div>
                      <button
                        onClick={() => eliminarCategoria(cat.id, cat.nombre)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                    {editingProduct ? 'El código no se puede modificar' : 'Puedes modificar el código generado'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <select
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
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

              {/* Material de Segunda */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="es_segunda"
                    name="es_segunda"
                    checked={formData.es_segunda}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="es_segunda" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Es material de segunda
                  </label>
                </div>

                {formData.es_segunda && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Calidad del material
                    </label>
                    <select
                      name="calidad"
                      value={formData.calidad}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="segunda">Segunda</option>
                      <option value="tercera">Tercera</option>
                      <option value="reparado">Reparado</option>
                      <option value="usado">Usado</option>
                    </select>
                  </div>
                )}
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
