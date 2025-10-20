
CREATE TABLE IF NOT EXISTS comisiones_influencers (
  id SERIAL PRIMARY KEY,
  influencer_id INT REFERENCES codigos_influencers(id) ON DELETE CASCADE,
  user_referido_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  tipo VARCHAR(20) NOT NULL,
  
  membership_payment_id INT NULL, -- ID del pago de cuota (si tipo = 'primera_cuota')
  order_id UUID NULL, -- ID del pedido (si tipo = 'compra')
  
  importe_base DECIMAL(10,2) NOT NULL, -- Importe original sobre el que se calcula
  porcentaje_comision DECIMAL(5,2) NOT NULL, -- % de comisión aplicado
  importe_comision DECIMAL(10,2) NOT NULL, -- Cantidad a pagar al influencer
  
  estado VARCHAR(20) DEFAULT 'pendiente',
  
  -- Timestamps
  fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_pago TIMESTAMP NULL,
  
  -- Constraints
  CONSTRAINT tipo_valido CHECK (tipo IN ('primera_cuota', 'compra')),
  CONSTRAINT estado_valido CHECK (estado IN ('pendiente', 'pagado', 'cancelado')),
  CONSTRAINT importes_positivos CHECK (
    importe_base > 0 AND 
    porcentaje_comision > 0 AND 
    importe_comision >= 0
  ),
  CONSTRAINT referencia_segun_tipo CHECK (
    (tipo = 'primera_cuota' AND membership_payment_id IS NOT NULL) OR
    (tipo = 'compra' AND order_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_com_influencer ON comisiones_influencers(influencer_id);
CREATE INDEX IF NOT EXISTS idx_com_user ON comisiones_influencers(user_referido_id);
CREATE INDEX IF NOT EXISTS idx_com_estado ON comisiones_influencers(estado);
CREATE INDEX IF NOT EXISTS idx_com_tipo ON comisiones_influencers(tipo);
CREATE INDEX IF NOT EXISTS idx_com_pendientes ON comisiones_influencers(influencer_id, estado) WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_com_fecha ON comisiones_influencers(fecha_generacion);

CREATE OR REPLACE VIEW vista_comisiones_influencers AS
SELECT 
  ci.codigo,
  ci.nombre_influencer,
  ci.email_influencer,
  COUNT(com.id) as total_comisiones,
  COUNT(CASE WHEN com.tipo = 'primera_cuota' THEN 1 END) as comisiones_cuotas,
  COUNT(CASE WHEN com.tipo = 'compra' THEN 1 END) as comisiones_compras,
  SUM(CASE WHEN com.estado = 'pendiente' THEN com.importe_comision ELSE 0 END) as total_pendiente,
  SUM(CASE WHEN com.estado = 'pagado' THEN com.importe_comision ELSE 0 END) as total_pagado,
  SUM(com.importe_comision) as total_comisiones_generadas
FROM codigos_influencers ci
LEFT JOIN comisiones_influencers com ON com.influencer_id = ci.id
WHERE ci.activo = TRUE
GROUP BY ci.id, ci.codigo, ci.nombre_influencer, ci.email_influencer
ORDER BY total_comisiones_generadas DESC;

COMMENT ON TABLE comisiones_influencers IS 'Registro de comisiones generadas para influencers (cuotas y compras)';
COMMENT ON COLUMN comisiones_influencers.tipo IS 'primera_cuota: Comisión por registro con código (10% de cuota). compra: Comisión por uso de código en compra';
COMMENT ON COLUMN comisiones_influencers.importe_base IS 'Importe original sobre el que se calcula la comisión';
COMMENT ON COLUMN comisiones_influencers.porcentaje_comision IS 'Porcentaje de comisión aplicado (10% para cuotas, variable para compras)';
COMMENT ON COLUMN comisiones_influencers.estado IS 'Estado del pago de la comisión';
COMMENT ON VIEW vista_comisiones_influencers IS 'Vista resumen de comisiones por influencer';
