// === Configuración de la barra de indicadores ===
class BarraIndicadores {
    constructor() {
        this.indicadores = [];
        this.animationId = null;
        this.paused = false;
        this.scrollPosition = 0;
        this.velocidad = 1; // Velocidad de desplazamiento (píxeles por frame)
        this.prompts = {}; // Para almacenar los prompts cargados
        this.contextoActual = {}; // Para almacenar el contexto actual
        
        this.init();
    }

    // Inicializar la barra
    init() {
        this.createBarraDOM();
        this.cargarPrompts().then(() => {
            this.cargarIndicadoresIniciales();
        });
        this.iniciarAnimacion();
        this.setupEventListeners();
    }

    // Crear la estructura HTML de la barra
    createBarraDOM() {
        // Verificar si la barra ya existe para no duplicarla
        if (document.getElementById('barra-indicadores')) return;
        
        const barraContainer = document.createElement('div');
        barraContainer.id = 'barra-indicadores';
        barraContainer.innerHTML = `
            <div class="indicadores-container">
                <button id="btn-play-pause" class="btn-control">⏸️</button>
                <div class="indicadores-scroll">
                    <div class="indicadores-content" id="indicadores-content"></div>
                </div>
                <button id="btn-ver-mas" class="btn-control">VER MÁS</button>
            </div>
        `;
        
        // Insertar al inicio del body
        document.body.insertBefore(barraContainer, document.body.firstChild);
        
        // Añadir estilos
        this.addStyles();
    }

