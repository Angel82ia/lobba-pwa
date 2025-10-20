
CREATE TABLE IF NOT EXISTS uso_codigos_descuento (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  codigo_descuento_id INT REFERENCES codigos_descuento(id) ON DELETE SET NULL,
  order_id UUID NULL, -- Referencia al pedido (puede ser UUID o INT según tu tabla orders)
  
  importe_pedido DECIMAL(10,2) NOT NULL,
  
  descuento_base_membresia DECIMAL(5,2) NOT NULL, -- 10% o 15% según membresía
  descuento_codigo DECIMAL(5,2) NOT NULL, -- 10% del código
  descuento_total_aplicado DECIMAL(5,2) NOT NULL, -- Suma total (máx 25%)
  
  importe_descuento DECIMAL(10,2) NOT NULL, -- Cantidad en € descontada
  importe_final DECIMAL(10,2) NOT NULL, -- Precio final pagado
  
  comision_influencer DECIMAL(10,2) NOT NULL,
  
  fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT uso_unico_por_usuario UNIQUE(user_id),
  
  CONSTRAINT descuento_maximo CHECK (descuento_total_aplicado <= 25.00),
  
  CONSTRAINT importes_positivos CHECK (
    importe_pedido > 0 AND 
    importe_descuento >= 0 AND 
    importe_final >= 0 AND 
    comision_influencer >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_uso_user ON uso_codigos_descuento(user_id);
CREATE INDEX IF NOT EXISTS idx_uso_codigo ON uso_codigos_descuento(codigo_descuento_id);
CREATE INDEX IF NOT EXISTS idx_uso_fecha ON uso_codigos_descuento(fecha_uso);
CREATE INDEX IF NOT EXISTS idx_uso_order ON uso_codigos_descuento(order_id);

COMMENT ON TABLE uso_codigos_descuento IS 'Registro de uso de códigos de descuento en compras - USO ÚNICO por usuario';
COMMENT ON CONSTRAINT uso_unico_por_usuario ON uso_codigos_descuento IS 'CRÍTICO: Un usuario solo puede usar UN código de descuento en toda su vida';
COMMENT ON COLUMN uso_codigos_descuento.descuento_base_membresia IS 'Descuento automático de membresía (10% Essential / 15% Spirit)';
COMMENT ON COLUMN uso_codigos_descuento.descuento_codigo IS 'Descuento adicional del código (típicamente 10%)';
COMMENT ON COLUMN uso_codigos_descuento.descuento_total_aplicado IS 'Suma total de descuentos aplicados (máximo 25%)';
COMMENT ON COLUMN uso_codigos_descuento.comision_influencer IS 'Comisión calculada para el influencer';
