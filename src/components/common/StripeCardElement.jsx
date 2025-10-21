import PropTypes from 'prop-types'
import { CardElement } from '@stripe/react-stripe-js'
import { useCardElementOptions } from '../../hooks/useStripePayment'

const StripeCardElement = ({ className = '', showSecurityMessage = true }) => {
  const cardElementOptions = useCardElementOptions()

  return (
    <div>
      <div className={`p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus-within:border-[#FF1493] transition-colors ${className}`}>
        <CardElement options={cardElementOptions} />
      </div>
      {showSecurityMessage && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          🔒 Pago seguro procesado por Stripe
        </p>
      )}
    </div>
  )
}

StripeCardElement.propTypes = {
  className: PropTypes.string,
  showSecurityMessage: PropTypes.bool,
}

export default StripeCardElement
