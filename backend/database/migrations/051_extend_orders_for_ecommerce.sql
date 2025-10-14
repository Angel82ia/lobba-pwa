
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS seller VARCHAR(20) DEFAULT 'LOBBA',
  ADD COLUMN IF NOT EXISTS type VARCHAR(30) DEFAULT 'product_order';

CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);

COMMENT ON COLUMN orders.seller IS 'Vendedor del producto/servicio. LOBBA para productos propios, nombre salón para servicios marketplace';
COMMENT ON COLUMN orders.type IS 'Tipo de orden: product_order (ecommerce), service_booking (marketplace), membership_payment (suscripción)';
