import PropTypes from 'prop-types'
import { Card } from '../../components/common'

const DesignCard = ({ design, onClick }) => {
  const renderStars = (rating) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
        >
          ★
        </span>
      )
    }
    return stars
  }

  return (
    <Card 
      padding="none" 
      className="cursor-pointer overflow-hidden group"
      hover
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
        <img 
          src={design.preview_image_url} 
          alt={design.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white">
            {design.type === 'nails' ? '💅 Uñas' : '💇 Peinado'}
          </span>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1">
          {design.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex text-lg">
            {renderStars(Math.round(design.average_rating))}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({design.rating_count})
          </span>
        </div>

        {/* Likes */}
        <div className="flex items-center gap-1 text-red-500">
          <span>❤️</span>
          <span className="font-semibold">{design.likes_count}</span>
        </div>
      </div>
    </Card>
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
