export async function cargarTamanosYCanvas() {
  const jsonPath = "../../Anunciante/Tigo/json/";
  const canvasContainer = document.getElementById("canvasContainer");

  if (!window.canvasRefs) window.canvasRefs = {};

  const checkboxes = document.querySelectorAll('input[name="tamanos"]:checked');
  const tamanosSeleccionados = Array.from(checkboxes).map(cb => cb.value);

  // Quitar canvases que ya no estén seleccionados
  Object.keys(window.canvasRefs).forEach(id => {
    if (!tamanosSeleccionados.includes(id)) {
      const ref = window.canvasRefs[id];
      if (ref.canvas && typeof ref.canvas.dispose === "function") {
        ref.canvas.dispose();
      }
      ref.wrapper.remove();
      delete window.canvasRefs[id];
    }
  });

  // Si no hay tamaños seleccionados, mostrar aviso
  if (tamanosSeleccionados.length === 0) {
    if (!canvasContainer.querySelector(".aviso-sin-tamanos")) {
      const aviso = document.createElement("div");
      aviso.textContent = "Selecciona los tamaños para desplegar los canvas ✅";
      aviso.style.fontSize = "14px";
      aviso.className = "aviso-sin-tamanos";
      canvasContainer.appendChild(aviso);
    }
    return;
  } else {
    const aviso = canvasContainer.querySelector(".aviso-sin-tamanos");
    if (aviso) aviso.remove();
  }

  const tamanos = await fetch(`${jsonPath}tamaños.json`).then(r => r.json());
  const tamanosFiltrados = tamanos.filter(t => tamanosSeleccionados.includes(t.id));

  tamanosFiltrados.forEach(t => {
    if (window.canvasRefs[t.id]) return; // Si ya existe, no recrear

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.marginBottom = "24px";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `check_${t.id}`;
    checkbox.checked = true;
    //checkbox.style.margin = "0 6px";

    // Label con formato: 🖼️ 300 x 250 ( [checkbox] Controles)
    const label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.style.marginBottom = "4px";
    label.style.fontWeight = "bold";
    label.style.display = "inline-flex";
    label.style.alignItems = "center";

    const textoInicial = document.createTextNode(`🖼️ ${t.nombre} /`);
    const textoFinal = document.createTextNode("Controles");

    label.appendChild(textoInicial);
    label.appendChild(checkbox);
    label.appendChild(textoFinal);

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.id = `canvas_${t.id}`;
    canvas.width = t.ancho;
    canvas.height = t.alto;

    // Armado en el wrapper
    wrapper.appendChild(label);
    wrapper.appendChild(canvas);
    canvasContainer.appendChild(wrapper);

    const fabricCanvas = new fabric.Canvas(canvas.id, {
      backgroundColor: "#ffffff",
      selection: true,
    });

    window.canvasRefs[t.id] = {
      canvas: fabricCanvas,
      activo: checkbox.checked,
      wrapper: wrapper,
      controles: null
    };

    function crearControles() {
      if (window.canvasRefs[t.id].controles) return;

      const ref = window.canvasRefs[t.id];
      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.flexDirection = "column";   // 👈 clave para apilar filas
      controls.style.gap = "10px";
      controls.style.marginTop = "4px";
      // controls.style.marginBottom = "4px"; // Separación entre filas
      controls.className = "controles-canvas";

      // --- Botones fila 1 ---
      const btnLogo = document.createElement("button");
      btnLogo.textContent = "®️";
      btnLogo.title = "Añadir logo";
      btnLogo.onclick = () => {
        import("./controlesCanvas.js").then(mod => mod.mostrarGaleriaLogos(ref.canvas));
      };

      const btnIcono = document.createElement("button");
      btnIcono.textContent = "ℹ️";
      btnIcono.title = "Añadir ícono";
      btnIcono.onclick = () => {
        import("./controlesCanvas.js").then(mod => mod.mostrarGaleriaIconos(ref.canvas));
      };

      const btnTexto = document.createElement("button");
      btnTexto.textContent = "✏️";
      btnTexto.title = "Añadir texto";
      btnTexto.onclick = () => {
        import("./controlesCanvas.js").then(mod => {
          mod.agregarTexto(ref.canvas);
        });
      };

      const btnLimpiar = document.createElement("button");
      btnLimpiar.textContent = "🔄";
      btnLimpiar.title = "Limpiar canva";
      btnLimpiar.onclick = () => {
        import("./controlesCanvas.js").then(mod => {
          mod.limpiarCanvas(ref.canvas);
        });
      };

      // Crear filas
      const fila1 = document.createElement("div");
      fila1.className = "fila1";
      
      const fila2 = document.createElement("div");
      fila2.className = "fila2";
      
      // Botones de la fila 1
      fila1.append(btnLogo, btnIcono, btnTexto, btnLimpiar);
      
      // Botón de forma para la fila 2
      const btnForma = document.createElement("button");
      btnForma.textContent = "💠";
      btnForma.title = "Añadir forma";
      //btnForma.style.width = "30px";
      //btnForma.style.height = "30px";
      //btnForma.style.gap = "2px";
      //btnForma.style.borderRadius = "6px";
      //btnForma.style.cursor = "pointer";
      btnForma.onclick = () => {
        import("./controlesCanvas.js").then(mod => mod.agregarForma(ref.canvas, "rectangulo"));
      };
      fila2.append(btnForma);
      
      // Controles extra (texto y formas)
      import("./controlesCanvas.js").then(mod => {
        const controlesTexto = mod.crearControlesTexto(ref);
        fila1.appendChild(controlesTexto);
      
        const controlesFormas = mod.crearControlesFormas(ref);
        controlesFormas.forEach(control => fila2.appendChild(control));
      });
      
      // Añadir filas al contenedor principal
      controls.append(fila1, fila2);

      // Montar el bloque de controles en el wrapper
      ref.wrapper.appendChild(controls);
      ref.controles = controls;
    }

    function eliminarControles() {
      const ref = window.canvasRefs[t.id];
      if (ref.controles) {
        ref.controles.remove();
        ref.controles = null;
      }
    }

    if (checkbox.checked) {
      crearControles();
      canvas.style.opacity = "1";
    } else {
      canvas.style.opacity = "0.3";
    }

    // Bloquear selección y edición de objetos al desactivar
    checkbox.addEventListener("change", () => {
      const ref = window.canvasRefs[t.id];
      ref.activo = checkbox.checked;

      // Opacidad
      canvas.style.opacity = checkbox.checked ? "1" : "0.3";

      // Bloquear/desbloquear selección en Fabric.js
      ref.canvas.selection = checkbox.checked;
      ref.canvas.forEachObject(obj => {
        obj.selectable = checkbox.checked;
        obj.evented = checkbox.checked;
      });
      ref.canvas.renderAll();

      // Controles
      if (checkbox.checked) {
        crearControles();
      } else {
        eliminarControles();
      }
    });
  });
}


















