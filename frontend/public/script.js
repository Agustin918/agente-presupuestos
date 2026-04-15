const API_BASE = window.location.origin;

let currentStep = 1;
const totalSteps = 4;
let currentUser = null;
let presupuestoData = null;

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initWizard();
    initConditionalFields();
    initFormSync();
    initEventListeners();
    initFileHandler();
    loadHistory();
});

function initAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.name;
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    currentUser = {
        id: 'user_' + Date.now(),
        email: email,
        name: email.split('@')[0],
        estudio_id: 'estudio_001'
    };
    
    localStorage.setItem('user', JSON.stringify(currentUser));
    showMainApp();
});

document.getElementById('btnLogout').addEventListener('click', function() {
    localStorage.removeItem('user');
    currentUser = null;
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('userInfo').style.display = 'none';
});

function initWizard() {
    updateWizardUI();
    
    document.getElementById('btnPrev').addEventListener('click', prevStep);
    document.getElementById('btnNext').addEventListener('click', nextStep);
    document.getElementById('btnValidar').addEventListener('click', validarBlueprint);
    document.getElementById('btnGenerar').addEventListener('click', generarPresupuesto);
}

function updateWizardUI() {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.toggle('active', stepNum === currentStep);
        step.classList.toggle('completed', stepNum < currentStep);
    });

    document.querySelectorAll('.step-line').forEach((line, index) => {
        line.classList.toggle('completed', index + 1 < currentStep);
    });

    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        step.classList.toggle('active', index + 1 === currentStep);
    });

    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');
    const btnValidar = document.getElementById('btnValidar');
    const btnGenerar = document.getElementById('btnGenerar');

    btnPrev.style.display = currentStep > 1 ? 'inline-flex' : 'none';
    
    if (currentStep === totalSteps) {
        btnNext.style.display = 'none';
        btnValidar.style.display = 'inline-flex';
        btnGenerar.style.display = 'inline-flex';
    } else {
        btnNext.style.display = 'inline-flex';
        btnValidar.style.display = 'none';
        btnGenerar.style.display = 'none';
    }
}

function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
            currentStep++;
            updateWizardUI();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateWizardUI();
    }
}

function validateCurrentStep() {
    const currentStepEl = document.querySelector(`.wizard-step[data-step="${currentStep}"]`);
    const requiredFields = currentStepEl.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value || (field.type === 'checkbox' && !field.checked && !isAnyChecked(field.name))) {
            isValid = false;
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });

    if (!isValid) {
        showToast('Por favor, completá todos los campos requeridos', 'error');
    }

    return isValid;
}

function isAnyChecked(name) {
    return document.querySelectorAll(`[name="${name}"]:checked`).length > 0;
}

function initConditionalFields() {
    document.getElementById('tiene_deck').addEventListener('change', function() {
        document.getElementById('deckSection').style.display = this.checked ? 'grid' : 'none';
    });

    document.getElementById('estructura').addEventListener('change', function() {
        document.getElementById('steelFrameSection').style.display = 
            this.value === 'steel_frame' ? 'block' : 'none';
    });

    document.getElementById('plantas').addEventListener('change', function() {
        const opciones = document.getElementById('plantasOpciones');
        opciones.style.display = parseInt(this.value) > 1 ? 'grid' : 'none';
    });

    document.getElementById('tiene_escalera').addEventListener('change', function() {
        document.getElementById('tipoEscaleraContainer').style.display = 
            this.checked ? 'block' : 'none';
    });

    document.getElementById('porton_cerco').addEventListener('change', function() {
        document.getElementById('materialCercoContainer').style.display = 
            this.checked ? 'block' : 'none';
    });
}

