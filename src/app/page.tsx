"use client"

import React from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Sparkles, Palette, Store, MapPin } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { data: session } = useSession()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold lobba-text-gradient">
            Diseña Uñas Únicas con IA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Crea diseños personalizados de uñas con inteligencia artificial, 
            encuentra salones cerca de ti y compra productos de belleza premium.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/editor">
            <Button variant="lobba" size="lg" className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-5 w-5" />
              Crear Diseño IA
            </Button>
          </Link>
          <Link href="/catalog">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <Palette className="mr-2 h-5 w-5" />
              Ver Catálogo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-pink-500" />
          </div>
          <h3 className="text-lg font-semibold">Generación IA</h3>
          <p className="text-gray-600 text-sm">
            Crea diseños únicos con inteligencia artificial. Solo describe tu idea y obtén resultados increíbles.
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
            <Palette className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold">Catálogo Colaborativo</h3>
          <p className="text-gray-600 text-sm">
            Explora miles de diseños creados por la comunidad y comparte tus propias creaciones.
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
            <MapPin className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Salones Cercanos</h3>
          <p className="text-gray-600 text-sm">
            Encuentra salones de belleza cerca de ti y reserva citas para aplicar tus diseños.
          </p>
        </div>

        <div className="text-center space-y-4 p-6 rounded-lg bg-white shadow-sm border">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
            <Store className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Tienda Online</h3>
          <p className="text-gray-600 text-sm">
            Compra productos de belleza premium y herramientas profesionales para uñas.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white rounded-2xl p-8 shadow-sm border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold lobba-text-gradient">10K+</div>
            <div className="text-gray-600 text-sm">Diseños Creados</div>
          </div>
          <div>
            <div className="text-3xl font-bold lobba-text-gradient">500+</div>
            <div className="text-gray-600 text-sm">Salones Asociados</div>
          </div>
          <div>
            <div className="text-3xl font-bold lobba-text-gradient">25K+</div>
            <div className="text-gray-600 text-sm">Usuarios Activos</div>
          </div>
          <div>
            <div className="text-3xl font-bold lobba-text-gradient">98%</div>
            <div className="text-gray-600 text-sm">Satisfacción</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session && (
        <section className="text-center space-y-6 bg-gradient-to-r from-gray-900 to-pink-500 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold">
            ¿Listo para crear diseños únicos?
          </h2>
          <p className="text-lg opacity-90 max-w-xl mx-auto">
            Únete a miles de usuarios que ya están creando diseños increíbles con LOBBA Beauty.
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => window.location.href = '/api/auth/signin'}
          >
            Comenzar Gratis
          </Button>
        </section>
      )}
    </div>
  )
}
