export interface Usuario {
  id: string;
  nombre: string;
  estudio_id: string;
  api_key: string;
}

export const USUARIOS: Record<string, Usuario> = {
  demo: {
    id: "demo",
    nombre: "Usuario Demo",
    estudio_id: "estudio_001",
    api_key: "demo_key_123",
  },
};

export function getUsuarioPorApiKey(apiKey: string): Usuario | undefined {
  return Object.values(USUARIOS).find((u) => u.api_key === apiKey);
}