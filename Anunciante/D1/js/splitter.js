// splitter.js - Módulo para manejar el redimensionamiento de columnas
export function inicializarSplitter() {
    const splitter = document.getElementById('canvas-gemini-splitter');
    const colCanvas = document.getElementById('col-canvas');
    const colGemini = document.getElementById('col-gemini');
    const mainContainer = document.getElementById('main-container');
    
    if (!splitter || !colCanvas || !colGemini || !mainContainer) {
        console.warn('Elementos del splitter no encontrados');
        return;
    }
    
    let isResizing = false;
    let startX, startWidth;
    
    splitter.addEventListener('mousedown', function(e) {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(colGemini).width, 10);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        splitter.classList.add('active');
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        const containerRect = mainContainer.getBoundingClientRect();
        const geminiMinWidth = 480;
        const canvasMinWidth = 400;
        
        // Calcular nuevo ancho para la columna Gemini
        let newGeminiWidth = startWidth + (startX - e.clientX);
        
        // Aplicar límites - corregido
        newGeminiWidth = Math.max(geminiMinWidth, newGeminiWidth);
        
        // Calcular el ancho máximo permitido (viewport - col formularios - márgenes)
        const formulariosWidth = parseInt(document.defaultView.getComputedStyle(document.getElementById('col-formularios')).width, 10);
        const maxGeminiWidth = window.innerWidth - formulariosWidth - canvasMinWidth - 60; // 60px de márgenes/padding
        
        newGeminiWidth = Math.min(newGeminiWidth, maxGeminiWidth);
        
        // Aplicar el nuevo tamaño
        colGemini.style.width = newGeminiWidth + 'px';
        colCanvas.style.flex = `0 0 calc(100% - ${formulariosWidth + newGeminiWidth + 12}px)`;
    });
    
    document.addEventListener('mouseup', function() {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        splitter.classList.remove('active');
    });
    
    // Prevenir arrastre de imágenes u otros elementos accidentales
    splitter.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });
    
    console.log('✅ Splitter inicializado correctamente');
}
