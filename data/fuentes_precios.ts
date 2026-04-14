export interface FuentePrecio {
  nombre: string;
  url: string;
  selectors: {
    producto: string;
    precio: string;
    unidad?: string;
    siguientePagina?: string;
  };
}

export const FUENTES_PRECIOS: FuentePrecio[] = [
  {
    nombre: "MercadoLibre Argentina",
    url: "https://listado.mercadolibre.com.ar/construccion/",
    selectors: {
      producto: "div.ui-search-result__content",
      precio: "span.andes-money-amount__fraction",
      unidad: "span.andes-money-amount__currency-symbol",
    },
  },
  {
    nombre: "Easy",
    url: "https://www.easy.com.ar/construccion/",
    selectors: {
      producto: "div.product",
      precio: "span.price",
    },
  },
  {
    nombre: "Fravega",
    url: "https://www.fravega.com/l/construccion/",
    selectors: {
      producto: "div.product",
      precio: "span.price",
    },
  },
];

export async function buscarEnFuente(material: string, fuente: FuentePrecio): Promise<{ precio: number; unidad: string; url: string } | null> {
  // Implementación con Playwright
  return null;
}