
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  template_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  notification_type VARCHAR(50) NOT NULL CHECK (
    notification_type IN ('email', 'whatsapp', 'push', 'sms')
  ),
  
  subject VARCHAR(255),
  body_template TEXT NOT NULL,
  
  available_variables JSONB,
  
  is_active BOOLEAN DEFAULT true,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_key 
  ON notification_templates(template_key);

CREATE INDEX IF NOT EXISTS idx_notification_templates_type 
  ON notification_templates(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_templates_active 
  ON notification_templates(is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_updated_at();

INSERT INTO notification_templates (template_key, name, notification_type, subject, body_template, available_variables) VALUES
('reservation_created', 'Reserva Creada', 'email', 
 'Reserva creada - {{salon_name}}',
 'Hola {{user_name}},\n\nTu reserva ha sido creada:\n- Salón: {{salon_name}}\n- Servicio: {{service_name}}\n- Fecha: {{start_time}}\n- Precio: {{total_price}}€\n\nEstado: {{status}}\n\n¡Gracias!',
 '["user_name", "salon_name", "service_name", "start_time", "total_price", "status"]'::jsonb
),

('reservation_confirmed', 'Reserva Confirmada', 'whatsapp',
 NULL,
 '✅ *Reserva Confirmada*\n\nHola {{user_name}}, tu reserva en *{{salon_name}}* ha sido confirmada.\n\n📅 Fecha: {{start_time}}\n💇 Servicio: {{service_name}}\n💰 Precio: {{total_price}}€\n\n¡Te esperamos!',
 '["user_name", "salon_name", "service_name", "start_time", "total_price"]'::jsonb
),

('reservation_reminder', 'Recordatorio de Reserva', 'whatsapp',
 NULL,
 '⏰ *Recordatorio*\n\nHola {{user_name}}, te recordamos tu cita:\n\n📍 {{salon_name}}\n💇 {{service_name}}\n📅 {{start_time}}\n\nNos vemos pronto!',
 '["user_name", "salon_name", "service_name", "start_time"]'::jsonb
),

('reservation_cancelled', 'Reserva Cancelada', 'email',
 'Reserva cancelada - {{salon_name}}',
 'Hola {{user_name}},\n\nTu reserva ha sido cancelada:\n- Salón: {{salon_name}}\n- Fecha: {{start_time}}\n- Razón: {{reason}}\n\nSi realizaste un pago, se procesará el reembolso en 5-10 días hábiles.\n\n¡Esperamos verte pronto!',
 '["user_name", "salon_name", "start_time", "reason"]'::jsonb
),

('reservation_modified', 'Reserva Modificada', 'email',
 'Reserva modificada - {{salon_name}}',
 'Hola {{user_name}},\n\nTu reserva ha sido modificada:\n\nAntes:\n- Fecha: {{old_start_time}}\n- Servicio: {{old_service_name}}\n\nAhora:\n- Fecha: {{new_start_time}}\n- Servicio: {{new_service_name}}\n\n¡Gracias!',
 '["user_name", "salon_name", "old_start_time", "old_service_name", "new_start_time", "new_service_name"]'::jsonb
),

('new_reservation_salon', 'Nueva Reserva (Salón)', 'email',
 'Nueva reserva - {{service_name}}',
 'Hola,\n\nNueva reserva recibida:\n- Cliente: {{user_name}} ({{user_email}})\n- Servicio: {{service_name}}\n- Fecha: {{start_time}}\n- Precio: {{total_price}}€\n- Estado: {{status}}\n\nAccede al panel para gestionar.',
 '["user_name", "user_email", "service_name", "start_time", "total_price", "status"]'::jsonb
),

('reservation_confirmed_salon', 'Reserva Confirmada (Salón)', 'push',
 'Reserva confirmada',
 'Cliente {{user_name}} confirmado para {{service_name}} el {{start_time}}',
 '["user_name", "service_name", "start_time"]'::jsonb
);

COMMENT ON TABLE notification_templates IS 'Templates de notificaciones reutilizables';
COMMENT ON COLUMN notification_templates.template_key IS 'Clave única del template (ej: reservation_confirmed)';
COMMENT ON COLUMN notification_templates.body_template IS 'Template con variables {{variable_name}}';
COMMENT ON COLUMN notification_templates.available_variables IS 'Array JSON de variables disponibles';
