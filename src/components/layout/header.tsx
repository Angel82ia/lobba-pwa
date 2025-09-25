"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { User, Menu, X } from "lucide-react"
import { useState } from "react"

export function Header() {
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/lobba-logo.jpg"
            alt="LOBBA Beauty"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/editor" className="text-sm font-medium hover:text-pink-500 transition-colors">
            Editor
          </Link>
          <Link href="/catalog" className="text-sm font-medium hover:text-pink-500 transition-colors">
            Catálogo
          </Link>
          <Link href="/salons" className="text-sm font-medium hover:text-pink-500 transition-colors">
            Salones
          </Link>
          <Link href="/shop" className="text-sm font-medium hover:text-pink-500 transition-colors">
            Tienda
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {status === "loading" ? (
            <div className="h-8 w-8 animate-pulse bg-gray-200 rounded-full" />
          ) : session ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden md:flex"
                onClick={() => signOut()}
              >
                Cerrar Sesión
              </Button>
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              variant="lobba"
              size="sm"
              onClick={() => signIn("google")}
            >
              Iniciar Sesión
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="container py-4 space-y-2">
            <Link
              href="/editor"
              className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Editor
            </Link>
            <Link
              href="/catalog"
              className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Catálogo
            </Link>
            <Link
              href="/salons"
              className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Salones
            </Link>
            <Link
              href="/shop"
              className="block px-4 py-2 text-sm font-medium hover:bg-gray-50 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Tienda
            </Link>
            {session && (
              <Button
                variant="ghost"
                className="w-full justify-start px-4"
                onClick={() => {
                  signOut()
                  setIsMenuOpen(false)
                }}
              >
                Cerrar Sesión
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
