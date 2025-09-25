"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Clock, Phone, Globe, Calendar } from "lucide-react"

const sampleSalons = [
  {
    id: 1,
    name: "Beauty Studio Madrid",
    address: "Calle Gran Vía 45, Madrid",
    distance: "0.8 km",
    rating: 4.8,
    reviews: 156,
    phone: "+34 91 123 4567",
    website: "beautystudio.es",
    services: ["Manicura", "Pedicura", "Nail Art", "Gel"],
    price: "25-45€",
    image: "salon-1"
  },
  {
    id: 2,
    name: "Nails & More Barcelona",
    address: "Passeig de Gràcia 123, Barcelona",
    distance: "1.2 km",
    rating: 4.6,
    reviews: 89,
    phone: "+34 93 987 6543",
    website: "nailsmore.com",
    services: ["Nail Art", "Extensiones", "Tratamientos"],
    price: "30-60€",
    image: "salon-2"
  },
  {
    id: 3,
    name: "Luxury Nails Valencia",
    address: "Calle Colón 78, Valencia",
    distance: "2.1 km",
    rating: 4.9,
    reviews: 203,
    phone: "+34 96 456 7890",
    website: "luxurynails.es",
    services: ["Premium Manicura", "Diseños IA", "Spa"],
    price: "40-80€",
    image: "salon-3"
  }
]

export default function SalonsPage() {
  const [searchLocation, setSearchLocation] = useState("")
  const [selectedService, setSelectedService] = useState("todos")
  const [priceRange, setPriceRange] = useState("todos")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold lobba-text-gradient">
          Salones Cercanos
        </h1>
        <p className="text-gray-600">
          Encuentra el salón perfecto para aplicar tus diseños
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Ubicación (ej: Madrid, Barcelona...)"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="todos">Todos los servicios</option>
            <option value="manicura">Manicura</option>
            <option value="pedicura">Pedicura</option>
            <option value="nail-art">Nail Art</option>
            <option value="gel">Uñas de Gel</option>
            <option value="extensiones">Extensiones</option>
          </select>

          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="todos">Todos los precios</option>
            <option value="economico">€ - Económico (15-30€)</option>
            <option value="medio">€€ - Medio (30-50€)</option>
            <option value="premium">€€€ - Premium (50€+)</option>
          </select>
        </div>

        <Button variant="lobba" className="w-full md:w-auto">
          <MapPin className="mr-2 h-4 w-4" />
          Buscar Salones
        </Button>
      </div>

      {/* Results */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {sampleSalons.length} salones encontrados
          </h2>
          <Button variant="outline" size="sm">
            Ver en Mapa
          </Button>
        </div>

        {/* Salons List */}
        <div className="space-y-4">
          {sampleSalons.map((salon) => (
            <div key={salon.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Salon Image */}
                <div className="w-full md:w-48 h-32 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">💅</span>
                </div>

                {/* Salon Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{salon.name}</h3>
                      <p className="text-gray-600 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {salon.address} • {salon.distance}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{salon.rating}</span>
                        <span className="text-gray-500">({salon.reviews})</span>
                      </div>
                      <p className="text-lg font-semibold text-pink-600">{salon.price}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {salon.services.map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                      >
                        {service}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {salon.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {salon.website}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Clock className="mr-2 h-4 w-4" />
                        Horarios
                      </Button>
                      <Button variant="lobba" size="sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        Reservar Cita
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Mapa de Salones</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2" />
            <p>Mapa interactivo próximamente</p>
          </div>
        </div>
      </div>
    </div>
  )
}
