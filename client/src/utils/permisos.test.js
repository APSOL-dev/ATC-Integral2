import { describe, it, expect } from 'vitest'
import { PERFILES, normalizePerfil, puedeDo, getSidebarItems } from './permisos.js'

// ---------------------------------------------------------------------------
// Deposito — solo visualización, sin escritura
// ---------------------------------------------------------------------------
describe('Permisos - Perfil Depósito', () => {
  it('debería normalizar correctamente el nombre del perfil', () => {
    expect(normalizePerfil('Deposito')).toBe('Deposito')
    expect(normalizePerfil('deposito')).toBe('Deposito')
    expect(normalizePerfil('depósito')).toBe('Deposito')
    expect(normalizePerfil('depósito / visualizador')).toBe('Deposito')
  })

  it('debería tener configurada la vista global de datos (soloPropio: false)', () => {
    expect(PERFILES.Deposito.soloPropio).toBe(false)
  })

  it('debería restringir la creación y modificación de pedidos', () => {
    expect(puedeDo('Deposito', 'pedidos', 'create')).toBe(false)
    expect(puedeDo('Deposito', 'pedidos', 'edit')).toBe(false)
    expect(puedeDo('Deposito', 'pedidos', 'delete')).toBe(false)
    expect(puedeDo('Deposito', 'pedidos', 'approve')).toBe(false)
    expect(puedeDo('Deposito', 'pedidos', 'anular')).toBe(false)
  })

  it('debería permitir la lectura de clientes y productos', () => {
    expect(puedeDo('Deposito', 'clientes', 'read')).toBe(true)
    expect(getSidebarItems('Deposito')).toContain('pedidos')
    expect(getSidebarItems('Deposito')).toContain('clientes')
    expect(getSidebarItems('Deposito')).toContain('productos')
  })

  it('debería bloquear el acceso a pagos y administración de usuarios', () => {
    expect(puedeDo('Deposito', 'pagos', 'read')).toBe(false)
    expect(puedeDo('Deposito', 'usuarios', 'read')).toBe(false)
    expect(getSidebarItems('Deposito')).not.toContain('usuarios')
    expect(getSidebarItems('Deposito')).not.toContain('selector')
  })
})

// ---------------------------------------------------------------------------
// AdministracionA — control total del sistema
// ---------------------------------------------------------------------------
describe('Permisos - Perfil AdministracionA', () => {
  it('normaliza variantes de nombre correctamente', () => {
    expect(normalizePerfil('AdministracionA')).toBe('AdministracionA')
    expect(normalizePerfil('administraciona')).toBe('AdministracionA')
    expect(normalizePerfil('administración full')).toBe('AdministracionA')
    expect(normalizePerfil('admin')).toBe('AdministracionA')
    expect(normalizePerfil('administrador')).toBe('AdministracionA')
  })

  it('tiene soloPropio: false (vista global)', () => {
    expect(PERFILES.AdministracionA.soloPropio).toBe(false)
  })

  it('puede crear, editar, borrar, aprobar, cerrar y anular pedidos', () => {
    expect(puedeDo('AdministracionA', 'pedidos', 'create')).toBe(true)
    expect(puedeDo('AdministracionA', 'pedidos', 'edit')).toBe(true)
    expect(puedeDo('AdministracionA', 'pedidos', 'delete')).toBe(true)
    expect(puedeDo('AdministracionA', 'pedidos', 'approve')).toBe(true)
    expect(puedeDo('AdministracionA', 'pedidos', 'close')).toBe(true)
    expect(puedeDo('AdministracionA', 'pedidos', 'anular')).toBe(true)
  })

  it('puede leer y editar usuarios', () => {
    expect(puedeDo('AdministracionA', 'usuarios', 'read')).toBe(true)
    expect(puedeDo('AdministracionA', 'usuarios', 'edit')).toBe(true)
  })

  it('puede leer y crear pagos', () => {
    expect(puedeDo('AdministracionA', 'pagos', 'read')).toBe(true)
    expect(puedeDo('AdministracionA', 'pagos', 'create')).toBe(true)
  })

  it('tiene acceso al sidebar completo (incluyendo usuarios y selector)', () => {
    const items = getSidebarItems('AdministracionA')
    expect(items).toContain('usuarios')
    expect(items).toContain('selector')
    expect(items).toContain('pedidos')
    expect(items).toContain('clientes')
    expect(items).toContain('pagos')
  })
})

// ---------------------------------------------------------------------------
// Administracion — gestión operativa global, sin borrado ni anulación
// ---------------------------------------------------------------------------
describe('Permisos - Perfil Administracion', () => {
  it('normaliza variantes de nombre correctamente', () => {
    expect(normalizePerfil('Administracion')).toBe('Administracion')
    expect(normalizePerfil('administración')).toBe('Administracion')
    expect(normalizePerfil('administración operativa')).toBe('Administracion')
  })

  it('tiene soloPropio: false (vista global)', () => {
    expect(PERFILES.Administracion.soloPropio).toBe(false)
  })

  it('puede crear, editar y aprobar pedidos', () => {
    expect(puedeDo('Administracion', 'pedidos', 'create')).toBe(true)
    expect(puedeDo('Administracion', 'pedidos', 'edit')).toBe(true)
    expect(puedeDo('Administracion', 'pedidos', 'approve')).toBe(true)
  })

  it('NO puede borrar pedidos pero SÍ puede anularlos (presupuestos 0.0)', () => {
    expect(puedeDo('Administracion', 'pedidos', 'delete')).toBe(false)
    expect(puedeDo('Administracion', 'pedidos', 'anular')).toBe(true)
  })

  it('puede leer usuarios pero NO editar clientes', () => {
    expect(puedeDo('Administracion', 'usuarios', 'read')).toBe(true)
    expect(puedeDo('Administracion', 'clientes', 'edit')).toBe(false)
  })

  it('tiene acceso a usuarios y selector en el sidebar', () => {
    const items = getSidebarItems('Administracion')
    expect(items).toContain('usuarios')
    expect(items).toContain('selector')
  })
})

