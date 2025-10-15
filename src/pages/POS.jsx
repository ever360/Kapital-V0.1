import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search } from 'lucide-react'

export default function POS() {
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')

  const addToCart = (product) => {
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
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ))
  }

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const sampleProducts = [
    { id: 1, name: 'Producto 1', price: 10000, stock: 50 },
    { id: 2, name: 'Producto 2', price: 25000, stock: 30 },
    { id: 3, name: 'Producto 3', price: 15000, stock: 20 },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Punto de Venta</h1>

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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sampleProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="card cursor-pointer hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold mb-2">{product.name}</h3>
                <p className="text-2xl font-bold text-primary-600">
                  ${product.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Stock: {product.stock}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card h-fit sticky top-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold">Carrito</h2>
          </div>

          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Carrito vacío</p>
          ) : (
            <>
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ${item.price.toLocaleString()} x {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${total.toLocaleString()}
                  </span>
                </div>
                <button className="w-full btn btn-primary text-lg py-3">
                  Procesar Venta
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