function initFileHandler() {
    const archivosInput = document.getElementById('archivos');
    const archivosLista = document.getElementById('archivosLista');
    let archivosData = [];

    archivosInput.addEventListener('change', function() {
        archivosData = Array.from(this.files);
        actualizarListaArchivos();
    });

    function actualizarListaArchivos() {
        if (archivosData.length === 0) {
            archivosLista.innerHTML = '<p class="no-files">No hay archivos adjuntos</p>';
            return;
        }

        let html = '<div class="files-grid">';
        archivosData.forEach((file, index) => {
            const ext = file.name.split('.').pop().toLowerCase();
            const icon = getFileIcon(ext);
            const size = formatFileSize(file.size);
            
            html += `
                <div class="file-item" data-index="${index}">
                    <div class="file-icon">${icon}</div>
                    <div class="file-info">
                        <div class="file-name" title="${file.name}">${file.name}</div>
                        <div class="file-meta">${size} • ${ext.toUpperCase()}</div>
                    </div>
                    <button class="file-remove" onclick="removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        archivosLista.innerHTML = html;
    }

    window.removeFile = function(index) {
        archivosData.splice(index, 1);
        // Recrear el FileList
        const dt = new DataTransfer();
        archivosData.forEach(file => dt.items.add(file));
        archivosInput.files = dt.files;
        actualizarListaArchivos();
    };

    actualizarListaArchivos();
}

function getFileIcon(ext) {
    const icons = {
        'pdf': '<i class="fas fa-file-pdf"></i>',
        'dwg': '<i class="fas fa-drafting-compass"></i>',
        'skp': '<i class="fas fa-cube"></i>',
        'jpg': '<i class="fas fa-image"></i>',
        'jpeg': '<i class="fas fa-image"></i>',
        'png': '<i class="fas fa-image"></i>',
        'xlsx': '<i class="fas fa-file-excel"></i>',
        'xls': '<i class="fas fa-file-excel"></i>',
        'ifc': '<i class="fas fa-building"></i>',
        '3dm': '<i class="fas fa-cube"></i>',
        'obj': '<i class="fas fa-cube"></i>',
        'rvt': '<i class="fas fa-drafting-compass"></i>',
        'default': '<i class="fas fa-file"></i>'
    };
    return icons[ext] || icons['default'];
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Función para convertir archivo a base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Función para subir archivos al servidor
async function subirArchivos(files) {
    try {
        const archivosBase64 = await Promise.all(
            Array.from(files).map(async (file) => {
                const base64 = await fileToBase64(file);
                return {
                    nombre: file.name,
                    data: base64.split(',')[1], // Extraer solo la parte base64
                    tipo: file.type,
                    tamano: file.size
                };
            })
        );

        const response = await fetch(`${API_BASE}/api/upload/base64`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivos: archivosBase64 })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`[Upload] ${result.archivos.length} archivos subidos`);
            return result.archivos;
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error subiendo archivos:', error);
        throw error;
    }
}

// Función para procesar archivos y extraer datos
async function procesarArchivos(archivos, blueprint = {}) {
    try {
        updateProgressStep(1, 'running', 'Procesando archivos...');

        const response = await fetch(`${API_BASE}/api/upload/procesar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivos, blueprint })
        });

        const result = await response.json();
        
        updateProgressStep(1, 'completed', 'Archivos procesados');

        if (result.success) {
            return {
                blueprint: result.blueprint,
                extraccion: result.extraccion
            };
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error procesando archivos:', error);
        throw error;
    }
}

function initFormSync() {
    const categoriaSelect = document.getElementById('categoria');
    const factorDisplay = document.getElementById('factor_terminacion_display');

    const factores = {
        'economico': '1.0',
        'estandar': '1.35',
        'premium': '1.8',
        'lujo': '2.5'
    };

    categoriaSelect.addEventListener('change', function() {
        factorDisplay.value = factores[this.value];
    });
}

function initEventListeners() {
    document.getElementById('blueprintForm').addEventListener('reset', function(e) {
        setTimeout(() => {
            updateWizardUI();
            initConditionalFields();
            currentStep = 1;
            updateWizardUI();
        }, 0);
    });
}

