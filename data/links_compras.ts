export interface LinkCompra {
  material: string;
  nombre: string;
  url: string;
  plataforma: string;
}

export const LINKS_COMPRA_COMUNES: LinkCompra[] = [
  // ========================
  // MATERIALES DE OBRA GRUESA
  // ========================
  { material: "ladrillo", nombre: "Ladrillo Hueco 18x18x33 - Easy", url: "https://www.easy.com.ar/ladrillo-hueco-18/p", plataforma: "Easy" },
  { material: "ladrillo", nombre: "Ladrillo Hueco 18x18x33 - Sodimac", url: "https://www.sodimac.com.ar/ladrillo-hueco-18/p", plataforma: "Sodimac" },
  { material: "ladrillo", nombre: "Ladrillo Hueco 18x18x33 - ML", url: "https://listado.mercadolibre.com.ar/ladrillo-hueco-18x18x33", plataforma: "MercadoLibre" },
  { material: "ladrillo", nombre: "Bloque Hormigon 20x20x40 - Easy", url: "https://www.easy.com.ar/bloque-hormigon/p", plataforma: "Easy" },
  { material: "ladrillo", nombre: "Bloque Hormigon 20x20x40 - ML", url: "https://listado.mercadolibre.com.ar/bloque-hormigon-20x20x40", plataforma: "MercadoLibre" },
  
  { material: "cemento", nombre: "Cemento Portland 50kg - Easy", url: "https://www.easy.com.ar/cemento-portland-50-kg/p", plataforma: "Easy" },
  { material: "cemento", nombre: "Cemento Portland 50kg - Sodimac", url: "https://www.sodimac.com.ar/cemento/p", plataforma: "Sodimac" },
  { material: "cemento", nombre: "Cemento Portland 50kg - ML", url: "https://listado.mercadolibre.com.ar/cemento-portland-50-kg", plataforma: "MercadoLibre" },
  { material: "cemento", nombre: "Cemento Alba 50kg - Corralón", url: "https://www.corralon.com/cemento-alba", plataforma: "Corralón" },
  
  { material: "arena", nombre: "Arena Gruesa m3 - Easy", url: "https://www.easy.com.ar/arena-gruesa/p", plataforma: "Easy" },
  { material: "arena", nombre: "Arena Gruesa m3 - ML", url: "https://listado.mercadolibre.com.ar/arena-gruesa", plataforma: "MercadoLibre" },
  { material: "arena", nombre: "Arena Fina m3 - ML", url: "https://listado.mercadolibre.com.ar/arena-fina", plataforma: "MercadoLibre" },
  
  { material: "cal", nombre: "Cal Hidratada 25kg - Easy", url: "https://www.easy.com.ar/cal-hidratada/p", plataforma: "Easy" },
  { material: "cal", nombre: "Cal Hidratada 25kg - ML", url: "https://listado.mercadolibre.com.ar/cal-hidratada-25-kg", plataforma: "MercadoLibre" },
  
  { material: "piedra", nombre: "Piedra Partida m3 - ML", url: "https://listado.mercadolibre.com.ar/piedra-partida", plataforma: "MercadoLibre" },
  { material: "grava", nombre: "Grava Construccion m3 - ML", url: "https://listado.mercadolibre.com.ar/grava-construccion", plataforma: "MercadoLibre" },
  { material: "hormigon", nombre: "Hormigon Elaborado H21 - Easy", url: "https://www.easy.com.ar/hormigon-elaborado/p", plataforma: "Easy" },
  { material: "hormigon", nombre: "Hormigon Elaborado - ML", url: "https://listado.mercadolibre.com.ar/hormigon-elaborado", plataforma: "MercadoLibre" },

  // ========================
  // ACERO Y HIERRO
  // ========================
  { material: "hierro", nombre: "Hierro 6mm - Easy", url: "https://www.easy.com.ar/hierro-6mm/p", plataforma: "Easy" },
  { material: "hierro", nombre: "Hierro 6mm - ML", url: "https://listado.mercadolibre.com.ar/hierro-6mm", plataforma: "MercadoLibre" },
  { material: "hierro", nombre: "Hierro 8mm - Easy", url: "https://www.easy.com.ar/hierro-8mm/p", plataforma: "Easy" },
  { material: "hierro", nombre: "Hierro 8mm - ML", url: "https://listado.mercadolibre.com.ar/hierro-8mm", plataforma: "MercadoLibre" },
  { material: "hierro", nombre: "Hierro 10mm - Easy", url: "https://www.easy.com.ar/hierro-10mm/p", plataforma: "Easy" },
  { material: "hierro", nombre: "Hierro 10mm - ML", url: "https://listado.mercadolibre.com.ar/hierro-10mm", plataforma: "MercadoLibre" },
  { material: "hierro", nombre: "Hierro 12mm - ML", url: "https://listado.mercadolibre.com.ar/hierro-12mm", plataforma: "MercadoLibre" },
  { material: "hierro", nombre: "Hierro 4.2mm - ML", url: "https://listado.mercadolibre.com.ar/hierro-4-2", plataforma: "MercadoLibre" },
  { material: "malla", nombre: "Malla Acero 15x15 - Easy", url: "https://www.easy.com.ar/malla-soldada/p", plataforma: "Easy" },
  { material: "malla", nombre: "Malla Acero - ML", url: "https://listado.mercadolibre.com.ar/malla-soldada-acero", plataforma: "MercadoLibre" },
  { material: "acero", nombre: "Acero Construccion - ML", url: "https://listado.mercadolibre.com.ar/acero-construccion", plataforma: "MercadoLibre" },

  // ========================
  // CHAPAS Y CUBIERTAS
  // ========================
  { material: "chapa", nombre: "Chapa Trapezoidal - Easy", url: "https://www.easy.com.ar/chapa-trapezoidal/p", plataforma: "Easy" },
  { material: "chapa", nombre: "Chapa Trapezoidal - Sodimac", url: "https://www.sodimac.com.ar/chapa-trapezoidal/p", plataforma: "Sodimac" },
  { material: "chapa", nombre: "Chapa Trapezoidal - ML", url: "https://listado.mercadolibre.com.ar/chapa-trapezoidal-galvanizada", plataforma: "MercadoLibre" },
  { material: "chapa", nombre: "Chapa Acanalada - ML", url: "https://listado.mercadolibre.com.ar/chapa-acanalada", plataforma: "MercadoLibre" },
  { material: "chapa", nombre: "Chapa de Zinc - ML", url: "https://listado.mercadolibre.com.ar/chapa-zinc", plataforma: "MercadoLibre" },
  { material: "chapa", nombre: "Chapa Simpson - ML", url: "https://listado.mercadolibre.com.ar/chapa-simpson", plataforma: "MercadoLibre" },
  { material: "teja", nombre: "Teja Ceramica - Easy", url: "https://www.easy.com.ar/teja-ceramica/p", plataforma: "Easy" },
  { material: "teja", nombre: "Teja Ceramica - ML", url: "https://listado.mercadolibre.com.ar/teja-ceramica", plataforma: "MercadoLibre" },
  { material: "membrana", nombre: "Membrana Asfaltica - Easy", url: "https://www.easy.com.ar/membrana/p", plataforma: "Easy" },
  { material: "membrana", nombre: "Membrana Asfaltica - ML", url: "https://listado.mercadolibre.com.ar/membrana-asfaltica", plataforma: "MercadoLibre" },
  { material: "tornillo", nombre: "Tornillo Autoperforante - Easy", url: "https://www.easy.com.ar/tornillo-autoperforante/p", plataforma: "Easy" },
  { material: "tornillo", nombre: "Tornillo Techo - ML", url: "https://listado.mercadolibre.com.ar/tornillo-para-techo", plataforma: "MercadoLibre" },

  // ========================
  // PISOS Y REVESTIMIENTOS
  // ========================
  { material: "porcelanato", nombre: "Porcelanato 60x60 - Easy", url: "https://www.easy.com.ar/porcelanato/p", plataforma: "Easy" },
  { material: "porcelanato", nombre: "Porcelanato 60x60 - Sodimac", url: "https://www.sodimac.com.ar/porcelanato/p", plataforma: "Sodimac" },
  { material: "porcelanato", nombre: "Porcelanato 60x60 - ML", url: "https://listado.mercadolibre.com.ar/porcelanato-60x60", plataforma: "MercadoLibre" },
  { material: "porcelanato", nombre: "Porcelanato 45x45 - ML", url: "https://listado.mercadolibre.com.ar/porcelanato-45x45", plataforma: "MercadoLibre" },
  { material: "ceramico", nombre: "Cerámico 33x33 - Easy", url: "https://www.easy.com.ar/ceramico/p", plataforma: "Easy" },
  { material: "ceramico", nombre: "Cerámico 33x33 - ML", url: "https://listado.mercadolibre.com.ar/ceramico-33x33", plataforma: "MercadoLibre" },
  { material: "ceramico", nombre: "Cerámico 45x45 - ML", url: "https://listado.mercadolibre.com.ar/ceramico-45x45", plataforma: "MercadoLibre" },
  { material: "pegamento", nombre: "Pegamento Porcelanato - Easy", url: "https://www.easy.com.ar/pegamento-ceramica/p", plataforma: "Easy" },
  { material: "pegamento", nombre: "Pegamento Porcelanato - ML", url: "https://listado.mercadolibre.com.ar/pegamento-para-ceramica", plataforma: "MercadoLibre" },
  { material: "pastina", nombre: "Pastina - Easy", url: "https://www.easy.com.ar/pastina/p", plataforma: "Easy" },
  { material: "pastina", nombre: "Pastina - ML", url: "https://listado.mercadolibre.com.ar/pastina", plataforma: "MercadoLibre" },
  { material: "zocalo", nombre: "Zocalo Ceramico - ML", url: "https://listado.mercadolibre.com.ar/zocalo-ceramico", plataforma: "MercadoLibre" },
  { material: "revestimiento", nombre: "Revestimiento Piedra - ML", url: "https://listado.mercadolibre.com.ar/revestimiento-piedra", plataforma: "MercadoLibre" },
  { material: "venec", nombre: "Venecita - ML", url: "https://listado.mercadolibre.com.ar/venecita", plataforma: "MercadoLibre" },

  // ========================
  // CARPINTERIA - VENTANAS
  // ========================
  { material: "ventana", nombre: "Ventana Aluminum DVH - Easy", url: "https://www.easy.com.ar/ventana-aluminio-dvh/p", plataforma: "Easy" },
  { material: "ventana", nombre: "Ventana Aluminum DVH - ML", url: "https://listado.mercadolibre.com.ar/ventana-aluminio-dvh", plataforma: "MercadoLibre" },
  { material: "ventana", nombre: "Ventana Aluminum - ML", url: "https://listado.mercadolibre.com.ar/ventana-aluminio", plataforma: "MercadoLibre" },
  { material: "puerta", nombre: "Puerta Entrada - ML", url: "https://listado.mercadolibre.com.ar/puerta-entrada", plataforma: "MercadoLibre" },
  { material: "puerta", nombre: "Puerta Blindada - ML", url: "https://listado.mercadolibre.com.ar/puerta-blindada", plataforma: "MercadoLibre" },
  { material: "porton", nombre: "Portón Corredizo - ML", url: "https://listado.mercadolibre.com.ar/porton-corredizo", plataforma: "MercadoLibre" },
  { material: "perfil", nombre: "Perfil Aluminum - ML", url: "https://listado.mercadolibre.com.ar/perfil-aluminio", plataforma: "MercadoLibre" },

  // ========================
  // VIDRIOS
  // ========================
  { material: "vidrio", nombre: "Vidrio Float 4mm - ML", url: "https://listado.mercadolibre.com.ar/vidrio-flot-4mm", plataforma: "MercadoLibre" },
  { material: "vidrio", nombre: "Vidrio DVH - ML", url: "https://listado.mercadolibre.com.ar/vidrio-dvh", plataforma: "MercadoLibre" },
  { material: "espejo", nombre: "Espejo - ML", url: "https://listado.mercadolibre.com.ar/espejo", plataforma: "MercadoLibre" },

  // ========================
  // PLOMERIA - AGUA
  // ========================
  { material: "cano", nombre: "Caño PVC 20mm - Easy", url: "https://www.easy.com.ar/canos-pvc-agua/p", plataforma: "Easy" },
  { material: "cano", nombre: "Caño PVC 20mm - ML", url: "https://listado.mercadolibre.com.ar/cano-pvc-20mm", plataforma: "MercadoLibre" },
  { material: "cano", nombre: "Caño PVC 25mm - ML", url: "https://listado.mercadolibre.com.ar/cano-pvc-25mm", plataforma: "MercadoLibre" },
  { material: "cano", nombre: "Caño Aquaplac - ML", url: "https://listado.mercadolibre.com.ar/cano-aquaplac", plataforma: "MercadoLibre" },
  { material: "llave", nombre: "Llave de Paso 20mm - ML", url: "https://listado.mercadolibre.com.ar/llave-de-paso-20mm", plataforma: "MercadoLibre" },
  { material: "termotanque", nombre: "Termotanque Gas 80L - Easy", url: "https://www.easy.com.ar/termotanque/p", plataforma: "Easy" },
  { material: "termotanque", nombre: "Termotanque Gas - ML", url: "https://listado.mercadolibre.com.ar/termotanque-gas", plataforma: "MercadoLibre" },
  { material: "termotanque", nombre: "Termotanque Electrico - ML", url: "https://listado.mercadolibre.com.ar/termotanque-electrico", plataforma: "MercadoLibre" },
  { material: "tanque", nombre: "Tanque Agua 1000L - Easy", url: "https://www.easy.com.ar/tanque-agua/p", plataforma: "Easy" },
  { material: "tanque", nombre: "Tanque Agua 1000L - ML", url: "https://listado.mercadolibre.com.ar/tanque-agua-1000-litros", plataforma: "MercadoLibre" },
  { material: "bomba", nombre: "Bomba de Agua - Easy", url: "https://www.easy.com.ar/bomba-agua/p", plataforma: "Easy" },
  { material: "bomba", nombre: "Bomba de Agua - ML", url: "https://listado.mercadolibre.com.ar/bomba-de-agua", plataforma: "MercadoLibre" },

  // ========================
  // PLOMERIA - DESAGUES
  // ========================
  { material: "cano", nombre: "Caño Desagüe 110mm - ML", url: "https://listado.mercadolibre.com.ar/cano-desague-110mm", plataforma: "MercadoLibre" },
  { material: "cano", nombre: "Caño Desagüe 40mm - ML", url: "https://listado.mercadolibre.com.ar/cano-desague-40mm", plataforma: "MercadoLibre" },
  { material: "cano", nombre: "Caño Desagüe 50mm - ML", url: "https://listado.mercadolibre.com.ar/cano-desague-50mm", plataforma: "MercadoLibre" },
  { material: "sifon", nombre: "Sifón PVC - ML", url: "https://listado.mercadolibre.com.ar/sifon", plataforma: "MercadoLibre" },

  // ========================
  // GAS
  // ========================
  { material: "cano", nombre: "Caño Gas Epoxi - ML", url: "https://listado.mercadolibre.com.ar/cano-gas-epoxi", plataforma: "MercadoLibre" },
  { material: "cano", nombre: "Caño Gas Acero - ML", url: "https://listado.mercadolibre.com.ar/cano-gas-acero", plataforma: "MercadoLibre" },
  { material: "regulador", nombre: "Regulador Gas - ML", url: "https://listado.mercadolibre.com.ar/regulador-gas", plataforma: "MercadoLibre" },
  { material: "llave", nombre: "Llave de Gas - ML", url: "https://listado.mercadolibre.com.ar/llave-de-gas", plataforma: "MercadoLibre" },
  { material: "caldera", nombre: "Caldera Mural Gas - Easy", url: "https://www.easy.com.ar/caldera-mural/p", plataforma: "Easy" },
  { material: "caldera", nombre: "Caldera Mural Gas - ML", url: "https://listado.mercadolibre.com.ar/caldera-mural-gas", plataforma: "MercadoLibre" },

  // ========================
  // ELECTRICIDAD
  // ========================
  { material: "cable", nombre: "Cable Unipolar 2.5mm - Easy", url: "https://www.easy.com.ar/cable-unipolar/p", plataforma: "Easy" },
  { material: "cable", nombre: "Cable Unipolar 2.5mm - ML", url: "https://listado.mercadolibre.com.ar/cable-unipolar-2-5mm", plataforma: "MercadoLibre" },
  { material: "cable", nombre: "Cable Unipolar 4mm - ML", url: "https://listado.mercadolibre.com.ar/cable-unipolar-4mm", plataforma: "MercadoLibre" },
  { material: "cable", nombre: "Cable Unipolar 6mm - ML", url: "https://listado.mercadolibre.com.ar/cable-unipolar-6mm", plataforma: "MercadoLibre" },
  { material: "cable", nombre: "Cable Tierra - ML", url: "https://listado.mercadolibre.com.ar/cable-tierra", plataforma: "MercadoLibre" },
  { material: "tablero", nombre: "Tablero Electrico - Easy", url: "https://www.easy.com.ar/tablero-electrico/p", plataforma: "Easy" },
  { material: "tablero", nombre: "Tablero Electrico - ML", url: "https://listado.mercadolibre.com.ar/tablero-electrico", plataforma: "MercadoLibre" },
  { material: "termica", nombre: "Termicas 10/16/20A - Easy", url: "https://www.easy.com.ar/termicas/p", plataforma: "Easy" },
  { material: "termica", nombre: "Termica 10A - ML", url: "https://listado.mercadolibre.com.ar/termica-10a", plataforma: "MercadoLibre" },
  { material: "termica", nombre: "Termica 16A - ML", url: "https://listado.mercadolibre.com.ar/termica-16a", plataforma: "MercadoLibre" },
  { material: "termica", nombre: "Termica 20A - ML", url: "https://listado.mercadolibre.com.ar/termica-20a", plataforma: "MercadoLibre" },
  { material: "disyuntor", nombre: "Disyuntor Diferencial - ML", url: "https://listado.mercadolibre.com.ar/disyuntor-diferencial", plataforma: "MercadoLibre" },
  { material: "llave", nombre: "Toma Corriente - Easy", url: "https://www.easy.com.ar/toma-corriente/p", plataforma: "Easy" },
  { material: "llave", nombre: "Toma Corriente - ML", url: "https://listado.mercadolibre.com.ar/toma-corriente", plataforma: "MercadoLibre" },
  { material: "llave", nombre: "Interruptor Simple - ML", url: "https://listado.mercadolibre.com.ar/interruptor-simple", plataforma: "MercadoLibre" },
  { material: "spot", nombre: "Spot LED Embutir - Easy", url: "https://www.easy.com.ar/spot-led/p", plataforma: "Easy" },
  { material: "spot", nombre: "Spot LED Embutir - ML", url: "https://listado.mercadolibre.com.ar/spot-led-embutir", plataforma: "MercadoLibre" },
  { material: "caño", nombre: "Caño Corrugado - ML", url: "https://listado.mercadolibre.com.ar/cano-corrugado", plataforma: "MercadoLibre" },

  // ========================
  // SANITARIOS
  // ========================
  { material: "inodoro", nombre: "Inodoro Largo - Easy", url: "https://www.easy.com.ar/inodoro/p", plataforma: "Easy" },
  { material: "inodoro", nombre: "Inodoro Largo - ML", url: "https://listado.mercadolibre.com.ar/inodoro-largo", plataforma: "MercadoLibre" },
  { material: "inodoro", nombre: "Inodoro Corto - ML", url: "https://listado.mercadolibre.com.ar/inodoro-corto", plataforma: "MercadoLibre" },
  { material: "bidet", nombre: "Bidet - Easy", url: "https://www.easy.com.ar/bidet/p", plataforma: "Easy" },
  { material: "bidet", nombre: "Bidet - ML", url: "https://listado.mercadolibre.com.ar/bidet", plataforma: "MercadoLibre" },
  { material: "lavatorio", nombre: "Lavatorio - Easy", url: "https://www.easy.com.ar/lavatorio/p", plataforma: "Easy" },
  { material: "lavatorio", nombre: "Lavatorio - ML", url: "https://listado.mercadolibre.com.ar/lavatorio", plataforma: "MercadoLibre" },
  { material: "ducha", nombre: "Ducha Sanitaria - ML", url: "https://listado.mercadolibre.com.ar/ducha-sanitaria", plataforma: "MercadoLibre" },
  { material: "ducha", nombre: "Receptor Ducha - ML", url: "https://listado.mercadolibre.com.ar/receptor-ducha", plataforma: "MercadoLibre" },
  { material: "vanitory", nombre: "Vanitory 60cm - Easy", url: "https://www.easy.com.ar/vanitory/p", plataforma: "Easy" },
  { material: "vanitory", nombre: "Vanitory 60cm - ML", url: "https://listado.mercadolibre.com.ar/vanitory-60cm", plataforma: "MercadoLibre" },

  // ========================
  // GRIFERIAS
  // ========================
  { material: "griferia", nombre: "Griferia Lavatorio - Easy", url: "https://www.easy.com.ar/griferia-lavatorio/p", plataforma: "Easy" },
  { material: "griferia", nombre: "Griferia Lavatorio - ML", url: "https://listado.mercadolibre.com.ar/griferia-lavatorio", plataforma: "MercadoLibre" },
  { material: "griferia", nombre: "Griferia Cocina - ML", url: "https://listado.mercadolibre.com.ar/griferia-cocina", plataforma: "MercadoLibre" },
  { material: "griferia", nombre: "Griferia Ducha - ML", url: "https://listado.mercadolibre.com.ar/griferia-ducha", plataforma: "MercadoLibre" },
  { material: "griferia", nombre: "Columna Ducha - ML", url: "https://listado.mercadolibre.com.ar/columna-ducha", plataforma: "MercadoLibre" },
  { material: "flexible", nombre: "Flexible Agua - ML", url: "https://listado.mercadolibre.com.ar/flexible-agua", plataforma: "MercadoLibre" },

  // ========================
  // PINTURA
  // ========================
  { material: "pintura", nombre: "Latex Interior 20L - Easy", url: "https://www.easy.com.ar/latex/p", plataforma: "Easy" },
  { material: "pintura", nombre: "Latex Interior 20L - ML", url: "https://listado.mercadolibre.com.ar/latex-interior", plataforma: "MercadoLibre" },
  { material: "pintura", nombre: "Latex Exterior 20L - ML", url: "https://listado.mercadolibre.com.ar/latex-exterior", plataforma: "MercadoLibre" },
  { material: "pintura", nombre: "Esmalte Sintetico - ML", url: "https://listado.mercadolibre.com.ar/esmalte-sintetico", plataforma: "MercadoLibre" },
  { material: "pintura", nombre: "Fijador Sellador - ML", url: "https://listado.mercadolibre.com.ar/fijador-sellador", plataforma: "MercadoLibre" },
  { material: "enduido", nombre: "Enduido Plastico - ML", url: "https://listado.mercadolibre.com.ar/enduido-plastico", plataforma: "MercadoLibre" },
  { material: "rodillo", nombre: "Rodillo Pintura - Easy", url: "https://www.easy.com.ar/rodillo-pintura/p", plataforma: "Easy" },
  { material: "impermeabilizante", nombre: "Impermeabilizante Techo - ML", url: "https://listado.mercadolibre.com.ar/impermeabilizante-techo", plataforma: "MercadoLibre" },

  // ========================
  // REVOQUES Y YESOS
  // ========================
  { material: "revoque", nombre: "Revoque Grueso - ML", url: "https://listado.mercadolibre.com.ar/revoque-grueso", plataforma: "MercadoLibre" },
  { material: "revoque", nombre: "Revoque Fino - ML", url: "https://listado.mercadolibre.com.ar/revoque-fino", plataforma: "MercadoLibre" },
  { material: "yeso", nombre: "Yeso Bolsa - Easy", url: "https://www.easy.com.ar/yeso/p", plataforma: "Easy" },
  { material: "yeso", nombre: "Yeso Bolsa - ML", url: "https://listado.mercadolibre.com.ar/yeso-bolsa", plataforma: "MercadoLibre" },
  { material: "malla", nombre: "Malla Guaya - ML", url: "https://listado.mercadolibre.com.ar/malla-guaya", plataforma: "MercadoLibre" },
  { material: "ceresita", nombre: "Ceresita - ML", url: "https://listado.mercadolibre.com.ar/ceresita", plataforma: "MercadoLibre" },

  // ========================
  // CIELORRASOS
  // ========================
  { material: "durlock", nombre: "Placa Durlock - Easy", url: "https://www.easy.com.ar/durlock/p", plataforma: "Easy" },
  { material: "durlock", nombre: "Placa Durlock - ML", url: "https://listado.mercadolibre.com.ar/placa-durlock", plataforma: "MercadoLibre" },
  { material: "durlock", nombre: "Perfil Durlock - ML", url: "https://listado.mercadolibre.com.ar/perfil-durlock", plataforma: "MercadoLibre" },
  { material: "cielorraso", nombre: "Cielorraso Suspendido - ML", url: "https://listado.mercadolibre.com.ar/cielorraso-suspendido", plataforma: "MercadoLibre" },

  // ========================
  // CARPINTERIA INTERIOR
  // ========================
  { material: "puerta", nombre: "Puerta Interior - Easy", url: "https://www.easy.com.ar/puerta-interior/p", plataforma: "Easy" },
  { material: "puerta", nombre: "Puerta Interior - ML", url: "https://listado.mercadolibre.com.ar/puerta-interior", plataforma: "MercadoLibre" },
  { material: "puerta", nombre: "Marco Puerta - ML", url: "https://listado.mercadolibre.com.ar/marco-puerta", plataforma: "MercadoLibre" },
  { material: "bisagra", nombre: "Bisagra 3 1/2 - ML", url: "https://listado.mercadolibre.com.ar/bisagra-3-pulgadas", plataforma: "MercadoLibre" },
  { material: "placard", nombre: "Placard - Easy", url: "https://www.easy.com.ar/placard/p", plataforma: "Easy" },
  { material: "placard", nombre: "Placard - ML", url: "https://listado.mercadolibre.com.ar/placard", plataforma: "MercadoLibre" },
  { material: "zocalo", nombre: "Zocalo PVC - ML", url: "https://listado.mercadolibre.com.ar/zocalo-pvc", plataforma: "MercadoLibre" },

  // ========================
  // MADERAS
  // ========================
  { material: "madera", nombre: "Machimbre Pino - ML", url: "https://listado.mercadolibre.com.ar/machimbre-pino", plataforma: "MercadoLibre" },
  { material: "madera", nombre: "Listón 2x2 - ML", url: "https://listado.mercadolibre.com.ar/liston-2x2", plataforma: "MercadoLibre" },
  { material: "madera", nombre: "Tirante 2x4 - ML", url: "https://listado.mercadolibre.com.ar/tirante-2x4", plataforma: "MercadoLibre" },
  { material: "deck", nombre: "Deck Madera - ML", url: "https://listado.mercadolibre.com.ar/deck-madera", plataforma: "MercadoLibre" },
  { material: "deck", nombre: "Deck WPC - ML", url: "https://listado.mercadolibre.com.ar/deck-wpc", plataforma: "MercadoLibre" },

  // ========================
  // STEEL FRAME
  // ========================
  { material: "steel", nombre: "Montante Steel Frame - ML", url: "https://listado.mercadolibre.com.ar/montante-steel-frame", plataforma: "MercadoLibre" },
  { material: "steel", nombre: "Perfil Steel Frame - ML", url: "https://listado.mercadolibre.com.ar/doble-ua-steel", plataforma: "MercadoLibre" },
  { material: "tornillo", nombre: "Tornillo T1/T2 Steel - ML", url: "https://listado.mercadolibre.com.ar/tornillo-t1", plataforma: "MercadoLibre" },

  // ========================
  // AISLACION
  // ========================
  { material: "aislacion", nombre: "Lana de Vidrio - Easy", url: "https://www.easy.com.ar/lana-vidrio/p", plataforma: "Easy" },
  { material: "aislacion", nombre: "Lana de Vidrio - ML", url: "https://listado.mercadolibre.com.ar/lana-de-vidrio", plataforma: "MercadoLibre" },
  { material: "aislacion", nombre: "Poliestireno - ML", url: "https://listado.mercadolibre.com.ar/poliestireno-expandido", plataforma: "MercadoLibre" },
  { material: "hidrofugo", nombre: "Hidrofugo - ML", url: "https://listado.mercadolibre.com.ar/hidrofugo", plataforma: "MercadoLibre" },

  // ========================
  // CLIMATIZACION
  // ========================
  { material: "aire", nombre: "Aire Split - Easy", url: "https://www.easy.com.ar/aire-acondicionado/p", plataforma: "Easy" },
  { material: "aire", nombre: "Aire Split - ML", url: "https://listado.mercadolibre.com.ar/aire-acondicionado-split", plataforma: "MercadoLibre" },
  { material: "calefactor", nombre: "Calefactor Gas - ML", url: "https://listado.mercadolibre.com.ar/calefactor-gas", plataforma: "MercadoLibre" },
  { material: "radiador", nombre: "Radiador Oil - ML", url: "https://listado.mercadolibre.com.ar/radiador-oil", plataforma: "MercadoLibre" },
  { material: "ventilador", nombre: "Ventilador Techo - ML", url: "https://listado.mercadolibre.com.ar/ventilador-techo", plataforma: "MercadoLibre" },

  // ========================
  // EQUIPAMIENTO
  // ========================
  { material: "cocina", nombre: "Cocina 56cm - Easy", url: "https://www.easy.com.ar/cocina/p", plataforma: "Easy" },
  { material: "cocina", nombre: "Cocina 56cm - ML", url: "https://listado.mercadolibre.com.ar/cocina-56cm", plataforma: "MercadoLibre" },
  { material: "mesada", nombre: "Mesada Acero Inox - ML", url: "https://listado.mercadolibre.com.ar/mesada-acero-inox", plataforma: "MercadoLibre" },
  { material: "mesada", nombre: "Mesada Granito - ML", url: "https://listado.mercadolibre.com.ar/mesada-granito", plataforma: "MercadoLibre" },
  { material: "bacha", nombre: "Bacha Cocina - ML", url: "https://listado.mercadolibre.com.ar/bacha-cocina", plataforma: "MercadoLibre" },
  { material: "campana", nombre: "Campana Cocina - ML", url: "https://listado.mercadolibre.com.ar/campana-cocina", plataforma: "MercadoLibre" },

  // ========================
  // EXTERIOR
  // ========================
  { material: "pileta", nombre: "Pileta Fibra Vidrio - ML", url: "https://listado.mercadolibre.com.ar/pileta-fibra-vidrio", plataforma: "MercadoLibre" },
  { material: "cerco", nombre: "Cerco Premoldeado - ML", url: "https://listado.mercadolibre.com.ar/cerco-premoldeado", plataforma: "MercadoLibre" },
  { material: "cerco", nombre: "Cerco Metalico - ML", url: "https://listado.mercadolibre.com.ar/cerco-metalico", plataforma: "MercadoLibre" },
  { material: "cesped", nombre: "Cesped Sintetico - ML", url: "https://listado.mercadolibre.com.ar/cesped-sintetico", plataforma: "MercadoLibre" },

  // ========================
  // FUNDACIONES
  // ========================
  { material: "pilot", nombre: "Pilotines - ML", url: "https://listado.mercadolibre.com.ar/pilotines", plataforma: "MercadoLibre" },
  { material: "encofrado", nombre: "Tabla Encofrado - ML", url: "https://listado.mercadolibre.com.ar/tabla-encofrado", plataforma: "MercadoLibre" },

  // ========================
  // VARIOS
  // ========================
  { material: "tarugo", nombre: "Tarugo Nylon - ML", url: "https://listado.mercadolibre.com.ar/tarugo-nylon", plataforma: "MercadoLibre" },
  { material: "clavo", nombre: "Clavo Acero - ML", url: "https://listado.mercadolibre.com.ar/clavo-acero", plataforma: "MercadoLibre" },
];

