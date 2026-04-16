import { ENV } from "./env";

export const PRECIO_VIGENCIA_DIAS = ENV.PRECIO_VIGENCIA_DIAS;
export const PRECIO_ALERTA_DIAS = 10;
export const PRECIO_MAX_ANTIGUEDAD_DIAS = ENV.PRECIO_MAX_ANTIGUEDAD_DIAS;

export const CURRENCY = 'USD';
export const TASA_CAMBIO_USD = 1800; // Tasa por defecto (Blue/Paralelo) - actualizada abril 2026


export const MODEL = {
  extraction: "claude-sonnet-4-20250514",
  research: "claude-sonnet-4-20250514",
  synthesis: "claude-sonnet-4-20250514",
  ingesta: "claude-sonnet-4-20250514",
  temperature: {
    extraction: 0,
    research: 0.2,
    synthesis: 0,
    ingesta: 0,
  },
};

export const MCPS = {
  playwright: ENV.MCP_PLAYWRIGHT,
  filesystem: ENV.MCP_FILESYSTEM,
  memory: ENV.MCP_MEMORY,
  googleDrive: ENV.MCP_GOOGLE_DRIVE,
};

export const DATA_PATHS = {
  historico: {
    nuevas: "./data/historico/nuevas",
    procesadas: "./data/historico/procesadas",
  },
  cache: {
    precios: "./data/cache/precios.json",
  },
};

export const OUTPUT = {
  formatos: ["xlsx", "pdf"],
  carpeta: "./output",
};

export const EXTRACTION = {
  supportedFormats: [".pdf", ".jpg", ".jpeg", ".png", ".skp", ".dwg"],
  maxFileSizeMB: 50,
  confidenceThresholds: {
    alta: 0.8,
    media: 0.5,
    baja: 0.2,
  },
};

export const RAG = {
  vectorStorePath: ENV.CHROMA_DB_PATH,
  similarityThreshold: 0.7,
  maxResults: 5,
};

export const ANTHROPIC_API_KEY = ENV.ANTHROPIC_API_KEY;
export const SERPER_API_KEY = ENV.SERPER_API_KEY;
export const ESTUDIO_ID = ENV.ESTUDIO_ID;

// Ollama (alternativa local gratuita)
export const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';