function generarId() {
    return 'bp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function obtenerBlueprint() {
    const instalaciones = Array.from(document.querySelectorAll('input[name="instalaciones"]:checked'))
        .map(cb => cb.value);

    return {
        id: generarId(),
        usuario_id: currentUser?.id || 'usuario_demo',
        estudio_id: currentUser?.estudio_id || 'estudio_001',
        fecha_creacion: new Date().toISOString().split('T')[0],
        escenarios: document.getElementById('escenarios').checked,
        
        nombre_obra: document.getElementById('nombre_obra').value,
        ubicacion: document.getElementById('ubicacion').value,
        superficie_cubierta_m2: parseFloat(document.getElementById('superficie_cubierta_m2').value),
        superficie_semicubierta_m2: parseFloat(document.getElementById('superficie_semicubierta_m2').value) || 0,
        plantas: parseInt(document.getElementById('plantas').value),
        tiene_planos: document.getElementById('tiene_planos').value,
        
        dormitorios: parseInt(document.getElementById('dormitorios').value),
        cantidad_banos: parseInt(document.getElementById('cantidad_banos').value),
        tiene_cochera: document.getElementById('tiene_cochera').checked,
        tipo_cochera: document.getElementById('tiene_cochera').checked ? 'cubierta' : undefined,
        tiene_quincho: document.getElementById('tiene_quincho').checked,
        tiene_galeria: document.getElementById('tiene_galeria').checked,
        tiene_deck: document.getElementById('tiene_deck').checked,
        superficie_deck_m2: document.getElementById('tiene_deck').checked ? 
            parseFloat(document.getElementById('superficie_deck_m2').value) || 15 : 0,
        cocina_equipada: document.getElementById('cocina_equipada').checked,
        
        estructura: document.getElementById('estructura').value,
        panel_espesor: document.getElementById('estructura').value === 'steel_frame' ? 
            parseInt(document.getElementById('panel_espesor').value) : undefined,
        cubierta: document.getElementById('cubierta').value,
        tiene_escalera: parseInt(document.getElementById('plantas').value) > 1 && 
            document.getElementById('tiene_escalera').checked,
        tipo_escalera: parseInt(document.getElementById('plantas').value) > 1 ? 
            document.getElementById('tipo_escalera').value : undefined,
        
        categoria: document.getElementById('categoria').value,
        factor_terminacion: parseFloat(document.getElementById('factor_terminacion_display').value),
        pisos: document.getElementById('pisos').value,
        cielorraso: document.getElementById('cielorraso').value,
        aberturas: document.getElementById('aberturas').value,
        revestimiento_exterior: document.getElementById('revestimiento_exterior').value,
        porton_cerco: document.getElementById('porton_cerco').checked,
        material_cerco: document.getElementById('porton_cerco').checked ? 
            document.getElementById('material_cerco').value : undefined,
        
        instalaciones: instalaciones,
        calentador_agua: document.getElementById('calentador_agua').value,
        tiene_cisterna: document.getElementById('tiene_cisterna').checked,
        tiene_tanque_elevado: document.getElementById('tiene_tanque_elevado').checked,
        
        terreno: {
            tipo: document.getElementById('terreno_tipo').value,
            desnivel_metros: parseFloat(document.getElementById('desnivel_metros').value) || 0,
            zona_inundable: document.getElementById('terreno_zona_inundable').checked,
            requiere_demolicion: document.getElementById('requiere_demolicion').checked
        },
        
        plazo_meses: parseInt(document.getElementById('plazo_meses').value),
        modalidad: document.getElementById('modalidad').value,
        observaciones: document.getElementById('observaciones').value
    };
}

