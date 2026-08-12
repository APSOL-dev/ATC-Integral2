-- Migración 004: Agregar columnas de bloqueo de usuarios por intentos fallidos
-- 1. Agregar columnas físicas a la tabla de usuarios
ALTER TABLE "atc_migración".usuarios ADD COLUMN IF NOT EXISTS intentos_fallidos INT DEFAULT 0;
ALTER TABLE "atc_migración".usuarios ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMPTZ DEFAULT NULL;

-- 2. Reconstruir la vista pública public.atc_usuarios_v
CREATE OR REPLACE VIEW public.atc_usuarios_v AS
SELECT 
    nombre_usuario AS "Nombre de usuario",
    password AS "Contraseña",
    perfil AS "Perfil",
    nro_vendedor AS "NRO_VENDEDOR",
    CASE WHEN activo THEN 'TRUE' ELSE 'FALSE' END AS "Activo",
    intentos_fallidos AS "Intentos fallidos",
    bloqueado_hasta AS "Bloqueado hasta"
FROM "atc_migración".usuarios;

-- 3. Reconstruir la función trigger INSTEAD OF
CREATE OR REPLACE FUNCTION public.atc_usuarios_v_instead_of_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO "atc_migración".usuarios (
            nombre_usuario, password, perfil, nro_vendedor, activo, intentos_fallidos, bloqueado_hasta
        ) VALUES (
            NEW."Nombre de usuario",
            COALESCE(NEW."Contraseña", 'ATC123'),
            NEW."Perfil",
            NEW."NRO_VENDEDOR",
            COALESCE(NEW."Activo" = 'TRUE' OR NEW."Activo" = 'true', TRUE),
            COALESCE(NEW."Intentos fallidos", 0),
            NEW."Bloqueado hasta"
        )
        ON CONFLICT (nombre_usuario) DO UPDATE SET
            password = EXCLUDED.password,
            perfil = EXCLUDED.perfil,
            nro_vendedor = EXCLUDED.nro_vendedor,
            activo = EXCLUDED.activo,
            intentos_fallidos = EXCLUDED.intentos_fallidos,
            bloqueado_hasta = EXCLUDED.bloqueado_hasta,
            updated_at = NOW();
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE "atc_migración".usuarios SET
            password = COALESCE(NEW."Contraseña", password),
            perfil = COALESCE(NEW."Perfil", perfil),
            nro_vendedor = NEW."NRO_VENDEDOR",
            activo = CASE WHEN NEW."Activo" = 'FALSE' OR NEW."Activo" = 'false' THEN FALSE ELSE TRUE END,
            intentos_fallidos = COALESCE(NEW."Intentos fallidos", intentos_fallidos),
            bloqueado_hasta = NEW."Bloqueado hasta",
            updated_at = NOW()
        WHERE nombre_usuario = OLD."Nombre de usuario";
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM "atc_migración".usuarios WHERE nombre_usuario = OLD."Nombre de usuario";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-asociar el trigger a la vista
DROP TRIGGER IF EXISTS trg_atc_usuarios_v ON public.atc_usuarios_v;
CREATE TRIGGER trg_atc_usuarios_v
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.atc_usuarios_v
FOR EACH ROW EXECUTE FUNCTION public.atc_usuarios_v_instead_of_func();
