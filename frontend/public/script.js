document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const form = document.getElementById('blueprintForm');
    const btnValidar = document.getElementById('btnValidar');
    const btnGenerar = document.getElementById('btnGenerar');
    const resultadosDiv = document.getElementById('resultados');
    const archivosInput = document.getElementById('archivos');

    // Configurar fecha actual
    const fechaActual = new Date().toISOString().split('T')[0];
    
    // Generar IDs únicos
    function generarId() {
        return 'bp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Obtener valores del formulario
    function obtenerBlueprint() {
        const instalaciones = Array.from(document.querySelectorAll('input[name="instalaciones"]:checked'))
            .map(cb => cb.value);

        return {
            id: generarId(),
            usuario_id: 'usuario_demo',
            estudio_id: 'estudio_001',
            fecha_creacion: fechaActual,
            nombre_obra: document.getElementById('nombre_obra').value,
            ubicacion: document.getElementById('ubicacion').value,
            superficie_cubierta_m2: parseFloat(document.getElementById('superficie_cubierta_m2').value),
            superficie_semicubierta_m2: 0,
            plantas: parseInt(document.getElementById('plantas').value),
            tiene_planos: 'aprobados',
            dormitorios: parseInt(document.getElementById('dormitorios').value),
            cantidad_banos: parseInt(document.getElementById('cantidad_banos').value),
            tiene_cochera: document.getElementById('tiene_cochera').checked,
            tipo_cochera: document.getElementById('tiene_cochera').checked ? 'cubierta' : undefined,
            tiene_quincho: document.getElementById('tiene_quincho').checked,
            tiene_galeria: document.getElementById('tiene_galeria').checked,
            tiene_deck: document.getElementById('tiene_deck').checked,
            superficie_deck_m2: document.getElementById('tiene_deck').checked ? 15 : 0,
            cocina_equipada: true,
            estructura: document.getElementById('estructura').value,
            cubierta: document.getElementById('cubierta').value,
            tiene_escalera: false,
            categoria: document.getElementById('categoria').value,
            factor_terminacion: parseFloat(document.getElementById('factor_terminacion').value),
            pisos: document.getElementById('pisos').value,
            cielorraso: 'suspendido',
            aberturas: document.getElementById('aberturas').value,
            revestimiento_exterior: 'revoque_fino',
            porton_cerco: true,
            material_cerco: 'metalico',
            instalaciones: instalaciones,
            calentador_agua: 'termotanque_gas',
            tiene_cisterna: false,
            tiene_tanque_elevado: true,
            terreno: {
                tipo: 'lote_propio',
                zona_inundable: false
            },
            plazo_meses: parseInt(document.getElementById('plazo_meses').value),
            modalidad: document.getElementById('modalidad').value
        };
    }

    // Mostrar resultados
    function mostrarResultado(tipo, titulo, mensaje, detalles = null) {
        resultadosDiv.className = 'results-container show';
        resultadosDiv.classList.add(`result-${tipo}`);

        let html = `
            <div class="result-title">
                <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-spinner fa-spin'}"></i>
                ${titulo}
            </div>
            <p>${mensaje}</p>
        `;

        if (detalles) {
            html += `<div class="result-details">${detalles}</div>`;
        }

        resultadosDiv.innerHTML = html;
    }

    // Mostrar detalles del presupuesto
    function mostrarPresupuesto(presupuesto) {
        const totalFormateado = new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(presupuesto.total_estimado);

        let html = `
            <div class="result-title">
                <i class="fas fa-check-circle"></i>
                Presupuesto Generado Exitosamente
            </div>
            <p>El presupuesto ha sido generado correctamente.</p>
            
            <div class="result-details">
                <div class="result-item">
                    <h4>Resumen</h4>
                    <p><strong>Obra:</strong> ${presupuesto.blueprint.nombre_obra}</p>
                    <p><strong>Total estimado:</strong> ${totalFormateado}</p>
                    <p><strong>Versión:</strong> ${presupuesto.version}</p>
                    <p><strong>Fecha generación:</strong> ${presupuesto.fecha_generacion}</p>
                </div>
        `;

        // Mostrar algunos items de ejemplo
        if (presupuesto.items && presupuesto.items.length > 0) {
            html += `<div class="result-item">
                <h4>Items del presupuesto (${presupuesto.items.length} total)</h4>`;
            
            // Mostrar primeros 5 items
            const itemsMostrar = presupuesto.items.slice(0, 5);
            itemsMostrar.forEach(item => {
                const confianzaIcon = item.confianza === 'alta' ? 'fa-check-circle' : 
                                    item.confianza === 'media' ? 'fa-exclamation-circle' : 'fa-question-circle';
                const confianzaColor = item.confianza === 'alta' ? 'success' : 
                                     item.confianza === 'media' ? 'warning' : 'error';
                
                html += `
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        <strong>${item.descripcion}</strong>
                        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                            <span>Cantidad: ${item.cantidad} ${item.unidad}</span>
                            <span>Subtotal: $${item.subtotal.toLocaleString('es-AR')}</span>
                            <span><i class="fas ${confianzaIcon}" style="color: var(--${confianzaColor}-color)"></i> ${item.confianza}</span>
                        </div>
                    </div>
                `;
            });

            if (presupuesto.items.length > 5) {
                html += `<p>... y ${presupuesto.items.length - 5} items más</p>`;
            }

            html += `</div>`;
        }

        // Estado del caché
        if (presupuesto.estado_cache) {
            html += `<div class="result-item">
                <h4>Estado de los precios</h4>
                <p><strong>Precios frescos:</strong> ${presupuesto.estado_cache.frescos || 0}</p>
                <p><strong>Precios del caché:</strong> ${presupuesto.estado_cache.cache || 0}</p>
                <p><strong>Precios desactualizados:</strong> ${presupuesto.estado_cache.desactualizados || 0}</p>
            </div>`;
        }

        html += `</div>`;
        
        resultadosDiv.className = 'results-container show result-success';
        resultadosDiv.innerHTML = html;
    }

    // Validar blueprint
    async function validarBlueprint() {
        const blueprint = obtenerBlueprint();
        
        mostrarResultado('loading', 'Validando...', 'Validando los datos del blueprint...');

        try {
            const response = await fetch('/api/blueprint/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blueprint)
            });

            const result = await response.json();

            if (result.valido) {
                mostrarResultado('success', 'Blueprint válido', 'Todos los campos son correctos.');
            } else {
                let erroresHtml = '<ul>';
                result.errores.forEach(error => {
                    erroresHtml += `<li>${error}</li>`;
                });
                erroresHtml += '</ul>';
                
                mostrarResultado('error', 'Blueprint inválido', 'Se encontraron errores en los datos:', erroresHtml);
            }
        } catch (error) {
            mostrarResultado('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
            console.error('Error validando:', error);
        }
    }

    // Generar presupuesto
    async function generarPresupuesto() {
        const blueprint = obtenerBlueprint();
        const archivos = archivosInput.files;
        
        mostrarResultado('loading', 'Generando presupuesto...', 'Esto puede tomar unos segundos...');

        // Preparar datos para enviar
        const formData = new FormData();
        formData.append('blueprint', JSON.stringify(blueprint));
        
        for (let i = 0; i < archivos.length; i++) {
            formData.append('archivos', archivos[i]);
        }

        try {
            // Enviar como JSON (archivos se ignoran por ahora)
            const response = await fetch('/api/presupuesto/generar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    blueprint: blueprint,
                    archivos: [] // Por ahora no enviamos archivos reales
                })
            });

            const result = await response.json();

            if (result.exito) {
                mostrarPresupuesto(result.presupuesto);
            } else {
                mostrarResultado('error', 'Error generando presupuesto', 
                    'No se pudo generar el presupuesto.', 
                    result.errores ? result.errores.join(', ') : 'Error desconocido');
            }
        } catch (error) {
            mostrarResultado('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
            console.error('Error generando:', error);
        }
    }

    // Event listeners
    btnValidar.addEventListener('click', validarBlueprint);
    btnGenerar.addEventListener('click', generarPresupuesto);

    // Sincronizar categoría y factor de terminación
    const categoriaSelect = document.getElementById('categoria');
    const factorSelect = document.getElementById('factor_terminacion');

    categoriaSelect.addEventListener('change', function() {
        const factores = {
            'economico': '1.0',
            'estandar': '1.35',
            'premium': '1.8',
            'lujo': '2.5'
        };
        factorSelect.value = factores[this.value];
    });

    // Sincronizar factor con categoría (al revés)
    factorSelect.addEventListener('change', function() {
        const categorias = {
            '1.0': 'economico',
            '1.35': 'estandar',
            '1.8': 'premium',
            '2.5': 'lujo'
        };
        if (categorias[this.value]) {
            categoriaSelect.value = categorias[this.value];
        }
    });

    // Mostrar mensaje de bienvenida
    setTimeout(() => {
        mostrarResultado('success', 'Bienvenido', 'Completa el formulario para generar un presupuesto de construcción.');
    }, 1000);
});