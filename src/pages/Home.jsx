import { useNavigate } from 'react-router-dom'
import { Button, Card } from '../components/common'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative text-center px-8 py-16 min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background decorations */}
        <div 
          className="absolute -top-1/2 -right-[10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(circle, #FF1493 0%, transparent 70%)',
            animation: 'pulse 6s ease-in-out infinite'
          }} 
        />
        <div 
          className="absolute -bottom-[30%] -left-[10%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(circle, #FF1493 0%, transparent 70%)',
            animation: 'pulse 8s ease-in-out infinite',
            animationDelay: '2s'
          }} 
        />
        
        {/* Content */}
        <h1 className="relative z-10 font-primary text-4xl md:text-5xl font-bold text-[#FF1493] mb-6">
          Bienvenida a LOBBA
        </h1>
        <p className="relative z-10 font-secondary text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-[600px] mx-auto">
          Tu plataforma integral para servicios de belleza, reservas y e-commerce
        </p>
        <div className="relative z-10 flex gap-6 justify-center flex-wrap">
          <Button size="large" onClick={() => navigate('/salones')}>
            Explorar Salones
          </Button>
          <Button variant="outline" size="large" onClick={() => navigate('/tienda')}>
            Ver Productos
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-16 bg-gray-50 dark:bg-black">
        <h2 className="font-primary text-3xl text-center mb-12 text-gray-900 dark:text-white font-semibold">
          ¿Qué puedes hacer con LOBBA?
        </h2>
        <div 
          className="grid gap-8 max-w-[1280px] mx-auto"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}
        >
          <Card 
            variant="elevated" 
            hover
            onClick={() => navigate('/salones')}
            className="min-w-[360px]"
          >
            <h3 className="font-primary text-xl font-semibold text-[#FF1493] mb-2">
              Reserva en Salones
            </h3>
            <p className="font-secondary text-gray-600 dark:text-gray-400 leading-relaxed">
              Encuentra y reserva servicios en los mejores salones cerca de ti
            </p>
          </Card>
          
          <Card 
            variant="elevated" 
            hover
            onClick={() => navigate('/tienda')}
            className="min-w-[360px]"
          >
            <h3 className="font-primary text-xl font-semibold text-[#FF1493] mb-2">
              E-commerce Exclusivo
            </h3>
            <p className="font-secondary text-gray-600 dark:text-gray-400 leading-relaxed">
              Productos de calidad profesional de la marca LOBBA
            </p>
          </Card>
          
          <Card 
            variant="elevated" 
            hover
            onClick={() => navigate('/ai/unas')}
            className="min-w-[360px]"
          >
            <h3 className="font-primary text-xl font-semibold text-[#FF1493] mb-2">
              IA Generativa
            </h3>
            <p className="font-secondary text-gray-600 dark:text-gray-400 leading-relaxed">
              Diseña tus uñas o prueba peinados con inteligencia artificial
            </p>
          </Card>
          
          <Card 
            variant="elevated" 
            hover
            onClick={() => navigate('/comunidad')}
            className="min-w-[360px]"
          >
            <h3 className="font-primary text-xl font-semibold text-[#FF1493] mb-2">
              Comunidad LOBBA
            </h3>
            <p className="font-secondary text-gray-600 dark:text-gray-400 leading-relaxed">
              Comparte, inspírate y conecta con otras apasionadas de la belleza
            </p>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default Home
