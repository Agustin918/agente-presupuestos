import { Blueprint } from "../blueprint/schema";

/**
 * Motor de Logística v1.0
 * Calcula sobrecostos por distancia y complejidad geográfica.
 */

// Punto de origen: Centro Logístico Avellaneda (Zona de Corralones/Distribución)
const HUB_LAT = -34.6644;
const HUB_LNG = -58.3611;

export interface LogisticsReport {
    distancia_km: number;
    indice_logistico: number; // Multiplicador (1.0 = base)
    costo_flete_estimado: number;
    alertas: string[];
}

export class LogisticsEngine {
    
    /**
     * Calcula la distancia entre dos puntos (Haversine formula)
     */
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Procesa la ubicación del blueprint y devuelve el reporte logístico
     */
    static async analyze(blueprint: any): Promise<LogisticsReport> {
        const lat = parseFloat(blueprint.lat) || HUB_LAT;
        const lng = parseFloat(blueprint.lng) || HUB_LNG;

        const distance = this.calculateDistance(HUB_LAT, HUB_LNG, lat, lng);
        let index = 1.0;
        const alertas: string[] = [];

        // Lógica de sobrecostos según distancia (Basado en FADEEAC/Logística Arg)
        if (distance < 5) {
            index = 1.02; // Urbana cercana
            alertas.push("Ubicación en radio urbano central: logística simplificada.");
        } else if (distance < 30) {
            index = 1.05; // Radio medio
            alertas.push("Radio medio: flete estándar GBA.");
        } else if (distance < 80) {
            index = 1.15; // Larga distancia (Ej: Pilar, Campana)
            alertas.push("Ubicación periférica: se aplica recargo por transporte de larga distancia.");
        } else {
            index = 1.25; // Muy alejado
            alertas.push("ALERTA: Obra en zona remota. La incidencia del flete es crítica (>20%).");
        }

        // Factor por complejidad del terreno (si está en el blueprint)
        if (blueprint.terreno?.tipo === 'country' || blueprint.terreno?.tipo === 'barrio_cerrado') {
            index += 0.03; // Recargo por restricciones de ingreso a camiones/horarios
            alertas.push("Recargo por acceso restringido a barrio privado.");
        }

        // Costo estimado de flete global (simulado sobre el total de la obra)
        // En una obra de 100k USD, el flete suele ser el 2-5%
        const costoFleteEstimado = distance * 50; // Ejemplo simplificado: 50 USD por km (global incluyendo múltiples viajes)

        return {
            distancia_km: Math.round(distance),
            indice_logistico: parseFloat(index.toFixed(2)),
            costo_flete_estimado: Math.round(costoFleteEstimado),
            alertas
        };
    }
}
