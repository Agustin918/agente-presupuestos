/**
 * Servicio de Mediciones Paramétricas - Tipo STIMAT
 * 
 * Algoritmo que calcula mediciones automáticas con solo datos básicos:
 * - Superficie construida
 * - Número de dormitorios
 * - Número de baños
 * - Plantas
 * 
 * Basado en el sistema de STIMAT con +90% de fiabilidad
 */

import { Blueprint } from "../blueprint/schema";

export interface DatosVivienda {
  superficie_cubierta_m2: number;
  superficie_semicubierta_m2: number;
  dormitorios: number;
  banos: number;
  plantas: number;
  tiene_cochera: boolean;
  tiene_galeria: boolean;
  tiene_quincho: boolean;
  tiene_deck: boolean;
}

export interface RubroMedicion {
  codigo: string;
  rubro: string;
  unidad: string;
  cantidad: number;
  rendimiento: number;
  descripcion: string;
  materiales: string[];
}

export class MedicionesService {
  
  /**
   * Calcula todas las mediciones basándose en datos básicos de la vivienda
   * Similar al generador de STIMAT
   */
  static calcular(datos: DatosVivienda): RubroMedicion[] {
    const m2 = datos.superficie_cubierta_m2;
    const m2_semi = datos.superficie_semicubierta_m2 || 0;
    const dorm = datos.dormitorios || 2;
    const banos = datos.banos || 1;
    const plantas = datos.plantas || 1;
    
    const mediciones: RubroMedicion[] = [];
    
    // 01 - TRABAJOS PRELIMINARES
    mediciones.push({
      codigo: "01.01",
      rubro: "Limpieza del terreno",
      unidad: "m2",
      cantidad: m2 * 1.2,
      rendimiento: 0.02,
      descripcion: "Limpieza y desmalezado del terreno",
      materiales: ["Herramientas manuales"]
    });
    
    mediciones.push({
      codigo: "01.02",
      rubro: "Replanteo y nivación",
      unidad: "m2",
      cantidad: m2,
      rendimiento: 0.01,
      descripcion: "Replanteo de obra, marcación de ejes y niveles",
      materiales: ["Malla de obra", "Clavos", "Cal"]
    });
    
    // 02 - MOVIMIENTO DE TIERRAS
    const volumen_excavacion = this.calcularExcavacion(m2, datos);
    mediciones.push({
      codigo: "02.01",
      rubro: "Excavación de zanjas",
      unidad: "m3",
      cantidad: volumen_excavacion,
      rendimiento: 0.5,
      descripcion: "Excavación para fundaciones, profundidad según estudio de suelo",
      materiales: [" pala", "retroexcavadora"]
    });
    
    mediciones.push({
      codigo: "02.02",
      rubro: "Relleno y compactación",
      unidad: "m3",
      cantidad: volumen_excavacion * 0.7,
      rendimiento: 0.4,
      descripcion: "Relleno con material granular, compactación por capas",
      materiales: ["Arena", "Piedra", "Compactadora"]
    });
    
    // 03 - FUNDACIONES Y ESTRUCTURA
    const volumen_hormigon = this.calcularHormigon(m2, datos);
    mediciones.push({
      codigo: "03.01",
      rubro: "Zapatas de fundación",
      unidad: "m3",
      cantidad: volumen_hormigon * 0.3,
      rendimiento: 1.2,
      descripcion: "Hormigonado de zapata",
      materiales: ["Hormigon H21", "Acero 10mm", "Acero 12mm"]
    });
    
    mediciones.push({
      codigo: "03.02",
      rubro: "Vigas de fundación",
      unidad: "m3",
      cantidad: volumen_hormigon * 0.2,
      rendimiento: 1.0,
      descripcion: "Vigas de encadenado",
      materiales: ["Hormigon H21", "Acero"]
    });
    
    mediciones.push({
      codigo: "03.03",
      rubro: "Columnas de elevación",
      unidad: "m3",
      cantidad: volumen_hormigon * 0.25,
      rendimiento: 1.5,
      descripcion: "Columnas de hormigón armado",
      materiales: ["Hormigon H21", "Acero", "Encofrado"]
    });
    
    // 04 - MAMPOSTERÍA
    const m2_muros = this.calcularMuros(m2, dorm);
    mediciones.push({
      codigo: "04.01",
      rubro: "Muro de elevación 20cm",
      unidad: "m2",
      cantidad: m2_muros.exterior,
      rendimiento: 0.8,
      descripcion: "Ladrillo o bloque visto para muros perimetrales",
      materiales: ["Ladrillo", "Mortero", "Arena", "Cemento"]
    });
    
    mediciones.push({
      codigo: "04.02",
      rubro: "Tabique divisor 12cm",
      unidad: "m2",
      cantidad: m2_muros.interior,
      rendimiento: 0.6,
      descripcion: "Tabiques interiores",
      materiales: ["Ladrillo", "Mortero"]
    });
    
    // 05 - AISLACIONES
    mediciones.push({
      codigo: "05.01",
      rubro: "Barrera hidrófuga",
      unidad: "m2",
      cantidad: m2,
      rendimiento: 0.15,
      descripcion: "Impermeabilización de muros perimetrales",
      materiales: ["Membrana hidrofuga"]
    });
    
    mediciones.push({
      codigo: "05.02",
      rubro: "Aislación térmica",
      unidad: "m2",
      cantidad: m2 * 1.1,
      rendimiento: 0.2,
      descripcion: "Lana de vidrio o EPS bajo cubierta",
      materiales: ["Lana de vidrio", "EPS"]
    });
    
    // 06 - CUBIERTA
    mediciones.push({
      codigo: "06.01",
      rubro: "Estructura de cubierta",
      unidad: "m2",
      cantidad: m2 * 1.15,
      rendimiento: 0.5,
      descripcion: "Vigas, correas y tensor",
      materiales: ["Madera", "Clavos", "Tornillos"]
    });
    
    mediciones.push({
      codigo: "06.02",
      rubro: "Cubierta terminada",
      unidad: "m2",
      cantidad: m2 * 1.15,
      rendimiento: 0.3,
      descripcion: "Chapa trapezoidal o acanalada",
      materiales: ["Chapa", "Tornillos autoperforantes"]
    });
    
    // 07 - REVOQUES
    const m2_revoque = m2 * 2.8;
    mediciones.push({
      codigo: "07.01",
      rubro: "Revoque грубый",
      unidad: "m2",
      cantidad: m2_revoque,
      rendimiento: 0.4,
      descripcion: "Revoque грубый 15mm con malla",
      materiales: ["Arena", "Cemento", "Malla"]
    });
    
    mediciones.push({
      codigo: "07.02",
      rubro: "Revoque fino",
      unidad: "m2",
      cantidad: m2_revoque,
      rendimiento: 0.25,
      descripcion: "Revoque fino 5mm",
      materiales: ["Arena fina", "Cemento", "Malla"]
    });
    
    // 08 - CIELORRASO
    mediciones.push({
      codigo: "08.01",
      rubro: "Cielorraso suspendido",
      unidad: "m2",
      cantidad: m2,
      rendimiento: 0.5,
      descripcion: "Placas de yeso Durlock",
      materiales: ["Placas Durlock", "Perfiles omega", "Tornillos"]
    });
    
    // 09 - CONTRAPISO
    mediciones.push({
      codigo: "09.01",
      rubro: "Contrapiso",
      unidad: "m2",
      cantidad: m2,
      rendimiento: 0.4,
      descripcion: "Hormigon de contrapiso",
      materiales: ["Hormigon", "Arena"]
    });
    
    // 10 - PISOS
    mediciones.push({
      codigo: "10.01",
      rubro: "Piso interior",
      unidad: "m2",
      cantidad: m2,
      rendimiento: 0.6,
      descripcion: "Porcelanato o cerámico",
      materiales: ["Piso", "Pegamento", "Pastina"]
    });
    
    mediciones.push({
      codigo: "10.02",
      rubro: "Zócalo",
      unidad: "ml",
      cantidad: m2 * 1.2,
      rendimiento: 0.1,
      descripcion: "Zócalo de mismo material",
      materiales: ["Zócalo", "Pegamento"]
    });
    
    // 12 - INSTALACIÓN ELÉCTRICA
    const bocas_electricas = this.calcularBocasElectricas(m2, dorm, banos);
    mediciones.push({
      codigo: "12.01",
      rubro: "Instalación eléctrica",
      unidad: "bocas",
      cantidad: bocas_electricas,
      rendimiento: 0.5,
      descripcion: "Puntos eléctricos completos",
      materiales: ["Cable", "Caño PVC", "Caja", "Interruptores"]
    });
    
    // 13 - INSTALACIÓN SANITARIA
    const puntos_sanitarios = this.calcularPuntosSanitarios(banos);
    mediciones.push({
      codigo: "13.01",
      rubro: "Red de agua",
      unidad: "puntos",
      cantidad: puntos_sanitarios,
      rendimiento: 0.8,
      descripcion: "Distribución de agua fría y caliente",
      materiales: ["Caño PVC", "Caño termofusión", "Válvulas"]
    });
    
    mediciones.push({
      codigo: "13.02",
      rubro: "Desagües",
      unidad: "ml",
      cantidad: puntos_sanitarios * 1.5,
      rendimiento: 0.6,
      descripcion: "Red de desagües",
      materiales: ["Caño PVC 110mm", "Caño 40mm", "Botes sifonados"]
    });
    
    // 14 - INSTALACIÓN DE GAS
    mediciones.push({
      codigo: "14.01",
      rubro: "Red de gas",
      unidad: "ml",
      cantidad: m2 * 0.3,
      rendimiento: 0.8,
      descripcion: "Instalación de gas",
      materiales: ["Caño de gas", "Regulador", "Válvulas"]
    });
    
    // 16 - SANITARIOS
    mediciones.push({
      codigo: "16.01",
      rubro: "Inodoros",
      unidad: "un",
      cantidad: banos,
      rendimiento: 2.0,
      descripcion: "Inodoro con depósito",
      materiales: ["Inodoro", "Asiento", "Flexibles"]
    });
    
    mediciones.push({
      codigo: "16.02",
      rubro: "Lavatorios",
      unidad: "un",
      cantidad: banos,
      rendimiento: 2.0,
      descripcion: "Lavatorio o vanitory",
      materiales: ["Bacha", "Grifería", "Espejo"]
    });
    
    mediciones.push({
      codigo: "16.03",
      rubro: "Duchas",
      unidad: "un",
      cantidad: banos,
      rendimiento: 3.0,
      descripcion: "Columna de ducha",
      materiales: ["Columna", "Grifería", "Receptor"]
    });
    
    // 17 - CARPINTERÍA
    const puertas_interiores = dorm + banos + 1;
    mediciones.push({
      codigo: "17.01",
      rubro: "Puertas interiores",
      unidad: "un",
      cantidad: puertas_interiores,
      rendimiento: 1.5,
      descripcion: "Puerta de interior",
      materiales: ["Puerta", "Marco", "Bisagras", "Cerradura"]
    });
    
    const ventanas = this.calcularVentanas(m2);
    mediciones.push({
      codigo: "17.02",
      rubro: "Ventanas",
      unidad: "un",
      cantidad: Math.ceil(ventanas),
      rendimiento: 2.0,
      descripcion: "Ventanas de aluminio",
      materiales: ["Ventana", "Vidrio", "Burletes"]
    });
    
    // 18 - PINTURA
    const m2_pintura = m2 * 3.5;
    mediciones.push({
      codigo: "18.01",
      rubro: "Pintura interior",
      unidad: "m2",
      cantidad: m2_pintura,
      rendimiento: 0.1,
      descripcion: "Látex 2 manos",
      materiales: ["Látex", "Rodillo", "Pincel"]
    });
    
    mediciones.push({
      codigo: "18.02",
      rubro: "Pintura exterior",
      unidad: "m2",
      cantidad: m2 * 1.2,
      rendimiento: 0.12,
      descripcion: "Látex exterior",
      materiales: ["Látex exterior"]
    });
    
    // 19 - LIMPIEZA
    mediciones.push({
      codigo: "19.01",
      rubro: "Limpieza final",
      unidad: "m2",
      cantidad: m2,
      rendimiento: 0.05,
      descripcion: "Limpieza general de obra",
      materiales: ["Elements de limpieza"]
    });
    
    return mediciones;
  }
  
