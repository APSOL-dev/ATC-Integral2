-- Migración 001: Esquema aislado "atc_migración", tablas físicas, vistas públicas y Triggers INSTEAD OF

-- 1. Crear esquema aislado dedicado a ATC Migración
CREATE SCHEMA IF NOT EXISTS "atc_migración";

-- 2. Crear tabla física de Usuarios en atc_migración
CREATE TABLE IF NOT EXISTS "atc_migración".usuarios (
    nombre_usuario TEXT PRIMARY KEY,
    password TEXT NOT NULL DEFAULT 'ATC123',
    perfil TEXT NOT NULL,
    nro_vendedor TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar usuario administrador por defecto si la tabla está vacía
INSERT INTO "atc_migración".usuarios (nombre_usuario, password, perfil, nro_vendedor, activo)
VALUES ('Admin', '1234', 'Administracion', NULL, TRUE)
ON CONFLICT (nombre_usuario) DO NOTHING;

-- 3. Crear tabla física de Pedidos Borrador en atc_migración
CREATE TABLE IF NOT EXISTS "atc_migración".pedidos (
    id_pedido INT PRIMARY KEY,
    cliente TEXT,
    cliente_en_bd BOOLEAN DEFAULT TRUE,
    fecha_hora TIMESTAMPTZ DEFAULT NOW(),
    direccion_cliente TEXT,
    nombre TEXT,
    razon_social_no_bd TEXT,
    celular_contacto TEXT,
    porcentaje_descuento NUMERIC(5,2) DEFAULT 0,
    observaciones TEXT,
    emitido_por TEXT,
    emitido_por_con_fecha TEXT,
    emitido_fecha TIMESTAMPTZ DEFAULT NOW(),
    lugar_entrega TEXT,
    deposito_prepara TEXT,
    creado_por TEXT,
    total NUMERIC(15,2) DEFAULT 0,
    fecha_ultima_modificacion TIMESTAMPTZ DEFAULT NOW(),
    estado TEXT DEFAULT '0',
    vendedor TEXT
);

-- 4. Crear tabla física de Detalles de Pedidos en atc_migración
CREATE TABLE IF NOT EXISTS "atc_migración".detalles_pedidos (
    id_detalle TEXT PRIMARY KEY,
    id_pedido INT REFERENCES "atc_migración".pedidos(id_pedido) ON DELETE CASCADE,
    item_codigo TEXT,
    nombre_item TEXT,
    cantidad NUMERIC(12,4) DEFAULT 0,
    descuento NUMERIC(5,2) DEFAULT 0,
    precio NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) DEFAULT 0,
    monto_descuento NUMERIC(15,2) DEFAULT 0,
    total NUMERIC(15,2) DEFAULT 0,
    stock_al_cargar NUMERIC(12,4) DEFAULT 0,
    proveedor TEXT
);

-- ============================================================================
-- VISTAS PÚBLICAS Y TRIGGERS INSTEAD OF
-- ============================================================================

-- Vista Pública: public.atc_usuarios_v
CREATE OR REPLACE VIEW public.atc_usuarios_v AS
SELECT 
    nombre_usuario AS "Nombre de usuario",
    password AS "Contraseña",
    perfil AS "Perfil",
    nro_vendedor AS "NRO_VENDEDOR",
    CASE WHEN activo THEN 'TRUE' ELSE 'FALSE' END AS "Activo"
FROM "atc_migración".usuarios;

-- Trigger INSTEAD OF en public.atc_usuarios_v
CREATE OR REPLACE FUNCTION public.atc_usuarios_v_instead_of_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO "atc_migración".usuarios (
            nombre_usuario, password, perfil, nro_vendedor, activo
        ) VALUES (
            NEW."Nombre de usuario",
            COALESCE(NEW."Contraseña", 'ATC123'),
            NEW."Perfil",
            NEW."NRO_VENDEDOR",
            COALESCE(NEW."Activo" = 'TRUE' OR NEW."Activo" = 'true', TRUE)
        )
        ON CONFLICT (nombre_usuario) DO UPDATE SET
            password = EXCLUDED.password,
            perfil = EXCLUDED.perfil,
            nro_vendedor = EXCLUDED.nro_vendedor,
            activo = EXCLUDED.activo,
            updated_at = NOW();
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE "atc_migración".usuarios SET
            password = COALESCE(NEW."Contraseña", password),
            perfil = COALESCE(NEW."Perfil", perfil),
            nro_vendedor = NEW."NRO_VENDEDOR",
            activo = CASE WHEN NEW."Activo" = 'FALSE' OR NEW."Activo" = 'false' THEN FALSE ELSE TRUE END,
            updated_at = NOW()
        WHERE nombre_usuario = OLD."Nombre de usuario";
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM "atc_migración".usuarios WHERE nombre_usuario = OLD."Nombre de usuario";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atc_usuarios_v ON public.atc_usuarios_v;
CREATE TRIGGER trg_atc_usuarios_v
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.atc_usuarios_v
FOR EACH ROW EXECUTE FUNCTION public.atc_usuarios_v_instead_of_func();


-- Vista Pública: public.atc_pedidos_v
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
    creado_por AS "Creado por",
    total AS "Total",
    fecha_ultima_modificacion AS "Fecha_Ultima_Modificacion",
    fecha_ultima_modificacion AS "Fecha y Hora de Última Modificación",
    estado AS "Estado",
    vendedor AS "Vendedor"
