import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import './Home.css'

const Home = () => {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      <section className="hero-section">
        <h1 className="hero-title">Bienvenida a LOBBA</h1>
        <p className="hero-subtitle">
          Tu plataforma integral para servicios de belleza, reservas y e-commerce
        </p>
        <div className="hero-actions">
          <Button size="large" onClick={() => navigate('/salones')}>
            Explorar Salones
          </Button>
          <Button variant="outline" size="large" onClick={() => navigate('/tienda')}>
            Ver Productos
          </Button>
        </div>
      </section>

      <section className="features-section">
        <h2>¿Qué puedes hacer con LOBBA?</h2>
        <div className="features-grid">
          <Card variant="elevated" onClick={() => navigate('/salones')} className="clickable-card">
            <h3>Reserva en Salones</h3>
            <p>Encuentra y reserva servicios en los mejores salones cerca de ti</p>
          </Card>
          <Card variant="elevated" onClick={() => navigate('/tienda')} className="clickable-card">
            <h3>E-commerce Exclusivo</h3>
            <p>Productos de calidad profesional de la marca LOBBA</p>
          </Card>
          <Card variant="elevated" onClick={() => navigate('/ai/unas')} className="clickable-card">
            <h3>IA Generativa</h3>
            <p>Diseña tus uñas o prueba peinados con inteligencia artificial</p>
          </Card>
          <Card variant="elevated" onClick={() => navigate('/comunidad')} className="clickable-card">
            <h3>Comunidad LOBBA</h3>
            <p>Comparte, inspírate y conecta con otras apasionadas de la belleza</p>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default Home