async function validarBlueprint() {
    const blueprint = obtenerBlueprint();
    
    try {
        const response = await fetch(`${API_BASE}/api/blueprint/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(blueprint)
        });

        const result = await response.json();

        if (result.valido) {
            showToast('Blueprint válido ✓', 'success');
        } else {
            let erroresHtml = '<ul>';
            result.errores.forEach(error => {
                erroresHtml += `<li>${error}</li>`;
            });
            erroresHtml += '</ul>';
            showToast('Blueprint inválido. Verificá los campos.', 'error');
        }
    } catch (error) {
        showToast('Error de conexión con el servidor', 'error');
        console.error('Error validando:', error);
    }
}

async function generarPresupuesto() {
    const blueprint = obtenerBlueprint();
    
    if (!validateCurrentStep()) return;

    const progressOverlay = document.getElementById('progressOverlay');
    progressOverlay.style.display = 'flex';
    
    updateProgressStep(1, 'running', 'Subiendo archivos...');

    try {
        // Subir archivos si hay
        const archivosInput = document.getElementById('archivos');
        let archivosSubidos = [];
        
        if (archivosInput.files && archivosInput.files.length > 0) {
            updateProgressStep(1, 'running', `Subiendo ${archivosInput.files.length} archivo(s)...`);
            archivosSubidos = await subirArchivos(archivosInput.files);
            updateProgressStep(1, 'completed', `(${archivosSubidos.length}) archivos subidos`);
        } else {
            updateProgressStep(1, 'completed', 'Sin archivos adjuntos');
        }

        // Procesar archivos y extraer datos
        let blueprintFinal = blueprint;
        let datosExtraidos = null;
        
        if (archivosSubidos.length > 0) {
            updateProgressStep(2, 'running', 'Analizando archivos (puede tomar unos minutos)...');
            try {
                const procesamiento = await procesarArchivos(archivosSubidos, blueprint);
                blueprintFinal = procesamiento.blueprint;
                datosExtraidos = procesamiento.extraccion;
                
                updateProgressStep(2, 'completed', `(${datosExtraidos?.campos_extraidos || 0}) campos extraídos`);
                
                // Mostrar datos extraídos
                mostrarDatosExtraidos({
                    blueprint: blueprintFinal,
                    confianza: datosExtraidos?.confianza,
                    campos_extraidos: datosExtraidos?.campos_extraidos,
                    archivos_procesados: archivosSubidos.map(a => a.nombre)
                });
                
            } catch (procError) {
                console.error('Error en procesamiento:', procError);
                updateProgressStep(2, 'completed', 'Análisis completo');
                showToast('Archivos subidos, análisis parcial', 'info');
            }
        } else {
            updateProgressStep(2, 'completed', 'Sin archivos para analizar');
        }

        updateProgressStep(3, 'running', 'Buscando precios actualizados...');

        // Timeout extendido para el fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15 * 60 * 1000); // 15 min

        const response = await fetch(`${API_BASE}/api/presupuesto/generar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                blueprint: blueprintFinal,
                archivos: archivosSubidos
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        updateProgressStep(3, 'completed', 'Precios obtenidos');
        updateProgressStep(4, 'running', 'Generando presupuesto...');

        const result = await response.json();

        updateProgressStep(4, 'completed', '¡Presupuesto listo!');

        setTimeout(() => {
            progressOverlay.style.display = 'none';
            resetProgressUI();

            if (result.exito) {
                presupuestoData = result.presupuesto;
                if (result.presupuesto.comparativo) {
                    mostrarComparativo(result.presupuesto.comparativo);
                } else {
                    mostrarPresupuesto(result.presupuesto);
                }
                saveToHistory(blueprintFinal, result.presupuesto);
            } else {
                showToast('Error generando presupuesto', 'error');
                mostrarError(result.errores);
            }
        }, 500);

    } catch (error) {
        progressOverlay.style.display = 'none';
        resetProgressUI();
        showToast('Error: ' + error.message, 'error');
        console.error('Error generando:', error);
    }
}

function updateProgressStep(step, status, message) {
    const stepEl = document.querySelector(`.progress-step[data-step="${step}"]`);
    if (stepEl) {
        const icon = stepEl.querySelector('i');
        stepEl.className = `progress-step ${status}`;
        
        if (status === 'running') {
            icon.className = 'fas fa-spinner fa-spin';
        } else if (status === 'completed') {
            icon.className = 'fas fa-check-circle';
        } else if (status === 'error') {
            icon.className = 'fas fa-exclamation-circle';
        }
        
        stepEl.lastElementChild.textContent = message;
    }
    
    // También actualizar mensaje de detalle
    const detailEl = document.getElementById('progressDetail');
    if (detailEl && status === 'running') {
        detailEl.innerHTML = `<i class="fas fa-search"></i> ${message}`;
    }
}

function resetProgressUI() {
    document.querySelectorAll('.progress-step').forEach(step => {
        step.className = 'progress-step';
        step.querySelector('i').className = 'fas fa-circle';
    });
    const detailEl = document.getElementById('progressDetail');
    if (detailEl) detailEl.innerHTML = '';
}

function mostrarDatosExtraidos(extraccion) {
    const container = document.getElementById('extraccionInfo');
    const camposDiv = document.getElementById('extraccionCampos');
    
    if (!container || !camposDiv) return;
    
    if (!extraccion || !extraccion.campos_extraidos) {
        container.style.display = 'none';
        return;
    }
    
    let html = '<ul style="margin: 0; padding-left: 20px;">';
    
    for (const [campo, valor] of Object.entries(extraccion.blueprint)) {
        if (campo.startsWith('_') || campo === 'id') continue;
        
        const confianza = extraccion.confianza?.[campo] || 'media';
        const confClass = confianza === 'alta' ? 'conf-alta' : confianza === 'baja' ? 'conf-baja' : 'conf-media';
        
        const label = campo.replace(/_/g, ' ');
        const valorFormateado = typeof valor === 'number' ? valor.toLocaleString('es-AR') : valor;
        
        html += `<li style="margin: 5px 0;">
            <strong>${label}:</strong> ${valorFormateado}
            <span class="confianza-badge ${confClass}" style="margin-left: 5px;">${confianza}</span>
        </li>`;
    }
    
    html += '</ul>';
    html += `<p style="margin-top: 10px; font-size: 0.85rem; color: #666;">
        <i class="fas fa-file-alt"></i> Archivos procesados: ${extraccion.archivos_procesados?.length || 0}
        | Campos extraídos: ${extraccion.campos_extraidos}
    </p>`;
    
    camposDiv.innerHTML = html;
    container.style.display = 'block';
}

function mostrarPresupuesto(presupuesto) {
    const resultadosDiv = document.getElementById('resultados');
    
    const totalFormateado = formatCurrency(presupuesto.total_estimado);
    const fechaFormateada = new Date(presupuesto.fecha).toLocaleDateString('es-AR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let html = `
        <div class="result-header">
            <div class="result-title">
                <i class="fas fa-check-circle"></i>
                Presupuesto Generado
            </div>
            <p>${presupuesto.obra} • ${fechaFormateada}</p>
        </div>
        
        <div class="result-summary-card">
            <div class="summary-main">
                <span class="summary-label">TOTAL ESTIMADO</span>
                <span class="summary-value">${totalFormateado}</span>
            </div>
            <div class="summary-details">
                <div class="summary-item">
                    <span class="label">Superficie</span>
                    <span class="value">${presupuesto.superficie_m2} m²</span>
                </div>
                <div class="summary-item">
                    <span class="label">Estructura</span>
                    <span class="value">${presupuesto.estructura}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Categoría</span>
                    <span class="value">${presupuesto.categoria}</span>
                </div>
            </div>
        </div>

        <div class="cache-status-bar">
            <span class="cache-badge fresh"><i class="fas fa-check"></i> ${presupuesto.precios_frescos} precios frescos</span>
            <span class="cache-badge cached"><i class="fas fa-clock"></i> ${presupuesto.precios_cache} del caché</span>
            ${presupuesto.precios_vencidos > 0 ? `<span class="cache-badge expired"><i class="fas fa-exclamation"></i> ${presupuesto.precios_vencidos} vencidos</span>` : ''}
        </div>

        <div class="items-section">
            <h4><i class="fas fa-list"></i> Detalle del Presupuesto</h4>
            <div class="table-container">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Rubro</th>
                            <th>Descripción</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                            <th>Confianza</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    presupuesto.items.forEach(item => {
        const confianzaClass = `conf-${item.confianza || 'media'}`;
        html += `
            <tr class="${item.precio_desactualizado ? 'row-warning' : ''}">
                <td><strong>${item.rubro || '-'}</strong></td>
                <td>${item.descripcion || '-'}</td>
                <td>${item.cantidad ? item.cantidad.toLocaleString('es-AR') : '-'}</td>
                <td>${item.precio_unitario ? formatCurrency(item.precio_unitario) : '-'}</td>
                <td><strong>${item.subtotal ? formatCurrency(item.subtotal) : '-'}</strong></td>
                <td><span class="confianza-badge ${confianzaClass}">${item.confianza || 'media'}</span></td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>

        <div class="downloads-section">
            <h4><i class="fas fa-download"></i> Descargar</h4>
            <div class="download-buttons">
                <button class="btn-download excel" onclick="downloadExcel()">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
                <button class="btn-download pdf" onclick="downloadPDF()">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button class="btn-download json" onclick="downloadJSON()">
                    <i class="fas fa-file-code"></i> JSON
                </button>
            </div>
        </div>
    `;

    resultadosDiv.innerHTML = html;
    resultadosDiv.className = 'results-container show result-success';
    resultadosDiv.scrollIntoView({ behavior: 'smooth' });
}

function mostrarComparativo(comparativo) {
    const resultadosDiv = document.getElementById('resultados');
    
    const fechaFormateada = new Date(comparativo.fecha).toLocaleDateString('es-AR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let html = `
        <div class="result-header">
            <div class="result-title">
                <i class="fas fa-check-circle"></i>
                Comparativa de Escenarios
            </div>
            <p>${comparativo.obra} • ${fechaFormateada}</p>
        </div>

        <div class="comparative-table">
            <table>
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Factor</th>
                        <th>Total Estimado</th>
                        <th>vs Económico</th>
                        <th>Diferencia</th>
                    </tr>
                </thead>
                <tbody>
    `;

    const baseTotal = comparativo.escenarios[0]?.total_estimado || 1;

    comparativo.escenarios.forEach((escenario, index) => {
        const diferencia = baseTotal > 0 ? ((escenario.total_estimado - baseTotal) / baseTotal * 100).toFixed(1) : 0;
        const isSelected = index === 2;
        html += `
            <tr class="${isSelected ? 'selected' : ''}">
                <td><strong>${escenario.categoria}</strong></td>
                <td>x${escenario.factor}</td>
                <td><strong>${formatCurrency(escenario.total_estimado)}</strong></td>
                <td>${escenario.diferencia_vs_economico}</td>
                <td class="${diferencia > 0 ? 'text-success' : 'text-muted'}">${diferencia > 0 ? '+' : ''}${diferencia}%</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        ${comparativo.escenarios[0]?.items_que_mas_cambian?.length > 0 ? `
        <div class="comparative-notes">
            <h5><i class="fas fa-info-circle"></i> Items que más cambian entre categorías:</h5>
            <ul>
                ${comparativo.escenarios[0].items_que_mas_cambian.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="downloads-section">
            <h4><i class="fas fa-download"></i> Descargar</h4>
            <div class="download-buttons">
                <button class="btn-download excel" onclick="downloadExcel()">
                    <i class="fas fa-file-excel"></i> Excel Comparativo
                </button>
                <button class="btn-download json" onclick="downloadJSON()">
                    <i class="fas fa-file-code"></i> JSON
                </button>
            </div>
        </div>
    `;

    resultadosDiv.innerHTML = html;
    resultadosDiv.className = 'results-container show result-success';
}

function mostrarError(errores) {
    const resultadosDiv = document.getElementById('resultados');
    resultadosDiv.innerHTML = `
        <div class="result-error">
            <div class="result-title">
                <i class="fas fa-exclamation-circle"></i>
                Error generando presupuesto
            </div>
            <p>No se pudo generar el presupuesto.</p>
            <div class="error-details">
                <ul>
                    ${(errores || ['Error desconocido']).map(e => `<li>${e}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
    resultadosDiv.className = 'results-container show result-error';
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(value);
}

function downloadExcel() {
    if (!presupuestoData) {
        showToast('Primero generá un presupuesto', 'error');
        return;
    }
    
    fetch(`${API_BASE}/api/presupuesto/descargar/excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presupuesto: presupuestoData })
    })
    .then(r => r.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presupuesto_${presupuestoData.obra.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('Excel descargado', 'success');
    })
    .catch(err => {
        downloadFallback('xlsx', presupuestoData);
    });
}

function downloadPDF() {
    if (!presupuestoData) {
        showToast('Primero generá un presupuesto', 'error');
        return;
    }
    
    fetch(`${API_BASE}/api/presupuesto/descargar/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presupuesto: presupuestoData })
    })
    .then(r => r.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presupuesto_${presupuestoData.obra.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showToast('PDF descargado', 'success');
    })
    .catch(err => {
        showToast('Error generando PDF. Probá descargando JSON.', 'error');
    });
}

function downloadJSON() {
    if (!presupuestoData) {
        showToast('Primero generá un presupuesto', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(presupuestoData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presupuesto_${presupuestoData.obra.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('JSON descargado', 'success');
}

function downloadFallback(format, data) {
    const html = generarHTMLPresupuesto(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presupuesto_${data.obra.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Archivo HTML descargado como alternativa', 'info');
}

function generarHTMLPresupuesto(data) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Presupuesto - ${data.obra}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .total { font-size: 1.5em; font-weight: bold; color: #2c3e50; }
        .summary { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Presupuesto de Construcción</h1>
    <p><strong>Obra:</strong> ${data.obra}</p>
    <p><strong>Fecha:</strong> ${data.fecha}</p>
    <p><strong>Superficie:</strong> ${data.superficie_m2} m²</p>
    <p><strong>Estructura:</strong> ${data.estructura}</p>
    <p><strong>Categoría:</strong> ${data.categoria}</p>
    
    <div class="summary">
        <p class="total">TOTAL ESTIMADO: ${formatCurrency(data.total_estimado)}</p>
    </div>
    
    <h2>Detalle</h2>
    <table>
        <thead>
            <tr>
                <th>Rubro</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map(item => `
            <tr>
                <td>${item.rubro || '-'}</td>
                <td>${item.descripcion || '-'}</td>
                <td>${item.cantidad || '-'}</td>
                <td>${item.precio_unitario ? formatCurrency(item.precio_unitario) : '-'}</td>
                <td>${item.subtotal ? formatCurrency(item.subtotal) : '-'}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/presupuestos`);
        const data = await response.json();
        
        const historyList = document.getElementById('historyList');
        
        if (data.presupuestos && data.presupuestos.length > 0) {
            historyList.innerHTML = data.presupuestos.slice(0, 5).map(item => `
                <div class="history-item" onclick="loadPresupuesto('${item.id}')">
                    <strong>${item.nombre_obra}</strong>
                    <span>${item.superficie_m2} m² • ${formatCurrency(item.total_estimado)}</span>
                    <small>${item.fecha}</small>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = '<p class="no-history">Sin presupuestos anteriores</p>';
        }
    } catch (error) {
        document.getElementById('historyList').innerHTML = '<p class="no-history">Error cargando historial</p>';
    }
}

function saveToHistory(blueprint, presupuesto) {
    const history = JSON.parse(localStorage.getItem('presupuestoHistory') || '[]');
    history.unshift({
        id: presupuesto.id || blueprint.id,
        nombre_obra: blueprint.nombre_obra,
        fecha: new Date().toLocaleDateString('es-AR'),
        superficie_m2: blueprint.superficie_cubierta_m2,
        total_estimado: presupuesto.total_estimado,
        estructura: blueprint.estructura,
        categoria: blueprint.categoria
    });
    
    localStorage.setItem('presupuestoHistory', JSON.stringify(history.slice(0, 10)));
    loadHistory();
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