export function buscarLinkCompra(material: string): LinkCompra | null {
  const matLower = material.toLowerCase();
  
  const match = LINKS_COMPRA_COMUNES.find(link => {
    const linkMat = link.material.toLowerCase();
    return matLower.includes(linkMat) || linkMat.includes(matLower);
  });
  
  return match || null;
}

export function buscarTodosLosLinks(material: string): LinkCompra[] {
  const matLower = material.toLowerCase();
  
  const matches = LINKS_COMPRA_COMUNES.filter(link => {
    const linkMat = link.material.toLowerCase();
    return matLower.includes(linkMat) || linkMat.includes(matLower);
  });
  
  return matches;
}

export function buscarLinkMasBarato(material: string): LinkCompra | null {
  const links = buscarTodosLosLinks(material);
  if (links.length === 0) return null;
  
  links.sort((a: LinkCompra, b: LinkCompra) => {
    const prioridadPlataforma: Record<string, number> = {
      'Corralón': 1,
      'Easy': 2,
      'Sodimac': 3,
      'MercadoLibre': 4
    };
    return (prioridadPlataforma[a.plataforma] || 5) - (prioridadPlataforma[b.plataforma] || 5);
  });
  
  return links[0];
}

export function getTodosLosLinks(): LinkCompra[] {
  return LINKS_COMPRA_COMUNES;
}

export function getPlataformas(): string[] {
  return ['Easy', 'Sodimac', 'Corralón', 'MercadoLibre'];
}
