# Deployment y CI/CD

Esta guía explica cómo desplegar el Sistema Multi-Agente de Presupuestos en producción.

## Opciones de Deployment

### 1. Docker Compose (Recomendado para servidores propios)

#### Requisitos
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM mínimo
- 10GB almacenamiento

#### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Agustin918/agente-presupuestos.git
   cd agente-presupuestos
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus valores
   ```

3. **Construir y levantar contenedores**
   ```bash
   docker-compose up -d
   ```

4. **Verificar que el servicio está corriendo**
   ```bash
   docker-compose ps
   curl http://localhost:3000/api/blueprint/schema
   ```

5. **Acceder a la interfaz web**
   - Frontend: http://tuservidor:3000
   - API: http://tuservidor:3000/api

#### Volúmenes de datos
- `./data` - Datos persistentes (cache, historico)
- `./output` - Presupuestos generados

#### Actualizar
```bash
git pull origin main
docker-compose build --no-cache
docker-compose up -d
```

### 2. Docker Manual

```bash
# Construir imagen
docker build -t agente-presupuestos .

# Ejecutar contenedor
docker run -d \
  -p 3000:3000 \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/output:/app/output \
  -e ANTHROPIC_API_KEY=tu_clave \
  --name agente-presupuestos \
  agente-presupuestos
```

### 3. Railway / Render (Platform as a Service)

#### Railway
1. Conectar repositorio GitHub
2. Agregar variables de entorno:
   - `ANTHROPIC_API_KEY`
   - `PORT=3000`
   - `NODE_ENV=production`
3. Railway detectará automáticamente el Dockerfile

#### Render
1. New Web Service
2. Conectar repositorio GitHub
3. Configurar:
   - Build Command: `npm run build`
   - Start Command: `npm run web`
   - Environment Variables: ver `.env.example`

## Configurar CI/CD con GitHub Actions

El repositorio incluye un workflow de CI/CD (`.github/workflows/ci.yml`) que:

1. **Ejecuta tests** en cada push/PR
2. **Construye imagen Docker** y la sube a Docker Hub
3. **Despliega automáticamente** en tu servidor (opcional)

### Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub
2. Settings → Secrets and variables → Actions
3. Agregar los siguientes secrets:

#### Secrets obligatorios para Docker Hub
- `DOCKER_USERNAME` - Tu usuario de Docker Hub
- `DOCKER_TOKEN` - Token de acceso de Docker Hub

#### Secrets opcionales para despliegue automático
- `SERVER_HOST` - IP/Dominio del servidor
- `SERVER_USER` - Usuario SSH
- `SERVER_SSH_KEY` - Clave privada SSH

### Generar Docker Token

1. Inicia sesión en [Docker Hub](https://hub.docker.com)
2. Account Settings → Security → Access Tokens
3. Crear nuevo token con permisos de lectura/escritura

### Configurar servidor para despliegue automático

1. **Instalar Docker y Docker Compose** en el servidor
2. **Crear usuario deploy** con permisos sudo
3. **Configurar SSH key** para GitHub Actions
4. **Clonar repositorio** en el servidor:
   ```bash
   git clone https://github.com/Agustin918/agente-presupuestos.git /opt/agente-presupuestos
   cd /opt/agente-presupuestos
   cp .env.example .env
   # Editar .env
   ```

## Variables de Entorno Requeridas

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `ANTHROPIC_API_KEY` | Clave API de Anthropic (Claude) | Requerida |
| `CHROMA_DB_PATH` | Ruta para almacenar vectores | `./data/rag/store` |
| `PRECIO_VIGENCIA_DIAS` | Días de vigencia de precios | `15` |
| `PRECIO_MAX_ANTIGUEDAD_DIAS` | Máxima antigüedad de precios | `45` |
| `ESTUDIO_ID` | ID del estudio | Requerida |
| `MCP_PLAYWRIGHT` | Habilitar MCP Playwright | `true` |
| `MCP_FILESYSTEM` | Habilitar MCP Filesystem | `true` |
| `MCP_MEMORY` | Habilitar MCP Memory | `true` |
| `PORT` | Puerto del servidor web | `3000` |

## Monitoreo y Mantenimiento

### Logs
```bash
# Ver logs de Docker Compose
docker-compose logs -f

# Ver logs específicos del contenedor
docker logs agente-presupuestos-app-1 --tail 100
```

### Health Checks
El contenedor incluye health check automático. Verificar estado:
```bash
docker ps --filter "name=agente-presupuestos" --format "table {{.Names}}\t{{.Status}}"
```

### Backups
Los datos importantes están en:
- `data/historico/` - Obras históricas
- `data/cache/` - Cache de precios (puede regenerarse)
- `output/` - Presupuestos generados

Recomendación: Hacer backup periódico de `data/historico/`.

### Actualizaciones de Seguridad
1. Actualizar dependencias mensualmente:
   ```bash
   npm audit fix
   docker-compose build --no-cache
   ```
2. Rotar API keys periódicamente
3. Mantener Docker y el sistema operativo actualizados

## Solución de Problemas

### El servicio no inicia
```bash
# Ver logs de error
docker-compose logs app

# Verificar variables de entorno
docker-compose exec app printenv

# Verificar espacio en disco
df -h
```

### Playwright no funciona en Docker
El Dockerfile incluye Chromium para Playwright. Si hay problemas:
1. Verificar que el contenedor tenga suficiente memoria (mínimo 2GB)
2. Verificar permisos de ejecución

### API keys no válidas
1. Verificar que las variables de entorno estén correctamente configuradas
2. Verificar que no haya espacios en blanco
3. Probar la API key manualmente

### Alto uso de memoria
El sistema puede usar hasta 1-2GB de RAM con múltiples agentes activos.
- Considerar aumentar RAM del servidor
- Ajustar `NODE_OPTIONS=--max-old-space-size=2048`

## Escalabilidad

Para uso intensivo:
1. **Aumentar recursos**: 4+ CPU, 8GB+ RAM
2. **Separar servicios**:
   - Servidor web (frontend/API)
   - Workers para agentes (Research, Synthesis)
   - Base de datos externa (PostgreSQL para RAG)
3. **Implementar cache Redis** para precios
4. **Usar load balancer** para múltiples instancias

## Seguridad

### Recomendaciones de producción
1. **Usar HTTPS** (certificado SSL)
2. **Configurar firewall** (solo puertos 80/443)
3. **Implementar autenticación** real (no solo `usuario_id`)
4. **Limitar tasa de requests** por usuario
5. **Auditar logs** regularmente
6. **No exponer servicios MCP** públicamente

### Hardening Docker
```bash
# Ejecutar contenedor sin privilegios
docker run --user node:node ...

# Limitar recursos
docker run --memory=2g --cpus=2 ...
```

## Soporte

Para problemas o preguntas:
1. Revisar [Issues en GitHub](https://github.com/Agustin918/agente-presupuestos/issues)
2. Crear nuevo issue con detalles del problema
3. Incluir logs y configuración relevante

---

**Nota**: Este sistema está diseñado para extensibilidad. Consulta `AGENT_SYSTEM_PROMPT.md` para entender la arquitectura completa.