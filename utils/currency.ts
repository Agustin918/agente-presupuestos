import { TASA_CAMBIO_USD } from "../config/settings";

/**
 * Obtiene la cotización actualizada del Dólar Blue desde dolarapi.com.
 * @returns La cotización de venta del Blue o la tasa por defecto si falla.
 */
export async function fetchLiveExchangeRate(): Promise<number> {
  try {
    const response = await fetch('https://dolarapi.com/v1/dolares/blue');
    if (!response.ok) throw new Error('Error al consultar DolarAPI');
    const data = await response.json() as { venta: number };
    console.log(`[MarketIntel] Cotización Blue actualizada: $${data.venta}`);
    return data.venta;
  } catch (error) {
    console.error('[MarketIntel] No se pudo obtener cotización real, usando valor por defecto:', error);
    return TASA_CAMBIO_USD;
  }
}

/**
 * Convierte un monto de ARS a USD.
 * @param montoArs Monto en pesos argentinos.
 * @param tasa Opcional, tasa de cambio a usar. Si no se provee, usa la de settings.
 * @returns Monto convertido a USD.
 */
export function convertirArsAUsd(montoArs: number, tasa: number = TASA_CAMBIO_USD): number {
  if (montoArs <= 0) return 0;
  return Math.round((montoArs / tasa) * 100) / 100;
}

/**
 * Formatea un número como moneda.
 * @param valor El número a formatear.
 * @param currency La divisa (por defecto USD).
 * @returns String formateado.
 */
export function formatCurrency(valor: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}
