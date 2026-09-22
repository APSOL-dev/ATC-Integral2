import { describe, it, expect } from 'vitest'
import { calculateOrderTotals, getMarcaDiscount, getBrandName } from './discountUtils.js'

describe('discountUtils: Cálculo de Descuentos por Marca y Descuento General', () => {

  const descuentosMarcaMock = {
    'Sinteplast': 15,
    'Alba': 10,
    'NETCOLOR': 25
  }

  describe('getBrandName', () => {
    it('debería retornar NombreMarca cuando MARCA es un ID numérico', () => {
      const prod = { MARCA: 144, NombreMarca: 'NETCOLOR', DESCRI: 'BARNIZ MARINO BTE. NETCOLOR- 1 - 144' }
      expect(getBrandName(prod)).toBe('NETCOLOR')
    })

    it('debería retornar la descripción si MARCA es un número y NombreMarca no está definido', () => {
      const prod = { MARCA: 144, DESCRI: 'BARNIZ MARINO BTE. NETCOLOR- 1 - 144' }
      expect(getBrandName(prod)).toBe('BARNIZ MARINO BTE. NETCOLOR- 1 - 144')
    })

    it('debería retornar MARCA si es un string', () => {
      const prod = { MARCA: 'Sinteplast' }
      expect(getBrandName(prod)).toBe('Sinteplast')
    })

    it('debería retornar string limpio si se pasa una cadena directamente', () => {
      expect(getBrandName(' Netcolor ')).toBe('Netcolor')
    })
  })

  describe('getMarcaDiscount', () => {
    it('debería retornar el porcentaje de descuento asignado a la marca sin importar mayúsculas/minúsculas ni espacios', () => {
      expect(getMarcaDiscount('Sinteplast', descuentosMarcaMock)).toBe(15)
      expect(getMarcaDiscount('sinteplast ', descuentosMarcaMock)).toBe(15)
      expect(getMarcaDiscount('ALBA', descuentosMarcaMock)).toBe(10)
    })

    it('debería resolver el descuento cuando se pasa un objeto con MARCA numérico y NombreMarca string', () => {
      const prod = { MARCA: 144, NombreMarca: 'NETCOLOR' }
      expect(getMarcaDiscount(prod, descuentosMarcaMock)).toBe(25)
    })

    it('debería resolver el descuento cuando se pasa un objeto con MARCA numérico y descripción con nombre de marca', () => {
      const prod = { MARCA: 144, DESCRI: 'BARNIZ MARINO BTE. NETCOLOR- 1 - 144' }
      expect(getMarcaDiscount(prod, descuentosMarcaMock)).toBe(25)
    })

    it('debería resolver el descuento por marca_id numérico cuando el mapa de descuentos contiene marca_id', () => {
      const descuentosArray = [
        { id: 1, marca_id: 144, marca: 'Netcolor', porcentaje: 25, activo: true },
        { id: 2, marca_id: 1, marca: 'Sinteplast', porcentaje: 15, activo: true }
      ]

      const itemConId = { IdMarca: 144, DESCRI: 'BARNIZ MARINO' }
      const itemConMARCA = { MARCA: 144 }

      expect(getMarcaDiscount(itemConId, descuentosArray)).toBe(25)
      expect(getMarcaDiscount(itemConMARCA, descuentosArray)).toBe(25)
    })

    it('debería retornar 0 si la marca no tiene descuento asignado o el mapa es nulo/vacío', () => {
      expect(getMarcaDiscount('Sherwin Williams', descuentosMarcaMock)).toBe(0)
      expect(getMarcaDiscount('Sinteplast', {})).toBe(0)
      expect(getMarcaDiscount('Sinteplast', null)).toBe(0)
    })
  })

  describe('calculateOrderTotals', () => {
    it('debería aplicar descuento general (19%) sobre el total bruto y descuento de marca sobre el importe con descuento general aplicado (Opción 2 en cascada)', () => {
      const items = [
        {
          'Item  codigo': '101',
          Precio: 1000,
          Cantidad: 2,
          Marca: 'Sinteplast',
          Descuento: 15 // Bruto 2000, Base con 19%: 1620, Desc. Marca 15%: 243
        },
        {
          'Item  codigo': '102',
          Precio: 1000,
          Cantidad: 1,
          Marca: 'Tersuave',
          Descuento: 0 // Bruto 1000, Desc. Marca: 0
        }
      ]

      const headerDiscount = 19 // 19% general del pedido a TODOS los productos (3000 * 19% = 570)

      const result = calculateOrderTotals(items, headerDiscount, descuentosMarcaMock)

      expect(result.subtotalBruto).toBe(3000)
      expect(result.montoDescGeneral).toBe(570) // 19% de 3000 completo
      expect(result.montoDescMarca).toBe(243) // 15% de 1620 (base de Sinteplast con 19% aplicado)
      expect(result.total).toBe(2187) // 3000 - 570 - 243 = 2187
    })

    it('debería calcular en cascada cuando todos los productos tienen descuento por marca', () => {
      const items = [
        { Precio: 1000, Cantidad: 1, Marca: 'Sinteplast', Descuento: 15 }, // Base 19%: 810 -> Desc marca 15%: 121.5
        { Precio: 2000, Cantidad: 1, Marca: 'Alba', Descuento: 10 }       // Base 19%: 1620 -> Desc marca 10%: 162
      ]

      const result = calculateOrderTotals(items, 19, descuentosMarcaMock)

      // Subtotal Bruto: 3000
      // Desc. General 19% sobre 3000: 570
      // Desc. Marca Total (121.5 + 162): 283.5
      // Total: 3000 - 570 - 283.5 = 2146.5
      expect(result.subtotalBruto).toBe(3000)
      expect(result.montoDescGeneral).toBe(570)
      expect(result.montoDescMarca).toBe(283.5)
      expect(result.total).toBe(2146.5)
    })

    it('debería calcular correctamente cuando ningún producto tiene descuento por marca', () => {
      const items = [
        { Precio: 1000, Cantidad: 2, Marca: 'Sherwin', Descuento: 0 }
      ]

      const result = calculateOrderTotals(items, 19, descuentosMarcaMock)

      expect(result.subtotalBruto).toBe(2000)
      expect(result.montoDescMarca).toBe(0)
      expect(result.montoDescGeneral).toBe(380) // 19% de 2000
      expect(result.total).toBe(1620)
    })
  })
})