    // Añadir estilos CSS
    addStyles() {
        // Verificar si los estilos ya fueron añadidos
        if (document.getElementById('estilos-barra-indicadores')) return;
        
        const styles = `
            #barra-indicadores {
                background: #fff;
                color: #000;
                padding: 2px 0;
                font-family: 'Mulish', sans-serif;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000;
                width: 100%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                height: 24px;
            }
            
            .indicadores-container {
                display: flex;
                align-items: center;
                width: 100%;
                height: 100%;
                margin: 0 auto;
                padding: 0 15px;
                box-sizing: border-box;
            }
            
            .btn-control {
                background: transparent;
                border: none;
                color: #333;
                padding: 2px 4px;
                cursor: pointer;
                font-size: 20px;
                font-family: 'Mulish', sans-serif;
                transition: all 0.2s ease;
                flex-shrink: 0;
                white-space: nowrap;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 3px;
            }
            
            #btn-play-pause:hover {
                transform: scale(1.1);
            }
            
            #btn-ver-mas {
                font-size: 14px;
                font-weight: 800;
            }
            
            #btn-ver-mas:hover {
                box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                transform: translateY(-2px);
            }
            
            .indicadores-scroll {
                flex: 1;
                overflow: hidden;
                margin: 0 15px;
                height: 20px;
                position: relative;
            }
            
            .indicadores-content {
                display: flex;
                white-space: nowrap;
                position: absolute;
                height: 100%;
                align-items: center;
                will-change: transform;
            }
            
            .indicador-item {
                padding: 0 20px;
                font-size: 14px;
                display: flex;
                align-items: center;
                border-right: 1px solid #eee;
                height: 100%;
                color: #000;
                white-space: nowrap;
                max-width: 200ch;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .indicador-item:last-child {
                border-right: none;
            }
            
            .indicador-emoji {
                margin-right: 8px;
                font-size: 16px;
            }
            
            .indicador-fuente {
                font-size: 11px;
                color: #666;
                margin-left: 8px;
                text-decoration: none;
                font-style: italic;
                opacity: 0.8;
            }
            
            @media (max-width: 768px) {
                #btn-ver-mas {
                    display: none;
                }
                
                .indicadores-container {
                    padding: 0 10px;
                }
                
                .btn-control {
                    padding: 3px 6px;
                    font-size: 12px;
                    height: 18px;
                }
                
                .indicadores-scroll {
                    margin: 0 10px;
                    height: 18px;
                }
                
                .indicador-item {
                    padding: 0 15px;
                    font-size: 12px;
                    max-width: 150ch;
                }
                
                .indicador-emoji {
                    font-size: 14px;
                    margin-right: 6px;
                }
                
                .indicador-fuente {
                    font-size: 10px;
                    margin-left: 5px;
                }
            }

            @media (max-width: 480px) {
                #barra-indicadores {
                    padding: 3px 0;
                    height: 24px;
                }
                
                .indicadores-scroll {
                    margin: 0 8px;
                    height: 18px;
                }
                
                .indicador-item {
                    padding: 0 10px;
                    font-size: 11px;
                    max-width: 120ch;
                }
                
                .indicador-fuente {
                    font-size: 9px;
                    margin-left: 4px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'estilos-barra-indicadores';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Cargar prompts desde el archivo JSON
    async cargarPrompts() {
        try {
            const resp = await fetch('../../Anunciante/Tigo/json/prompts.json', { cache: "no-store" });
            if (!resp.ok) throw new Error("No se pudo cargar prompts.json");
            const data = await resp.json();
            
            // Convertir el array a un objeto con claves por id
            this.prompts = {};
            data.prompts.forEach(prompt => {
                this.prompts[prompt.id] = prompt.plantilla;
            });
            
            // DEBUG: Mostrar todos los prompts cargados
            console.log("📝 Prompts cargados:", Object.keys(this.prompts));
            console.log("🔍 Prompt 'barra_insights':", this.prompts['barra_insights']);
            
        } catch (error) {
            console.error('Error cargando prompts:', error);
            throw error; // Propagar el error para manejarlo externamente
        }
    }

    // Cargar indicadores iniciales basados en el anunciante
    async cargarIndicadoresIniciales() {
        try {
            const anunciante = this.detectarAnunciante();
            
            // Usar EXCLUSIVAMENTE el prompt específico para barra de insights
            if (!this.prompts['barra_insights']) {
                throw new Error("No se encontró el prompt 'barra_insights' en prompts.json");
            }
            
            const promptBase = this.prompts['barra_insights'];
            
            // Reemplazar placeholders básicos
            let prompt = promptBase.replace('{{anunciante}}', anunciante);
            
            // Mostrar en consola el análisis del prompt
            console.log("=== BARRA INDICADORES - PROMPT ANALYSIS ===");
            console.log("📋 Prompt inicial (template):");
            console.log(promptBase);
            console.log("🔄 Prompt final (con placeholders reemplazados):");
            console.log(prompt);
            console.log("📊 Contexto utilizado:");
            console.log({ anunciante });
            console.log("=======================");
            
            const insights = await this.obtenerInsightsGemini(prompt);
            this.indicadores = insights;
            this.mostrarIndicadores();
            
        } catch (error) {
            console.error('Error cargando insights:', error);
            // NO usar indicadores por defecto - dejar vacío o mostrar error
            this.indicadores = [];
            this.mostrarIndicadores();
        }
    }

    // Detectar anunciante desde la URL
    detectarAnunciante() {
        const m = location.pathname.match(/\/Anunciante\/([^\/]+)/i);
        return (m && m[1]) ? decodeURIComponent(m[1]) : "este sector";
    }

    // Obtener insights de Gemini
    async obtenerInsightsGemini(prompt) {
        try {
            const GAS_URL = "https://script.google.com/macros/s/AKfycbwVXklQ2ljmMUxys7fCh5ygUyS3jheoHQO3SIYvLr9ETQcOABgrMdaLrCEiiDBpStmW/exec";
            const OMNI_TOKEN = "gIe1TET33hc4i1w9K0WvcS6DHMIYjCgm5fgRqUWS";
            
            const resp = await fetch(GAS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ 
                    omniToken: OMNI_TOKEN, 
                    action: "geminiPrompt", 
                    prompt: prompt 
                })
            });
            
            const data = await resp.json();
            if (!data.ok) throw new Error(data.error);
            
            // Procesar la respuesta para extraer insights
            return this.procesarRespuestaInsights(data.output);
            
        } catch (error) {
            console.error('Error obteniendo insights:', error);
            throw error;
        }
    }

    // Procesar la respuesta de Gemini para extraer insights
    procesarRespuestaInsights(respuesta) {
        // Expresión regular para encontrar insights con fuentes en el formato [texto] (Fuente: nombre)
        const regex = /\[(.*?)\]\(Fuente:\s*(.*?)\)/g;
        let insights = [];
        let match;
        
        // Primero intentamos extraer con el formato estructurado
        while ((match = regex.exec(respuesta)) !== null) {
            if (match[1].length <= 200) {
                insights.push({
                    texto: match[1].trim(),
                    fuente: match[2].trim(),
                    tieneFuente: true
                });
            }
            
            if (insights.length >= 20) break;
        }
        
        // Si no encontramos insights con el formato estructurado, usamos el método anterior
        if (insights.length === 0) {
            const lines = respuesta.split('\n')
                .map(line => line.trim())
                .filter(line => 
                    line.length > 0 && 
                    line.length <= 200 &&
                    (line.includes('•') || 
                     line.match(/[🚀📊👥💡📈🎯❤️💰🔍📦💼]/) ||
                     line.match(/^\d+[\.\)\-]/) ||
                     !line.includes('  ') && line.split(' ').length <= 25)
                );
            
            // Eliminamos la limitación de líneas
            if (lines.length > 0) {
                insights = lines.slice(0, 20).map(line => ({
                    texto: line.replace(/^[•\d\s\.\)\-]+/, '').trim(),
                    fuente: "",
                    tieneFuente: false
                }));
            } else {
                // Fallback
                insights = respuesta.split(/[\.!?]/)
                    .map(phrase => phrase.trim())
                    .filter(phrase => phrase.length > 15 && phrase.length <= 200)
                    .slice(0, 20)
                    .map(phrase => {
                        const emoji = this.obtenerEmoji(phrase);
                        const texto = emoji !== '📌' ? `${emoji} ${phrase}.` : `${phrase}.`;
                        return {
                            texto: texto,
                            fuente: "",
                            tieneFuente: false
                        };
                    });
            }
        }
        
        return insights;
    }

    // Mostrar indicadores en la barra
    mostrarIndicadores() {
        const content = document.getElementById('indicadores-content');
        if (!content) return;
        
        if (this.indicadores.length === 0) {
            content.innerHTML = '<div class="indicador-item">⏳ Cargando insights...</div>';
            return;
        }
        
        content.innerHTML = this.indicadores
            .map(insight => `
                <div class="indicador-item">
                    <span class="indicador-texto">${insight.texto}</span>
                    ${insight.tieneFuente ? 
                        `<span class="indicador-fuente">(Fuente: ${insight.fuente})</span>` : 
                        ''
                    }
                </div>
            `)
            .join('');
        
        // Reiniciar animación
        this.scrollPosition = 0;
    }

    // Obtener emoji apropiado para el texto
    obtenerEmoji(texto) {
        const emojis = {
            'crecimiento|aumento|incremento|sube': '📈',
            'digital|tecnología|app|online|internet': '💻',
            'redes|social|facebook|instagram|twitter': '👥',
            'innovación|nuevo|moderno|avanzado': '💡',
            'éxito|logro|triunfo|ganar|vencer': '🏆',
            'tendencia|moda|popular|viral': '🚀',
            'datos|estadística|número|porcentaje': '📊',
            'ventas|precio|oferta|descuento|compra': '💰',
            'engagement|interacción|comentario|like': '❤️',
            'oportunidad|potencial|futuro|crecer': '🎯'
        };
        
        const textoLower = texto.toLowerCase();
        for (const [palabras, emoji] of Object.entries(emojis)) {
            const regex = new RegExp(palabras.split('|').join('|'), 'i');
            if (regex.test(textoLower)) return emoji;
        }
        
        return '📌';
    }

    // Iniciar animación continua de la barra
    iniciarAnimacion() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        
        const animate = () => {
            if (!this.paused && this.indicadores.length > 1) {
                const content = document.getElementById('indicadores-content');
                if (content) {
                    this.scrollPosition -= this.velocidad;
                    
                    // Si hemos llegado al final, reiniciamos la posición
                    if (-this.scrollPosition >= content.scrollWidth / 2) {
                        this.scrollPosition = 0;
                    }
                    
                    content.style.transform = `translateX(${this.scrollPosition}px)`;
                }
            }
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    // Configurar event listeners
    setupEventListeners() {
        const btnPlayPause = document.getElementById('btn-play-pause');
        const btnVerMas = document.getElementById('btn-ver-mas');
        const barra = document.getElementById('barra-indicadores');
        const indicadoresScroll = document.querySelector('.indicadores-scroll');
        
        if (btnPlayPause) {
            btnPlayPause.addEventListener('click', () => this.togglePlayPause());
        }
        
        if (btnVerMas) {
            btnVerMas.addEventListener('click', () => this.verMas());
        }
        
        if (barra && indicadoresScroll) {
            // Pausar al pasar el cursor por la barra
            barra.addEventListener('mouseenter', () => {
                this.paused = true;
            });
            
            // Reanudar al quitar el cursor de la barra
            barra.addEventListener('mouseleave', () => {
                // Solo reanudar si el botón de pausa no está activado manualmente
                const btn = document.getElementById('btn-play-pause');
                if (btn && btn.textContent === '⏸️') {
                    this.paused = false;
                }
            });
        }
    }

    // Toggle play/pause
    togglePlayPause() {
        this.paused = !this.paused;
        const btn = document.getElementById('btn-play-pause');
        if (btn) {
            btn.textContent = this.paused ? '▶️' : '⏸️';
            btn.title = this.paused ? 'Reanudar' : 'Pausar';
        }
    }

    // Acción para Ver Más - Mostrar todos los insights
    verMas() {
        if (this.indicadores.length === 0) {
            alert('⏳ No hay insights disponibles todavía.');
            return;
        }
        
        // Crear un modal con todos los insights
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';
        modal.style.fontFamily = "'Mulish', sans-serif";
        
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = 'white';
        modalContent.style.padding = '30px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.maxWidth = '90%';
        modalContent.style.maxHeight = '80%';
        modalContent.style.overflowY = 'auto';
        modalContent.style.boxSizing = 'border-box';
        modalContent.style.position = 'relative';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.background = '#f5f5f5';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '50%';
        closeButton.style.width = '30px';
        closeButton.style.height = '30px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.fontWeight = 'bold';
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        const title = document.createElement('h2');
        title.textContent = '💡 Todos los Insights';
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        title.style.textAlign = 'center';
        
        const insightsList = document.createElement('div');
        insightsList.innerHTML = this.indicadores
            .map((insight, index) => `
                <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: ${index < this.indicadores.length - 1 ? '1px solid #eee' : 'none'}">
                    <strong>${index + 1}.</strong> ${insight.texto}
                    ${insight.tieneFuente ? 
                        `<br><small>Fuente: ${insight.fuente}</small>` : 
                        ''
                    }
                </div>
            `)
            .join('');
        
        modalContent.appendChild(closeButton);
        modalContent.appendChild(title);
        modalContent.appendChild(insightsList);
        modal.appendChild(modalContent);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }

    // Método para añadir nuevos indicadores dinámicamente
    agregarIndicadores(nuevosIndicadores) {
        this.indicadores = [...this.indicadores, ...nuevosIndicadores];
        this.mostrarIndicadores();
    }

    // Método para actualizar con datos del formulario
    async actualizarConContexto(contexto) {
        try {
            this.contextoActual = contexto;
            
            // Usar EXCLUSIVAMENTE el prompt específico para barra de insights
            if (!this.prompts['barra_insights']) {
                throw new Error("No se encontró el prompt 'barra_insights' en prompts.json");
            }
            
            const promptBase = this.prompts['barra_insights'];
            
            // Reemplazar placeholders con el contexto actual
            let prompt = promptBase;
            const contextoUtilizado = {};
            
            for (const [key, value] of Object.entries(contexto)) {
                if (value) {
                    const placeholder = `{{${key}}}`;
                    if (prompt.includes(placeholder)) {
                        prompt = prompt.replace(new RegExp(placeholder, 'gi'), value);
                        contextoUtilizado[key] = value;
                    }
                }
            }
            
            // Mostrar en consola el análisis del prompt
            console.log("=== BARRA INDICADORES - PROMPT ANALYSIS ===");
            console.log("📋 Prompt inicial (template):");
            console.log(promptBase);
            console.log("🔄 Prompt final (con placeholders reemplazados):");
            console.log(prompt);
            console.log("📊 Contexto utilizado:");
            console.log(contextoUtilizado);
            console.log("=======================");
            
            const insights = await this.obtenerInsightsGemini(prompt);
            this.agregarIndicadores(insights);
            
        } catch (error) {
            console.error('Error actualizando insights:', error);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.barraIndicadores = new BarraIndicadores();
});

// Función global para actualizar desde otros scripts
window.actualizarBarraIndicadores = function(contexto) {
    if (window.barraIndicadores && typeof window.barraIndicadores.actualizarConContexto === 'function') {
        window.barraIndicadores.actualizarConContexto(contexto);
    }
};
