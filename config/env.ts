import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  CHROMA_DB_PATH: process.env.CHROMA_DB_PATH || './data/rag/store',
  PRECIO_VIGENCIA_DIAS: parseInt(process.env.PRECIO_VIGENCIA_DIAS || '15'),
  PRECIO_MAX_ANTIGUEDAD_DIAS: parseInt(process.env.PRECIO_MAX_ANTIGUEDAD_DIAS || '45'),
  ESTUDIO_ID: process.env.ESTUDIO_ID || '',
  MCP_PLAYWRIGHT: process.env.MCP_PLAYWRIGHT === 'true',
  MCP_FILESYSTEM: process.env.MCP_FILESYSTEM === 'true',
  MCP_MEMORY: process.env.MCP_MEMORY === 'true',
  MCP_GOOGLE_DRIVE: process.env.MCP_GOOGLE_DRIVE === 'false',
  SERPER_API_KEY: process.env.SERPER_API_KEY || '',
};