FROM "atc_migración".pedidos;

-- Trigger INSTEAD OF en public.atc_pedidos_v
CREATE OR REPLACE FUNCTION public.atc_pedidos_v_instead_of_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO "atc_migración".pedidos (
            id_pedido, cliente, cliente_en_bd, fecha_hora, direccion_cliente, nombre,
            razon_social_no_bd, celular_contacto, porcentaje_descuento, observaciones,
            emitido_por, emitido_por_con_fecha, emitido_fecha, lugar_entrega, deposito_prepara,
            creado_por, total, fecha_ultima_modificacion, estado, vendedor
        ) VALUES (
            NEW."IDPedido", NEW."Cliente", COALESCE(NEW."Cliente en BD?" = 'TRUE', TRUE),
            COALESCE(NEW."Fecha y hora"::timestamptz, NOW()), NEW."Dirección cliente", NEW."Nombre",
            NEW."Razón social (NO BD)", NEW."Celular de contacto", COALESCE(NEW."Porcentaje de descuento (%)"::numeric, 0),
            NEW."Observaciones", NEW."Emitido por", NEW."Emitido por con fecha",
            COALESCE(NEW."Emitido Fecha"::timestamptz, NOW()), NEW."Lugar de entrega", NEW."Deposito que prepara",
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atc_pedidos_v ON public.atc_pedidos_v;
CREATE TRIGGER trg_atc_pedidos_v
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.atc_pedidos_v
FOR EACH ROW EXECUTE FUNCTION public.atc_pedidos_v_instead_of_func();


-- Vista Pública: public.atc_detalles_pedidos_v
CREATE OR REPLACE VIEW public.atc_detalles_pedidos_v AS
SELECT 
    id_detalle AS "IDDetalle",
    id_pedido AS "IDPedido",
    item_codigo AS "Codigo (más alla de si es item o nombre)",
    nombre_item AS "Nombre (más alla de si es item o nombre)",
    item_codigo AS "Item  codigo",
    nombre_item AS "Nombre item",
    cantidad AS "Cantidad",
    descuento AS "Descuento",
    precio AS "Precio",
    subtotal AS "Subtotal (precio x cantidad)",
    monto_descuento AS "Monto del descuento",
    total AS "Total (subtotal - monto del descuento)",
    stock_al_cargar AS "Stock al momento de cargar",
    proveedor AS "Proveedor"
FROM "atc_migración".detalles_pedidos;

-- Trigger INSTEAD OF en public.atc_detalles_pedidos_v
CREATE OR REPLACE FUNCTION public.atc_detalles_pedidos_v_instead_of_func()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO "atc_migración".detalles_pedidos (
            id_detalle, id_pedido, item_codigo, nombre_item, cantidad,
            descuento, precio, subtotal, monto_descuento, total,
            stock_al_cargar, proveedor
        ) VALUES (
            NEW."IDDetalle", NEW."IDPedido"::int,
            COALESCE(NEW."Codigo (más alla de si es item o nombre)", NEW."Item  codigo"),
            COALESCE(NEW."Nombre (más alla de si es item o nombre)", NEW."Nombre item"),
            COALESCE(NEW."Cantidad"::numeric, 0), COALESCE(NEW."Descuento"::numeric, 0),
            COALESCE(NEW."Precio"::numeric, 0), COALESCE(NEW."Subtotal (precio x cantidad)"::numeric, 0),
            COALESCE(NEW."Monto del descuento"::numeric, 0), COALESCE(NEW."Total (subtotal - monto del descuento)"::numeric, 0),
            COALESCE(NEW."Stock al momento de cargar"::numeric, 0), NEW."Proveedor"
        )
        ON CONFLICT (id_detalle) DO UPDATE SET
            cantidad = EXCLUDED.cantidad,
            descuento = EXCLUDED.descuento,
            precio = EXCLUDED.precio,
            subtotal = EXCLUDED.subtotal,
            total = EXCLUDED.total,
            stock_al_cargar = EXCLUDED.stock_al_cargar,
            proveedor = EXCLUDED.proveedor;
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE "atc_migración".detalles_pedidos SET
            cantidad = COALESCE(NEW."Cantidad"::numeric, cantidad),
            descuento = COALESCE(NEW."Descuento"::numeric, descuento),
            precio = COALESCE(NEW."Precio"::numeric, precio),
            subtotal = COALESCE(NEW."Subtotal (precio x cantidad)"::numeric, subtotal),
            total = COALESCE(NEW."Total (subtotal - monto del descuento)"::numeric, total),
            stock_al_cargar = COALESCE(NEW."Stock al momento de cargar"::numeric, stock_al_cargar),
            proveedor = COALESCE(NEW."Proveedor", proveedor)
        WHERE id_detalle = OLD."IDDetalle";
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM "atc_migración".detalles_pedidos WHERE id_detalle = OLD."IDDetalle";
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_atc_detalles_pedidos_v ON public.atc_detalles_pedidos_v;
CREATE TRIGGER trg_atc_detalles_pedidos_v
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.atc_detalles_pedidos_v
FOR EACH ROW EXECUTE FUNCTION public.atc_detalles_pedidos_v_instead_of_func();
