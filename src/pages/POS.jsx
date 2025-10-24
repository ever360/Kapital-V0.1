import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search, DollarSign, CreditCard, Banknote } from 'lucide-react'
import { supabase } from '../services/supabase'

export default function POS() {
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingVenta, setProcessingVenta] = useState(false)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [sucursalId, setSucursalId] = useState(null)
  const [usuarioId, setUsuarioId] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      setUsuarioId(user.id)
      
      const { data: userData } = await supabase
        .from('usuarios')
        .select('sucursal_id')
        .eq('id', user.id)
        .single()
      
      if (!userData?.sucursal_id) return
      
      setSucursalId(userData.sucursal_id)
      
      // Cargar productos del inventario con stock
      const { data: productosData, error: productosError } = await supabase
        .from('inventario')
        .select('*')
        .eq('sucursal_id', userData.sucursal_id)
        .order('nombre')
      
      if (productosError) throw productosError
      
      setProductos(productosData || [])
      
      // Cargar clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('*')
        .eq('sucursal_id', userData.sucursal_id)
        .order('nombre')
      
      setClientes(clientesData || [])
      
    } catch (err) {
      console.error('Error al cargar datos:', err)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const itemEnCarrito = cart.find(item => item.id === product.id)
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.quantity : 0
    
    if (cantidadEnCarrito >= (product.stock_actual || 0)) {
      alert('No hay suficiente stock disponible')
      return
    }
    
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (id, delta) => {
    const item = cart.find(item => item.id === id)
    const producto = productos.find(p => p.id === id)
    
    if (!item || !producto) return
    
    const newQuantity = item.quantity + delta
    
    if (newQuantity > (producto.stock_actual || 0)) {
      alert('No hay suficiente stock disponible')
      return
    }
    
    if (newQuantity <= 0) {
      removeFromCart(id)
      return
    }
    
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setMetodoPago('efectivo')
    setClienteSeleccionado(null)
  }

  const calcularTotales = () => {
    const subtotal = cart.reduce((sum, item) => 
      sum + ((item.precio_venta || 0) * item.quantity), 0
    )
    const descuento = 0
    const total = subtotal - descuento
    
    return { subtotal, descuento, total }
  }

  const procesarVenta = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío')
      return
    }

    setProcessingVenta(true)
    try {
      const { subtotal, descuento, total } = calcularTotales()
      
      const now = new Date()
      const fecha = now.toISOString().split('T')[0]
      const hora = now.toTimeString().split(' ')[0]
      const mes = now.toLocaleString('es', { month: 'long' })
      const mes_num = now.getMonth() + 1
      const anio = now.getFullYear()
      
      // Calcular utilidad total
      const utilidad = cart.reduce((sum, item) => {
        const precioCompra = item.precio_compra || 0
        const precioVenta = item.precio_venta || 0
        return sum + ((precioVenta - precioCompra) * item.quantity)
      }, 0)
      
      // 1. Crear la venta
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          sucursal_id: sucursalId,
          fecha: fecha,
          hora: hora,
          mes: mes,
          mes_num: mes_num,
          anio: anio,
          medio_de_pago: metodoPago,
          subtotal: subtotal,
          descuento: descuento,
          total: total,
          efectivo: metodoPago === 'efectivo' ? total : 0,
          cliente_id: clienteSeleccionado,
          estado: 'completada',
          cantidad_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          utilidad: utilidad
        })
        .select()
        .single()
      
      if (ventaError) throw ventaError
      
      // 2. Crear detalles de la venta
      const detallesVenta = cart.map(item => {
        const precioCompra = item.precio_compra || 0
        const precioVenta = item.precio_venta || 0
        const utilidadItem = (precioVenta - precioCompra) * item.quantity
        
        return {
          venta_id: venta.id,
          sucursal_id: sucursalId,
          fecha: fecha,
          codigo_producto: item.codigo_articulo,
          nombre: item.nombre,
          cantidad: item.quantity,
          precio_venta: precioVenta,
          precio_compra: precioCompra,
          utilidad: precioVenta - precioCompra,
          utilidad_total: utilidadItem,
          total: precioVenta * item.quantity
        }
      })
      
      const { error: detallesError } = await supabase
        .from('detalle_ventas')
        .insert(detallesVenta)
      
      if (detallesError) throw detallesError
      
      // 3. Actualizar inventario
      for (const item of cart) {
        const nuevoStock = (item.stock_actual || 0) - item.quantity
        const nuevasVentas = (item.ventas || 0) + item.quantity
        
        const { error: stockError } = await supabase
          .from('inventario')
          .update({ 
            stock_actual: nuevoStock,
            ventas: nuevasVentas
          })
          .eq('id', item.id)
        
        if (stockError) throw stockError
      }
      
      alert(`✅ ¡Venta procesada exitosamente!\n\nTotal: $${total.toLocaleString()}\nUtilidad: $${utilidad.toLocaleString()}`)
      
      clearCart()
      setShowPaymentModal(false)
      cargarDatos()
      
    } catch (err) {
      console.error('Error al procesar venta:', err)
      alert('Error al procesar la venta: ' + err.message)
    } finally {
      setProcessingVenta(false)
    }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo_articulo.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(search.toLowerCase()))
  )

  const { subtotal, descuento, total } = calcularTotales()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Punto de Venta</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Buscar productos..."
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {productosFiltrados.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {search ? 'No se encontraron productos' : 'No hay productos disponibles'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {productosFiltrados.map(producto => (
                <div
                  key={producto.id}
                  onClick={() => (producto.stock_actual || 0) > 0 && addToCart(producto)}
                  className={`card cursor-pointer transition-all ${
                    (producto.stock_actual || 0) > 0 
                      ? 'hover:shadow-lg hover:scale-105' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="mb-2">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {producto.codigo_articulo}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100 line-clamp-2">
                    {producto.nombre}
                  </h3>
                  {producto.categoria && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{producto.categoria}</p>
                  )}
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    ${(producto.precio_venta || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${
                      (producto.stock_actual || 0) > (producto.alerta_stock || 10)
                        ? 'text-green-600 dark:text-green-400' 
                        : (producto.stock_actual || 0) > 0 
                        ? 'text-yellow-600 dark:text-yellow-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      Stock: {producto.stock_actual || 0}
                    </span>
                    {producto.porcentaje_utilidad > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                        +{producto.porcentaje_utilidad.toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel del carrito */}
        <div className="card h-fit sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Carrito</h2>
            {cart.length > 0 && (
              <span className="ml-auto badge badge-info">{cart.length}</span>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente (opcional)
            </label>
            <select
              value={clienteSeleccionado || ''}
              onChange={(e) => setClienteSeleccionado(e.target.value || null)}
              className="input"
            >
              <option value="">Cliente general</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellidos || ''}
                </option>
              ))}
            </select>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Carrito vacío</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {item.nombre}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${(item.precio_venta || 0).toLocaleString()} x {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        ${((item.precio_venta || 0) * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                    <span className="font-medium text-red-600">-${descuento.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    ${total.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full btn btn-primary text-lg py-3"
                >
                  Procesar Venta
                </button>
                <button 
                  onClick={clearCart}
                  className="w-full btn btn-secondary"
                >
                  Limpiar Carrito
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de método de pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Método de Pago
            </h3>
            
            <div className="space-y-3 mb-6">
              {['efectivo', 'tarjeta', 'transferencia'].map(metodo => (
                <button
                  key={metodo}
                  onClick={() => setMetodoPago(metodo)}
                  className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    metodoPago === metodo
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {metodo === 'efectivo' && <Banknote className="w-6 h-6" />}
                  {metodo === 'tarjeta' && <CreditCard className="w-6 h-6" />}
                  {metodo === 'transferencia' && <DollarSign className="w-6 h-6" />}
                  <div className="text-left flex-1">
                    <p className="font-semibold capitalize">{metodo}</p>
                  </div>
                  {metodoPago === metodo && (
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total a pagar:</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                ${total.toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 btn btn-secondary"
                disabled={processingVenta}
              >
                Cancelar
              </button>
              <button
                onClick={procesarVenta}
                className="flex-1 btn btn-primary"
                disabled={processingVenta}
              >
                {processingVenta ? 'Procesando...' : 'Confirmar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
