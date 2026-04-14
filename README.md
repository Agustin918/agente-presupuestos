# Sistema Multi-Agente de Presupuestos de Construcción

Sistema de IA multi-agente para automatizar la generación de presupuestos de construcción de viviendas.

## Arquitectura

Cinco agentes especializados:

1. **Extraction Agent** - Lee planos PDF, imágenes 3D, archivos SKP y DWG
2. **Research Agent** - Busca precios actualizados de materiales en internet
3. **Synthesis Agent** - Genera presupuestos combinando datos extraídos, precios y base de conocimiento
4. **Ingesta Agent** - Aprende de obras cerradas para mejorar futuras estimaciones
5. **Orchestrator** - Coordina el flujo completo entre agentes

## Características

- Extracción automática de datos de archivos de proyecto (PDF, imágenes, SKP, DWG)
- Búsqueda autónoma de precios con caché y manejo de inflación
- Generación de presupuestos con indicadores de confianza por ítem
- Modo comparativo de cuatro niveles de terminación
- Sistema de versiones que muestra cambios entre revisiones
- Base de conocimiento RAG con obras históricas del estudio
- Separación multi-usuario y multi-estudio

## Instalación

```bash
npm install
```

## Configuración

1. Copiar `.env.example` a `.env` y configurar variables:

```bash
ANTHROPIC_API_KEY=
CHROMA_DB_PATH=./data/rag/store
PRECIO_VIGENCIA_DIAS=15
PRECIO_MAX_ANTIGUEDAD_DIAS=45
ESTUDIO_ID=
```

2. Configurar usuarios en `config/users.ts`

3. Cargar obras históricas en `data/historico/nuevas/`

## Uso

### Generar presupuesto desde archivos

```typescript
import { orchestrator } from "./agents/orchestrator";

const resultado = await orchestrator.runWithFiles(
  ["planta.pdf", "fachada.skp"],
  { usuario_id: "demo", estudio_id: "estudio_001" }
);
```

### Generar presupuesto desde blueprint manual

```typescript
const blueprint = {
  id: "uuid",
  version: 1,
  usuario_id: "demo",
  estudio_id: "estudio_001",
  fecha_creacion: "2026-04-13",
  nombre_obra: "Casa Pilar",
  ubicacion: "Pilar, Buenos Aires",
  superficie_cubierta_m2: 150,
  plantas: 1,
  estructura: "albanileria",
  cubierta: "chapa_acanalada",
  // ... todos los campos requeridos
};

const resultado = await orchestrator.runWithFiles([], blueprint);
```

### Interfaz Web (Frontend)

El sistema incluye una interfaz web básica para completar el blueprint y generar presupuestos:

1. **Iniciar servidor frontend:**
   ```bash
   npm run web
   ```
   Servidor disponible en http://localhost:3000

2. **Funcionalidades:**
   - Formulario completo para todos los campos del blueprint
   - Validación en tiempo real
   - Generación de presupuesto con un clic
   - Visualización de resultados con indicadores de confianza
   - Historial de presupuestos generados

3. **Estructura del frontend:**
   ```
   frontend/
   ├── server.ts              # Servidor Express con API
   ├── public/
   │   ├── index.html         # Interfaz principal
   │   ├── style.css          # Estilos
   │   └── script.js          # Lógica del cliente
   ```

### Como MCP Server

El sistema se expone como servidor MCP con las siguientes herramientas:

- `extraer_datos_archivo` - Extrae datos de archivos de proyecto
- `buscar_precio_material` - Busca precios actualizados
- `generar_presupuesto` - Genera presupuesto completo
- `nueva_version_presupuesto` - Crea nueva versión con cambios
- `registrar_obra_cerrada` - Incorpora obra finalizada al conocimiento

## Estructura del proyecto

```
/
├── agents/           # Los cinco agentes especializados
├── parsers/          # Parsers para PDF, imágenes, SKP, DWG
├── blueprint/        # Schema y validación
├── rag/              # Base de conocimiento RAG
├── output/           # Generadores de Excel y PDF
├── mcp/              # Configuración MCP
├── config/           # Configuración global
├── data/             # Datos persistentes
├── frontend/         # Interfaz web (servidor Express + UI)
└── AGENT_SYSTEM_PROMPT.md  # Especificación completa
```

## Desarrollo

Seguir el orden de implementación especificado en `AGENT_SYSTEM_PROMPT.md`.

## Licencia

MIT