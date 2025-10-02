CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  base_cost DECIMAL(10, 2) NOT NULL,
  estimated_days VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO shipping_methods (name, code, description, base_cost, estimated_days) VALUES
  ('Envío Estándar', 'standard', 'Envío estándar a domicilio', 4.99, '3-5 días'),
  ('Envío Exprés', 'express', 'Envío rápido en 24-48h', 9.99, '24-48h'),
  ('Click & Collect', 'click_collect', 'Recogida en salón asociado', 0.00, 'Inmediato');
