import PropTypes from 'prop-types'
import './DesignCard.css'

const DesignCard = ({ design, onClick }) => {
  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rating ? 'star filled' : 'star'}>
          ★
        </span>
      )
    }
    return stars
  }

  return (
    <div className="design-card" onClick={onClick}>
      <div className="design-image">
        <img src={design.preview_image_url} alt={design.name} />
      </div>
      
      <div className="design-info">
        <h3>{design.name}</h3>
        
        <div className="design-type">
          {design.type === 'nails' ? '💅 Uñas' : '💇 Peinado'}
        </div>

        <div className="design-rating">
          <div className="stars">
            {renderStars(Math.round(design.average_rating))}
          </div>
          <span className="rating-count">
            ({design.rating_count} {design.rating_count === 1 ? 'valoración' : 'valoraciones'})
          </span>
        </div>

        <div className="design-likes">
          ❤️ {design.likes_count}
        </div>
      </div>
    </div>
  )
}

DesignCard.propTypes = {
  design: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    preview_image_url: PropTypes.string,
    average_rating: PropTypes.number,
    rating_count: PropTypes.number,
    likes_count: PropTypes.number
  }).isRequired,
  onClick: PropTypes.func.isRequired
}

export default DesignCard
