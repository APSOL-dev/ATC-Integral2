-- Migración 003: Agregar columna "Fecha de envio" a la tabla física y vista pública de pedidos

-- 1. Agregar columna física fecha_envio a la tabla atc_migración.pedidos
ALTER TABLE "atc_migración".pedidos ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMPTZ;

-- 2. Reconstruir vista pública public.atc_pedidos_v con "Fecha de envio"
CREATE OR REPLACE VIEW public.atc_pedidos_v AS
SELECT 
    id_pedido AS "IDPedido",
    cliente AS "Cliente",
    CASE WHEN cliente_en_bd THEN 'TRUE' ELSE 'FALSE' END AS "Cliente en BD?",
    fecha_hora AS "Fecha y hora",
    direccion_cliente AS "Dirección cliente",
    nombre AS "Nombre",
    razon_social_no_bd AS "Razón social (NO BD)",
    celular_contacto AS "Celular de contacto",
    porcentaje_descuento AS "Porcentaje de descuento (%)",
    observaciones AS "Observaciones",
    emitido_por AS "Emitido por",
    emitido_por_con_fecha AS "Emitido por con fecha",
    emitido_fecha AS "Emitido Fecha",
    lugar_entrega AS "Lugar de entrega",
    deposito_prepara AS "Deposito que prepara",
    fecha_envio AS "Fecha de envio",
    fecha_envio AS "Fecha de envío",
    creado_por AS "Creado por",
    total AS "Total",
    fecha_ultima_modificacion AS "Fecha_Ultima_Modificacion",
    fecha_ultima_modificacion AS "Fecha y Hora de Última Modificación",
    estado AS "Estado",
    vendedor AS "Vendedor"
FROM "atc_migración".pedidos;

-- 3. Reconstruir Trigger INSTEAD OF con soporte para "Fecha de envio"
CREATE OR REPLACE FUNCTION public.atc_pedidos_v_instead_of_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO "atc_migración".pedidos (
            id_pedido, cliente, cliente_en_bd, fecha_hora, direccion_cliente, nombre,
            razon_social_no_bd, celular_contacto, porcentaje_descuento, observaciones,
            emitido_por, emitido_por_con_fecha, emitido_fecha, lugar_entrega, deposito_prepara,
            fecha_envio, creado_por, total, fecha_ultima_modificacion, estado, vendedor
        ) VALUES (
            NEW."IDPedido", NEW."Cliente", COALESCE(NEW."Cliente en BD?" = 'TRUE', TRUE),
            COALESCE(NEW."Fecha y hora"::timestamptz, NOW()), NEW."Dirección cliente", NEW."Nombre",
            NEW."Razón social (NO BD)", NEW."Celular de contacto", COALESCE(NEW."Porcentaje de descuento (%)"::numeric, 0),
            NEW."Observaciones", NEW."Emitido por", NEW."Emitido por con fecha",
            COALESCE(NEW."Emitido Fecha"::timestamptz, NOW()), NEW."Lugar de entrega", NEW."Deposito que prepara",
            COALESCE(NEW."Fecha de envio"::timestamptz, NEW."Fecha de envío"::timestamptz),
            NEW."Creado por", COALESCE(NEW."Total"::numeric, 0), NOW(),
            COALESCE(NEW."Estado", '0'), NEW."Vendedor"
        )
        ON CONFLICT (id_pedido) DO UPDATE SET
            cliente = EXCLUDED.cliente,
            cliente_en_bd = EXCLUDED.cliente_en_bd,
            fecha_hora = EXCLUDED.fecha_hora,
            direccion_cliente = EXCLUDED.direccion_cliente,
            nombre = EXCLUDED.nombre,
            razon_social_no_bd = EXCLUDED.razon_social_no_bd,
            celular_contacto = EXCLUDED.celular_contacto,
            porcentaje_descuento = EXCLUDED.porcentaje_descuento,
            observaciones = EXCLUDED.observaciones,
            emitido_por = EXCLUDED.emitido_por,
            emitido_por_con_fecha = EXCLUDED.emitido_por_con_fecha,
            emitido_fecha = EXCLUDED.emitido_fecha,
            lugar_entrega = EXCLUDED.lugar_entrega,
            deposito_prepara = EXCLUDED.deposito_prepara,
            fecha_envio = EXCLUDED.fecha_envio,
            creado_por = EXCLUDED.creado_por,
            total = EXCLUDED.total,
            fecha_ultima_modificacion = NOW(),
            estado = EXCLUDED.estado,
            vendedor = EXCLUDED.vendedor;
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE "atc_migración".pedidos SET
            cliente = COALESCE(NEW."Cliente", cliente),
            cliente_en_bd = CASE WHEN NEW."Cliente en BD?" IS NOT NULL THEN (NEW."Cliente en BD?" = 'TRUE') ELSE cliente_en_bd END,
            direccion_cliente = COALESCE(NEW."Dirección cliente", direccion_cliente),
            nombre = COALESCE(NEW."Nombre", nombre),
            razon_social_no_bd = COALESCE(NEW."Razón social (NO BD)", razon_social_no_bd),
            celular_contacto = COALESCE(NEW."Celular de contacto", celular_contacto),
            porcentaje_descuento = COALESCE(NEW."Porcentaje de descuento (%)"::numeric, porcentaje_descuento),
            observaciones = COALESCE(NEW."Observaciones", observaciones),
            emitido_por = COALESCE(NEW."Emitido por", emitido_por),
            emitido_por_con_fecha = COALESCE(NEW."Emitido por con fecha", emitido_por_con_fecha),
            lugar_entrega = COALESCE(NEW."Lugar de entrega", lugar_entrega),
            deposito_prepara = COALESCE(NEW."Deposito que prepara", deposito_prepara),
            fecha_envio = CASE WHEN NEW."Fecha de envio" IS NOT NULL THEN NEW."Fecha de envio"::timestamptz ELSE fecha_envio END,
            total = COALESCE(NEW."Total"::numeric, total),
            fecha_ultima_modificacion = NOW(),
            estado = COALESCE(NEW."Estado", estado),
            vendedor = COALESCE(NEW."Vendedor", vendedor)
        WHERE id_pedido = OLD."IDPedido";
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM "atc_migración".pedidos WHERE id_pedido = OLD."IDPedido";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_atc_pedidos_v ON public.atc_pedidos_v;
CREATE TRIGGER trg_atc_pedidos_v
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.atc_pedidos_v
FOR EACH ROW EXECUTE FUNCTION public.atc_pedidos_v_instead_of_func();
