const API_BASE = window.location.origin;
let currentStep = 1;
const totalSteps = 4;
let currentUser = null;
let presupuestoData = null;
let map = null;
let marker = null;

document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    initWizard();
    initConditionalFields();
    initFormSync();
    initEventListeners();
    initFileHandler();
    initMap();
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

    // Fix para que el mapa se renderice correctamente si volvemos al paso 1
    if (currentStep === 1 && typeof map !== 'undefined' && map) {
        setTimeout(() => map.invalidateSize(), 100);
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

// Variable global para acumular archivos
let archivosAcumulados = [];

function initFileHandler() {
    const archivosInput = document.getElementById('archivos');
    const archivosLista = document.getElementById('archivosLista');

    archivosInput.addEventListener('change', function(e) {
        // Agregar los nuevos archivos a la lista acumulada
        const nuevosArchivos = Array.from(this.files);
        
        // Verificar si ya existen archivos con el mismo nombre
        for (const nuevo of nuevosArchivos) {
            const yaExiste = archivosAcumulados.some(a => a.name === nuevo.name);
            if (!yaExiste) {
                archivosAcumulados.push(nuevo);
            }
        }
        
        // Recrear el FileList con todos los archivos
        const dt = new DataTransfer();
        archivosAcumulados.forEach(file => dt.items.add(file));
        archivosInput.files = dt.files;
        
        actualizarListaArchivos();
    });

    function actualizarListaArchivos() {
        if (archivosAcumulados.length === 0) {
            archivosLista.innerHTML = '<p class="no-files">Arrastrá archivos o hacé click para seleccionar</p>';
            return;
        }

        let html = '<div class="files-header">';
        html += `<span>${archivosAcumulados.length} archivo(s) seleccionado(s)</span>`;
        html += `<button class="btn-limpiar-todos" onclick="limpiarTodosArchivos()"><i class="fas fa-trash" aria-hidden="true"></i> Limpiar todos</button>`;
        html += '</div>';
        html += '<div class="files-grid">';
        
        archivosAcumulados.forEach((file, index) => {
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
                        <i class="fas fa-times" aria-hidden="true"></i>
                    </button>
                </div>
            `;
        });
        html += '</div>';
        archivosLista.innerHTML = html;
    }

    // Función global para remover archivo individual
    window.removeFile = function(index) {
        archivosAcumulados.splice(index, 1);
        const dt = new DataTransfer();
        archivosAcumulados.forEach(file => dt.items.add(file));
        archivosInput.files = dt.files;
        actualizarListaArchivos();
    };

    // Función global para limpiar todos
    window.limpiarTodosArchivos = function() {
        archivosAcumulados = [];
        archivosInput.value = '';
        actualizarListaArchivos();
    };

    actualizarListaArchivos();
}

function getFileIcon(ext) {
    const icons = {
        'pdf': '<i class="fas fa-file-pdf" aria-hidden="true"></i>',
        'dwg': '<i class="fas fa-drafting-compass" aria-hidden="true"></i>',
        'skp': '<i class="fas fa-cube" aria-hidden="true"></i>',
        'jpg': '<i class="fas fa-image" aria-hidden="true"></i>',
        'jpeg': '<i class="fas fa-image" aria-hidden="true"></i>',
        'png': '<i class="fas fa-image" aria-hidden="true"></i>',
        'xlsx': '<i class="fas fa-file-excel" aria-hidden="true"></i>',
        'xls': '<i class="fas fa-file-excel" aria-hidden="true"></i>',
        'ifc': '<i class="fas fa-building" aria-hidden="true"></i>',
        '3dm': '<i class="fas fa-cube" aria-hidden="true"></i>',
        'obj': '<i class="fas fa-cube" aria-hidden="true"></i>',
        'rvt': '<i class="fas fa-drafting-compass" aria-hidden="true"></i>',
        'default': '<i class="fas fa-file" aria-hidden="true"></i>'
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

// Función para subir archivos al servidor usando FormData (más eficiente para archivos grandes)
async function subirArchivos(files) {
    try {
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('archivos', files[i]);
        }

        const response = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error subiendo: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            console.log(`[Upload] ${result.archivos.length} archivos subidos`);
            return result.archivos;
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error subiendo archivos:', error);
        throw error;
    }
}

// Función para procesar archivos y extraer datos
async function procesarArchivos(archivos, blueprint = {}) {
    try {
        const response = await fetch(`${API_BASE}/api/upload/procesar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivos, blueprint })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error desconocido al procesar');
        }
        
        return result;
        
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
        observaciones: document.getElementById('observaciones').value,

        detalle_constructivo: {
            ladrillo_tipo: document.getElementById('ladrillo_tipo').value,
            ladrillo_espesor_cm: 18, // Por defecto, se puede expandir después
            fundacion_tipo: document.getElementById('fundacion_tipo').value,
            fundacion_espesor_cm: parseInt(document.getElementById('fundacion_espesor_cm').value) || 20,
            entrepiso_tipo: document.getElementById('entrepiso_tipo').value,
            steel_frame_perfil: document.getElementById('estructura').value === 'steel_frame' ? 'PGC' : undefined,
            steel_frame_espesor_chapa: document.getElementById('estructura').value === 'steel_frame' ? '0.9mm' : undefined
        }
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

    const btnGenerar = document.getElementById('btnGenerar');
    const btnValidar = document.getElementById('btnValidar');
    btnGenerar.disabled = true;
    btnValidar.disabled = true;
    btnGenerar.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Generando...';

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
        
        let mensajeError = 'Error de conexión';
        if (error.name === 'AbortError') {
            mensajeError = 'La solicitud tardó demasiado. Intentá de nuevo.';
        } else if (error.message) {
            mensajeError = error.message;
        }
        
        showToast(mensajeError, 'error');
        mostrarError([mensajeError]);
        console.error('Error generando:', error);
    } finally {
        const btnGenerar = document.getElementById('btnGenerar');
        const btnValidar = document.getElementById('btnValidar');
        if (btnGenerar) {
            btnGenerar.disabled = false;
            btnGenerar.innerHTML = '<i class="fas fa-calculator" aria-hidden="true"></i> Generar Presupuesto';
        }
        if (btnValidar) {
            btnValidar.disabled = false;
        }
    }
}

