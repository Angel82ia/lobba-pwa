
DROP VIEW IF EXISTS vista_reportes_influencers;

CREATE OR REPLACE VIEW vista_reportes_influencers AS
SELECT 
  ci.codigo,
  ci.nombre_influencer,
  ci.email_influencer,
  ci.activo,
  COUNT(u.id) as total_registros,
  COUNT(CASE WHEN u.membership_active = TRUE THEN 1 END) as membresias_activas,
  COALESCE(
    SUM(
      CASE 
        WHEN u.membership_active = TRUE AND ms.amount IS NOT NULL 
        THEN ms.amount * 0.10 
        ELSE 0 
      END
    ), 
    0
  ) as comisiones_totales
FROM codigos_influencers ci
LEFT JOIN users u ON u.codigo_referido = ci.codigo
LEFT JOIN memberships ms ON ms.user_id = u.id AND ms.status = 'active'
WHERE ci.activo = TRUE
GROUP BY ci.codigo, ci.nombre_influencer, ci.email_influencer, ci.activo
ORDER BY total_registros DESC;

COMMENT ON VIEW vista_reportes_influencers IS 'Vista de reportes con métricas por código de influencer';
