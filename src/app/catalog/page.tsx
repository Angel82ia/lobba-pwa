"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Filter, Heart, Download, Grid, List } from "lucide-react"

const sampleDesigns = [
  { id: 1, title: "French Elegante", category: "FRENCH", likes: 245, image: "french-1" },
  { id: 2, title: "Flores Tropicales", category: "FLORAL", likes: 189, image: "floral-1" },
  { id: 3, title: "Geométrico Moderno", category: "GEOMETRIC", likes: 156, image: "geometric-1" },
  { id: 4, title: "Abstracto Rosa", category: "ABSTRACT", likes: 203, image: "abstract-1" },
  { id: 5, title: "Navidad Festivo", category: "SEASONAL", likes: 178, image: "seasonal-1" },
  { id: 6, title: "Boda Clásica", category: "WEDDING", likes: 267, image: "wedding-1" },
]

const categories = [
  "TODOS", "CLASSIC", "FRENCH", "GEOMETRIC", "FLORAL", "ABSTRACT", "SEASONAL", "WEDDING", "PARTY"
]

export default function CatalogPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("TODOS")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("popularity")

  const filteredDesigns = sampleDesigns.filter(design => {
    const matchesSearch = design.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "TODOS" || design.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold lobba-text-gradient">
          Catálogo Colaborativo
        </h1>
        <p className="text-gray-600">
          Descubre diseños únicos creados por nuestra comunidad
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar diseños..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "lobba" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "lobba" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "lobba" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="popularity">Popularidad</option>
            <option value="recent">Más Recientes</option>
            <option value="likes">Más Gustados</option>
            <option value="downloads">Más Descargados</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-gray-600">
          {filteredDesigns.length} diseños encontrados
        </p>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtros Avanzados
        </Button>
      </div>

      {/* Designs Grid */}
      <div className={viewMode === "grid" ? "nail-grid" : "space-y-4"}>
        {filteredDesigns.map((design) => (
          <div
            key={design.id}
            className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
              viewMode === "list" ? "flex gap-4 p-4" : "overflow-hidden"
            }`}
          >
            <div className={`bg-gradient-to-br from-pink-100 to-purple-100 ${
              viewMode === "list" ? "w-24 h-24 rounded-lg flex-shrink-0" : "aspect-square"
            } flex items-center justify-center`}>
              <span className="text-2xl">💅</span>
            </div>
            
            <div className={viewMode === "list" ? "flex-1" : "p-4"}>
              <h3 className="font-semibold mb-2">{design.title}</h3>
              <p className="text-sm text-gray-600 mb-3">
                Categoría: {design.category}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {design.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    {Math.floor(design.likes * 0.3)}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Cargar Más Diseños
        </Button>
      </div>
    </div>
  )
}
