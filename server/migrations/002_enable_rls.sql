-- Migración 002: Habilitación de Row Level Security (RLS) en el esquema "atc_migración"

-- 1. Habilitar RLS en las tablas físicas de "atc_migración"
ALTER TABLE "atc_migración".usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE "atc_migración".pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE "atc_migración".detalles_pedidos ENABLE ROW LEVEL SECURITY;

-- 2. Crear políticas RLS para la aplicación ATC
DROP POLICY IF EXISTS "atc_usuarios_policy" ON "atc_migración".usuarios;
CREATE POLICY "atc_usuarios_policy" ON "atc_migración".usuarios
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "atc_pedidos_policy" ON "atc_migración".pedidos;
CREATE POLICY "atc_pedidos_policy" ON "atc_migración".pedidos
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "atc_detalles_pedidos_policy" ON "atc_migración".detalles_pedidos;
CREATE POLICY "atc_detalles_pedidos_policy" ON "atc_migración".detalles_pedidos
FOR ALL
TO public, anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- 3. Marcar las funciones de los triggers como SECURITY DEFINER
-- Esto garantiza que la vista pública pueda manipular datos en atc_migración de forma segura
ALTER FUNCTION public.atc_usuarios_v_instead_of_func() SECURITY DEFINER;
ALTER FUNCTION public.atc_pedidos_v_instead_of_func() SECURITY DEFINER;
ALTER FUNCTION public.atc_detalles_pedidos_v_instead_of_func() SECURITY DEFINER;