// ---------------------------------------------------------------------------
// VendedorCalle — gestión de pedidos propia, sin acceso a pagos/usuarios
// ---------------------------------------------------------------------------
describe('Permisos - Perfil VendedorCalle', () => {
  it('normaliza variantes de nombre correctamente', () => {
    expect(normalizePerfil('VendedorCalle')).toBe('VendedorCalle')
    expect(normalizePerfil('vendedor calle')).toBe('VendedorCalle')
    expect(normalizePerfil('Vendedor Calle')).toBe('VendedorCalle')
    expect(normalizePerfil('vendedor de calle')).toBe('VendedorCalle')
  })

  it('tiene soloPropio: true (RESTRICCIÓN CLAVE: solo ve sus datos)', () => {
    expect(PERFILES.VendedorCalle.soloPropio).toBe(true)
  })

  it('puede crear, editar, borrar y aprobar pedidos propios', () => {
    expect(puedeDo('VendedorCalle', 'pedidos', 'create')).toBe(true)
    expect(puedeDo('VendedorCalle', 'pedidos', 'edit')).toBe(true)
    expect(puedeDo('VendedorCalle', 'pedidos', 'delete')).toBe(true)
    expect(puedeDo('VendedorCalle', 'pedidos', 'approve')).toBe(true)
  })

  it('NO puede cerrar ni anular pedidos', () => {
    expect(puedeDo('VendedorCalle', 'pedidos', 'close')).toBe(false)
    expect(puedeDo('VendedorCalle', 'pedidos', 'anular')).toBe(false)
  })

  it('NO puede leer pagos ni usuarios', () => {
    expect(puedeDo('VendedorCalle', 'pagos', 'read')).toBe(false)
    expect(puedeDo('VendedorCalle', 'usuarios', 'read')).toBe(false)
  })

  it('NO tiene usuarios, selector ni pagos en el sidebar', () => {
    const items = getSidebarItems('VendedorCalle')
    expect(items).not.toContain('usuarios')
    expect(items).not.toContain('selector')
    expect(items).not.toContain('pagos')
  })
})

// ---------------------------------------------------------------------------
// SuperVendedor — como Vendedor Calle pero con vista global (soloPropio: false)
// ---------------------------------------------------------------------------
describe('Permisos - Perfil SuperVendedor', () => {
  it('normaliza variantes de nombre correctamente', () => {
    expect(normalizePerfil('SuperVendedor')).toBe('SuperVendedor')
    expect(normalizePerfil('super vendedor')).toBe('SuperVendedor')
    expect(normalizePerfil('supervendedor')).toBe('SuperVendedor')
  })

  it('tiene soloPropio: false (DIFERENCIA CLAVE vs VendedorCalle: ve todo)', () => {
    expect(PERFILES.SuperVendedor.soloPropio).toBe(false)
  })

  it('puede crear, editar, borrar y aprobar pedidos', () => {
    expect(puedeDo('SuperVendedor', 'pedidos', 'create')).toBe(true)
    expect(puedeDo('SuperVendedor', 'pedidos', 'edit')).toBe(true)
    expect(puedeDo('SuperVendedor', 'pedidos', 'delete')).toBe(true)
    expect(puedeDo('SuperVendedor', 'pedidos', 'approve')).toBe(true)
  })

  it('NO puede cerrar ni anular pedidos (igual que VendedorCalle)', () => {
    expect(puedeDo('SuperVendedor', 'pedidos', 'close')).toBe(false)
    expect(puedeDo('SuperVendedor', 'pedidos', 'anular')).toBe(false)
  })

  it('NO puede leer pagos ni usuarios', () => {
    expect(puedeDo('SuperVendedor', 'pagos', 'read')).toBe(false)
    expect(puedeDo('SuperVendedor', 'usuarios', 'read')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Casos borde generales — normalizePerfil
// ---------------------------------------------------------------------------
describe('Permisos - normalizePerfil (casos borde)', () => {
  it('perfil desconocido retorna la cadena original sin modificar', () => {
    expect(normalizePerfil('PerfilInventado')).toBe('PerfilInventado')
  })

  it('null → VendedorCalle como default', () => {
    expect(normalizePerfil(null)).toBe('VendedorCalle')
  })

  it('undefined → VendedorCalle como default', () => {
    expect(normalizePerfil(undefined)).toBe('VendedorCalle')
  })

  it('string vacío → VendedorCalle como default', () => {
    expect(normalizePerfil('')).toBe('VendedorCalle')
  })
})