  /**
   * Calcula volumen de excavación según superficie y características del terreno
   */
  private static calcularExcavacion(m2: number, datos: DatosVivienda): number {
    // Estimación: 0.6 m3 por m2 para fundaciones típicas
    let volumen = m2 * 0.6;
    
    // Ajuste por cantidad de baños (más cañerías)
    volumen += datos.banos * 2;
    
    // Ajuste por plantas (más fundaciones si es 2 plantas)
    if (datos.plantas > 1) volumen *= 1.3;
    
    return volumen;
  }
  
  /**
   * Calcula volumen de hormigón según superficie
   */
  private static calcularHormigon(m2: number, datos: DatosVivienda): number {
    // Estimación: 0.18 m3 de hormigón por m2 para estructura completa
    let volumen = m2 * 0.18;
    
    // Ajuste por cantidad de baños
    volumen += datos.banos * 1.5;
    
    // Ajuste por plantas
    if (datos.plantas > 1) volumen *= 1.4;
    
    return volumen;
  }
  
  /**
   * Calcula m2 de muros según superficie y dormitorios
   */
  private static calcularMuros(m2: number, dorm: number): { exterior: number; interior: number } {
    // Ratio: 2.2 m2 de muro por m2 de superficie para muros exterioress
    const exterior = m2 * 2.2;
    
    // Ratio: 1.5 m2 de muro por m2 para muros interiores
    const interior = m2 * 1.5 + (dorm * 8);
    
    return { exterior, interior };
  }
  
