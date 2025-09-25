"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Star, Search } from "lucide-react"

const sampleProducts = [
  {
    id: 1,
    name: "Kit Manicura Profesional LOBBA",
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.8,
    reviews: 234,
    category: "KITS",
    image: "kit-1",
    inStock: true,
    featured: true
  },
  {
    id: 2,
    name: "Esmalte Gel UV Rosa Elegante",
    price: 12.99,
    rating: 4.6,
    reviews: 156,
    category: "NAIL_POLISH",
    image: "polish-1",
    inStock: true,
    featured: false
  },
  {
    id: 3,
    name: "Lámpara LED Profesional 48W",
    price: 89.99,
    rating: 4.9,
    reviews: 89,
    category: "TOOLS",
    image: "lamp-1",
    inStock: false,
    featured: true
  },
  {
    id: 4,
    name: "Set Decoraciones Nail Art",
    price: 24.99,
    rating: 4.7,
    reviews: 178,
    category: "ACCESSORIES",
    image: "decorations-1",
    inStock: true,
    featured: false
  }
]

const categories = [
  { id: "todos", name: "Todos", count: 156 },
  { id: "NAIL_POLISH", name: "Esmaltes", count: 45 },
  { id: "TOOLS", name: "Herramientas", count: 32 },
  { id: "ACCESSORIES", name: "Accesorios", count: 28 },
  { id: "KITS", name: "Kits", count: 51 }
]

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("featured")
  const [cartItems, setCartItems] = useState<number[]>([])

  const addToCart = (productId: number) => {
    setCartItems([...cartItems, productId])
  }

  const filteredProducts = sampleProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "todos" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold lobba-text-gradient">
          Tienda LOBBA
        </h1>
        <p className="text-gray-600">
          Productos premium para profesionales y entusiastas del nail art
        </p>
      </div>

      {/* Search and Cart */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
        
        <Button variant="lobba" className="relative">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Carrito
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold mb-4">Categorías</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-pink-100 text-pink-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{category.name}</span>
                    <span className="text-gray-400 text-sm">{category.count}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-semibold mb-4">Filtros</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Precio</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Menos de 20€</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">20€ - 50€</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm">Más de 50€</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">En stock</span>
                </label>
              </div>

              <div>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">En oferta</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sort Options */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {filteredProducts.length} productos encontrados
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="featured">Destacados</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
              <option value="rating">Mejor Valorados</option>
              <option value="newest">Más Nuevos</option>
            </select>
          </div>

          {/* Products */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center relative">
                  <span className="text-4xl">🎨</span>
                  {product.featured && (
                    <span className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      Destacado
                    </span>
                  )}
                  {!product.inStock && (
                    <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                      Agotado
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium ml-1">{product.rating}</span>
                      <span className="text-gray-500 text-sm ml-1">({product.reviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-pink-600">
                      €{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-gray-400 line-through">
                        €{product.originalPrice}
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => addToCart(product.id)}
                    disabled={!product.inStock}
                    variant={product.inStock ? "lobba" : "outline"}
                    className="w-full"
                  >
                    {product.inStock ? (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Añadir al Carrito
                      </>
                    ) : (
                      "No Disponible"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