function updateProgressStep(step, status, message) {
    const stepEl = document.querySelector(`.progress-step-item[data-step="${step}"]`);
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('progressStatus');
    
    if (stepEl) {
        if (status === 'running') {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
            if (message) statusText.textContent = message;
            
            // Simular avance de barra
            const progressMap = {1: 15, 2: 40, 3: 75, 4: 95};
            if (progressBar) progressBar.style.width = `${progressMap[step]}%`;
        } else if (status === 'completed') {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
            if (step === 4 && progressBar) progressBar.style.width = '100%';
        }
    }
}

function resetProgressUI() {
    document.querySelectorAll('.progress-step-item').forEach(step => {
        step.classList.remove('active', 'completed');
    });
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = '0%';
    const statusText = document.getElementById('progressStatus');
    if (statusText) statusText.textContent = 'Iniciando proceso...';
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
        <i class="fas fa-file-alt" aria-hidden="true"></i> Archivos procesados: ${extraccion.archivos_procesados?.length || 0}
        | Campos extraídos: ${extraccion.campos_extraidos}
    </p>`;
    
    camposDiv.innerHTML = html;
    container.style.display = 'block';
}

function mostrarPresupuesto(presupuesto) {
    const resultadosDiv = document.getElementById('resultados');
    
    const totalFormateado = formatCurrency(presupuesto.total_estimado);
    const costoM2Formateado = formatCurrency(presupuesto.costo_m2);
    
    // Formatear fecha local evitando desfase UTC
    const [year, month, day] = presupuesto.fecha.split('-');
    const fechaFormateada = new Date(year, month - 1, day).toLocaleDateString('es-AR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let html = `
        <div class="result-header">
            <div class="result-title">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
                Presupuesto Generado (Dólares)
            </div>
            <p>${presupuesto.obra} • ${fechaFormateada}</p>
        </div>

        <div class="dashboard-grid">
            <div class="chart-box">
                <h5 style="margin-top:0"><i class="fas fa-chart-pie"></i> Distribución de Gastos</h5>
                <div style="height: 250px; display: flex; justify-content: center;">
                    <canvas id="budgetChart"></canvas>
                </div>
            </div>
            
            <div class="result-summary-card" style="margin-bottom: 0;">
                <div class="summary-main">
                    <div class="total-box">
                        <span class="summary-label">TOTAL ESTIMADO</span>
                        <span class="summary-value">${totalFormateado}</span>
                    </div>
                    <div class="m2-box" style="border-left: 1px solid rgba(26,58,95,0.1); padding-left: 20px;">
                        <span class="summary-label">COSTO POR M²</span>
                        <span class="summary-value" style="font-size: 1.8rem; color: #3a7bd5;">${costoM2Formateado}</span>
                    </div>
                </div>
                <div class="summary-details">
                    <div class="summary-item">
                        <span class="label"><i class="fas fa-ruler-combined"></i> Superficie</span>
                        <span class="value">${presupuesto.superficie_m2} m²</span>
                    </div>
                    <div class="summary-item">
                        <span class="label"><i class="fas fa-building"></i> Estructura</span>
                        <span class="value">${presupuesto.estructura}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label"><i class="fas fa-award"></i> Categoría</span>
                        <span class="value">${presupuesto.categoria}</span>
                    </div>
                </div>
            </div>
        </div>

        ${renderQACard(presupuesto.reporte_qa)}

        <div class="cache-status-bar">
            <span class="cache-badge fresh"><i class="fas fa-check" aria-hidden="true"></i> ${presupuesto.precios_frescos} precios frescos</span>
            <span class="cache-badge cached"><i class="fas fa-clock" aria-hidden="true"></i> ${presupuesto.precios_cache} del caché</span>
        </div>

        <div class="items-section">
            <h4><i class="fas fa-list" aria-hidden="true"></i> Detalle por Etapas</h4>
    `;

    // Agrupar items por categoría
    const grupos = {};
    presupuesto.items.forEach(item => {
        const cat = item.categoria || 'Varios';
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(item);
    });

    Object.keys(grupos).sort().forEach(cat => {
        const items = grupos[cat];
        const subtotalCat = items.reduce((sum, i) => sum + i.subtotal, 0);
        
        html += `
            <div class="category-group" style="margin-bottom: 30px; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                <div class="category-header" style="background: #f8f9fa; padding: 12px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <h5 style="margin: 0; color: #1a3a5f;">${cat}</h5>
                    <span style="font-weight: bold; color: #1a3a5f;">Subtotal: ${formatCurrency(subtotalCat)}</span>
                </div>
                <div class="table-container">
                    <table class="items-table">
                        <thead>
                            <tr>
                                <th style="width: 25%">Rubro</th>
                                <th style="width: 35%">Descripción</th>
                                <th style="width: 10%">Cant.</th>
                                <th style="width: 15%">Precio Unit.</th>
                                <th style="width: 15%">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        items.forEach(item => {
            html += `
                <tr class="${item.precio_desactualizado ? 'row-warning' : ''}">
                    <td><strong>${item.rubro || '-'}</strong></td>
                    <td>
                        <div class="item-desc">${item.descripcion || '-'}</div>
                        ${item.razonamiento_ia ? `
                            <div class="ai-reasoning" title="Criterio técnico de la IA">
                                <i class="fas fa-brain"></i> ${item.razonamiento_ia}
                            </div>
                        ` : ''}
                    </td>
                    <td>${item.cantidad ? item.cantidad.toLocaleString('es-AR') : '-'}</td>
                    <td>${formatCurrency(item.precio_unitario)}</td>
                    <td><strong>${formatCurrency(item.subtotal)}</strong></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    html += `</div>`; // Cerrar items-section

    html += `
        <div class="downloads-section">
            <h4><i class="fas fa-download" aria-hidden="true"></i> Descargar</h4>
            <div class="download-buttons">
                <button class="btn-download excel" onclick="downloadExcel()">
                    <i class="fas fa-file-excel" aria-hidden="true"></i> Excel
                </button>
                <button class="btn-download pdf" onclick="downloadPDF()">
                    <i class="fas fa-file-pdf" aria-hidden="true"></i> PDF
                </button>
                <button class="btn-download json" onclick="downloadJSON()">
                    <i class="fas fa-file-code" aria-hidden="true"></i> JSON
                </button>
            </div>
        </div>
    `;

    resultadosDiv.innerHTML = html;
    resultadosDiv.className = 'results-container show result-success';
    resultadosDiv.scrollIntoView({ behavior: 'smooth' });

    // Inicializar gráfico después de inyectar el HTML
    setTimeout(() => initBudgetChart(presupuesto), 100);
}

function renderQACard(report) {
    if (!report) return '';
    const statusClass = `qa-${report.status}`;
    const statusLabel = report.status === 'aprobado' ? 'Auditoría Exitosa' : 
                       report.status === 'critico' ? 'ALERTA CRÍTICA DEL AUDITOR' : 'Observaciones Técnicas';
    
    return `
        <div class="qa-card ${statusClass}">
            <h4 style="margin-top:0"><i class="fas fa-user-shield"></i> ${statusLabel}</h4>
            ${report.alerta_roja.length > 0 ? `
                <div style="margin-bottom: 10px;">
                    <strong style="display:block; margin-bottom: 5px;">⚠️ Alertas:</strong>
                    <ul style="margin:0; padding-left: 20px;">
                        ${report.alerta_roja.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            <div>
                <strong style="display:block; margin-bottom: 5px;">💡 Sugerencias:</strong>
                <ul style="margin:0; padding-left: 20px;">
                    ${report.sugerencias.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function initBudgetChart(presupuesto) {
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;

    const grupos = {};
    presupuesto.items.forEach(item => {
        const cat = item.categoria || 'Varios';
        grupos[cat] = (grupos[cat] || 0) + item.subtotal;
    });

    const labels = Object.keys(grupos);
    const data = Object.values(grupos);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#1a3a5f', '#3a7bd5', '#00d2ff', '#4fcf8d', '#f6ad55', 
                    '#fc8181', '#9f7aea', '#ed64a6', '#4fd1c5', '#718096'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } }
            }
        }
    });
}

function mostrarComparativo(comparativo) {
    const resultadosDiv = document.getElementById('resultados');
    
    const fechaFormateada = new Date(comparativo.fecha).toLocaleDateString('es-AR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    let html = `
        <div class="result-header">
            <div class="result-title">
                <i class="fas fa-check-circle" aria-hidden="true"></i>
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
            <h5><i class="fas fa-info-circle" aria-hidden="true"></i> Items que más cambian entre categorías:</h5>
            <ul>
                ${comparativo.escenarios[0].items_que_mas_cambian.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <div class="downloads-section">
            <h4><i class="fas fa-download" aria-hidden="true"></i> Descargar</h4>
            <div class="download-buttons">
                <button class="btn-download excel" onclick="downloadExcel()">
                    <i class="fas fa-file-excel" aria-hidden="true"></i> Excel Comparativo
                </button>
                <button class="btn-download json" onclick="downloadJSON()">
                    <i class="fas fa-file-code" aria-hidden="true"></i> JSON
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
                <i class="fas fa-exclamation-circle" aria-hidden="true"></i>
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

function formatCurrency(valor) {
    if (!valor && valor !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
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
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}" aria-hidden="true"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
function initMap() {
    // Coordenadas por defecto (Buenos Aires - Obelisco)
    const defaultLat = -34.6037;
    const defaultLng = -58.3816;

    map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLng], {
        draggable: true
    }).addTo(map);

    // Actualizar coordenadas iniciales
    document.getElementById('lat').value = defaultLat;
    document.getElementById('lng').value = defaultLng;

    marker.on('dragend', function(event) {
        const position = marker.getLatLng();
        updateLocationFromCoords(position.lat, position.lng);
    });

    map.on('click', function(event) {
        const position = event.latlng;
        marker.setLatLng(position);
        updateLocationFromCoords(position.lat, position.lng);
    });
}

async function updateLocationFromCoords(lat, lng) {
    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await response.json();
        if (data && data.display_name) {
            document.getElementById('ubicacion').value = data.display_name;
        }
    } catch (error) {
        console.warn('Error en reverse geocoding:', error);
    }
}