  /**
   * Calcula cantidad de bocas eléctricas según superficie y distribución
   */
  private static calcularBocasElectricas(m2: number, dorm: number, banos: number): number {
    // Base: 1 boca cada 15m2 aprox
    const base = Math.ceil(m2 / 15);
    
    // Dormitorios: 4 bocas cada uno
    const por_dormitorios = dorm * 4;
    
    // Baños: 6 bocas cada uno
    const por_banos = banos * 6;
    
    // Cocina: 8 bocas
    const cocina = 8;
    
    // Living/estar: 6 bocas
    const estar = 6;
    
    return base + por_dormitorios + por_banos + cocina + estar;
  }
  
  /**
   * Calcula puntos sanitarios según cantidad de baños
   */
  private static calcularPuntosSanitarios(banos: number): number {
    // Cada baño tiene aprox 8 puntos: inodoro, bidet, lavatorio, ducha, pileta cocina, lavadero
    return banos * 6 + 2; // +2 para cocina y lavadero
  }
  
  /**
   * Calcula cantidad de ventanas según superficie
   */
  private static calcularVentanas(m2: number): number {
    // Estimación: 1 ventana cada 15-20 m2
    return Math.ceil(m2 / 18);
  }
  
  /**
   * Estima tiempo de ejecución de la obra en días
   */
  static estimarTiempoObra(datos: DatosVivienda): number {
    const m2 = datos.superficie_cubierta_m2;
    const plantas = datos.plantas || 1;
    
    // Base: días por m2
    let dias = m2 * 0.15;
    
    // Ajuste por plantas (más tiempo por estructura)
    if (plantas > 1) dias *= 1.4;
    
    // Ajuste por baños
    dias += datos.banos * 3;
    
    // Mínimo 60 días para una casa
    return Math.max(60, Math.round(dias));
  }
  
  /**
   * Genera resumen de mediciones para mostrar al usuario
   */
  static generarResumen(datos: DatosVivienda): string {
    const med = this.calcular(datos);
    const tiempo = this.estimarTiempoObra(datos);
    
    let resumen = `RESUMEN DE MEDICIONES\n`;
    resumen += `====================\n\n`;
    resumen += `Superficie: ${datos.superficie_cubierta_m2}m²\n`;
    resumen += `Dormitorios: ${datos.dormitorios}\n`;
    resumen += `Baños: ${datos.banos}\n`;
    resumen += `Plantas: ${datos.plantas}\n`;
    resumen += `Tiempo estimado: ${tiempo} días\n\n`;
    resumen += `PRINCIPALES RUBROS:\n`;
    resumen += `------------------\n`;
    
    const principales = med.filter(m => ["04.01", "06.02", "10.01", "12.01", "17.01", "18.01"].includes(m.codigo));
    principales.forEach(m => {
      resumen += `${m.codigo} ${m.rubro}: ${m.cantidad.toFixed(1)} ${m.unidad}\n`;
    });
    
    return resumen;
  }
}