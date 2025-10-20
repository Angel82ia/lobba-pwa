import { useEffect, useState } from 'react'
import maintenanceDark from '../assets/maintenance-dark.jpg'

const Maintenance = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${maintenanceDark})`,
        }}
      />
      
      {/* Subtle Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
        <div 
          className={`transform transition-all duration-1000 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {/* Glass Liquid Container */}
          <div className="
            relative overflow-hidden rounded-[3rem] px-8 py-12 sm:px-16 sm:py-16 lg:px-24 lg:py-20
            backdrop-blur-xl
            max-w-4xl mx-auto
            bg-white/10 border border-white/20 shadow-3xl shadow-pink-500/20
          ">
            {/* Inner Glow Effect */}
            <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10" />

            {/* Text Content */}
            <div className="relative text-center">
              <h1 className="
                font-montserrat font-bold mb-4 sm:mb-6
                text-2xl sm:text-3xl md:text-4xl lg:text-5xl
                leading-tight tracking-wide
                text-white
              ">
                <div className="
                  bg-gradient-to-r from-pink-300 via-fuchsia-300 to-purple-300
                  bg-clip-text text-transparent
                  drop-shadow-2xl
                ">
                  El día 1 de Noviembre
                </div>
              </h1>

              <h2 className="
                font-montserrat font-bold
                text-3xl sm:text-4xl md:text-5xl lg:text-6xl
                leading-tight tracking-wide
              ">
                <span className="text-white">
                  comienza la{' '}
                </span>
                <span className="
                  bg-gradient-to-r from-fuchsia-300 via-pink-300 to-purple-300
                  bg-clip-text text-transparent
                  drop-shadow-2xl
                ">
                  Beauty Revolution
                </span>
              </h2>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Maintenance
