export function agregarTexto(canvas) {
  const text = new fabric.Textbox("Escribe aquí", {
    left: 50,
    top: 50,
    fontSize: 24,
    fill: "#000000",
    fontFamily: "Arial",
    editable: true
  });

  canvas.add(text);
  canvas.setActiveObject(text);  // Selecciona automáticamente el texto al añadirlo
  canvas.requestRenderAll();
}

export function limpiarCanvas(canvas) {
  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.renderAll();
}
  
export async function mostrarGaleriaLogos(canvas) {
  const contenedor = document.getElementById("galeriaLogos");
  contenedor.innerHTML = ""; // Limpiar antes de renderizar
  
  const response = await fetch("../../Anunciante/Tigo/json/logos.json");
  const logos = await response.json();
  
  logos.forEach(logo => {
    const img = document.createElement("img");
    img.src = "../../Anunciante/Tigo/assets/logos/" + logo.nombreArchivo;
    img.title = logo.nombre;
    // ⚠️ ELIMINAR ESTOS ESTILOS EN LÍNEA:
    // img.style.width = "80px";
    // img.style.cursor = "pointer";
    // img.style.border = "1px solid #ccc";
    // img.style.borderRadius = "4px";
    img.onclick = () => {
      fabric.Image.fromURL(img.src, function(fabImg) {
        fabImg.scaleToWidth(100);
        fabImg.set({ 
          left: 20, 
          top: 20, 
          hasBorders: true, 
          hasControls: true,
          selectable: true // ✅
        });
        canvas.add(fabImg).setActiveObject(fabImg);
      });
      document.getElementById("modalLogos").style.display = "none";
    };
  
    contenedor.appendChild(img);
  });
  
  document.getElementById("modalLogos").style.display = "flex";
}

export async function mostrarGaleriaIconos(canvas) {
  const contenedor = document.getElementById("galeriaIconos");
  contenedor.innerHTML = ""; // Limpiar antes de renderizar

  const response = await fetch("../../Anunciante/Tigo/json/icons.json");
  const iconos = await response.json();

  iconos.forEach(icono => {
    const img = document.createElement("img");
    img.src = "../../Anunciante/Tigo/assets/icons/" + icono.nombreArchivo;
    img.title = icono.nombre;
    // ⚠️ ELIMINAR ESTOS ESTILOS EN LÍNEA:
    // img.style.width = "80px";
    // img.style.cursor = "pointer";
    // img.style.border = "1px solid #ccc";
    // img.style.borderRadius = "4px";
    img.onclick = () => {
      fabric.Image.fromURL(img.src, function(fabImg) {
        fabImg.scaleToWidth(60);
        fabImg.set({ 
          left: 50, 
          top: 50, 
          hasBorders: true, 
          hasControls: true,
          selectable: true // ✅
        });
        canvas.add(fabImg).setActiveObject(fabImg);
      });
      document.getElementById("modalIconos").style.display = "none";
    };

    contenedor.appendChild(img);
  });

  document.getElementById("modalIconos").style.display = "flex";
}

export async function generarCreatividadesConFondos(canvas, audiencia, factorId, opcionId, tamañoId, producto, callback) {
  console.log("🛠️ Parámetros recibidos:");
  console.log("  audiencia:", audiencia);
  console.log("  factorId:", factorId); //EL ERROR ESTABA ACÁ "factorId: tamanos"
  console.log("  opcionId:", opcionId); //EL ERROR ESTABA ACÁ "opcionId: 300x250"
  console.log("  tamañoId:", tamañoId);
  console.log("  producto:", producto);
  
  // Validación rápida de parámetros
  if (!audiencia || !factorId || !opcionId || !tamañoId) {
    console.error("❌ Parámetros incompletos para construir ruta de fondos.");
    callback(null, null, true, [], true);
    return;
  }

  // --- SIN fallback: solo la ruta exacta ---
  // const rutaBase = `../../Anunciante/Tigo/assets/fondos/${audiencia}/${factorId}/${opcionId}/${tamañoId}`;
  // console.log("📂 Ruta construida para fondos:", rutaBase);
  // const rutaFondosJSON = `${rutaBase}/fondos.json`;

  // --- Nueva ruta con nivel de producto ---
  const rutaBase = `../../Anunciante/Tigo/assets/fondos/${producto}/${audiencia}/${factorId}/${opcionId}/${tamañoId}`;
  console.log("📂 Ruta construida para fondos (con producto):", rutaBase);
  const rutaFondosJSON = `${rutaBase}/fondos.json`;

  // 1) validar existencia de fondos.json en la ruta exacta
  let fondos;
  try {
    const resp = await fetch(rutaFondosJSON, { cache: "no-store" });
    if (!resp.ok) throw new Error("fondos.json no encontrado");
    const parsed = await resp.json();
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("fondos.json vacío");
    fondos = parsed;
  } catch (err) {
    console.warn(`⚠️ No se encontró fondos.json en: ${rutaBase}`);
    // Informamos que la RUTA no cuenta con fondos y marcamos la COMBINACIÓN como terminada (done = true)
    callback(null, null, true, [rutaBase], true);
    return;
  }

  // 2) procesar secuencialmente cada archivo listado en fondos.json
  for (const archivo of fondos) {
    const rutaCompleta = `${rutaBase}/${archivo}`;

    // cargar la imagen como Promise
    let img;
    try {
      img = await new Promise((resolve, reject) => {
        fabric.Image.fromURL(rutaCompleta, oImg => {
          if (!oImg) return reject(new Error("no se pudo cargar imagen"));
          resolve(oImg);
        }, { crossOrigin: "anonymous" });
      });
    } catch (e) {
      console.warn(`❌ No se pudo cargar el fondo: ${rutaCompleta}`);
      // saltamos a siguiente fondo
      continue;
    }

    // crear canvas temporal con las dimensiones del canvas original (usar getWidth/getHeight)
    const width = (typeof canvas.getWidth === "function") ? canvas.getWidth() : (canvas.width || 300);
    const height = (typeof canvas.getHeight === "function") ? canvas.getHeight() : (canvas.height || 250);
    const canvasTemp = new fabric.Canvas(null, { width, height });

    // clonar objetos (await por cada clone para asegurar consistencia)
    const objetos = canvas.getObjects();
    for (const obj of objetos) {
      await new Promise(resolveClone => {
        obj.clone(clon => {
          clon.set({ selectable: true });
          canvasTemp.add(clon);
          resolveClone();
        });
      });
    }

    // poner fondo escalado y esperar a que se renderice
    await new Promise(resolveBg => {
      canvasTemp.setBackgroundImage(img, () => {
        canvasTemp.renderAll();
        resolveBg();
      }, {
        scaleX: canvasTemp.getWidth() / img.width,
        scaleY: canvasTemp.getHeight() / img.height
      });
    });

    // pequeña espera para asegurar render final
    await new Promise(r => setTimeout(r, 80));

    // generar dataURL
    const dataURL = canvasTemp.toDataURL({ format: "png", multiplier: 1 });

    // contador global (opcional, si lo usas)
    if (typeof window.totalGeneradas === "undefined") window.totalGeneradas = 0;
    window.totalGeneradas++;

    const nombreCreatividad = `OmniAdsAI_Tigo_${audiencia}_${opcionId}_${tamañoId}_${String(window.totalGeneradas).padStart(4, "0")}.png`;

    // informar cada creatividad generada (done = false → la COMBINACIÓN aún NO terminó)
    callback(dataURL, nombreCreatividad, false, [], false);
  }

  // 3) cuando terminamos todos los fondos en esta combinación notificamos done = true
  callback(null, null, false, [], true);
}

export function borradoPorTeclado() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      const canvasRefs = window.canvasRefs;
      if (!canvasRefs) return;

      Object.values(canvasRefs).forEach(ref => {
        const obj = ref.canvas.getActiveObject();
        if (obj) {
          ref.canvas.remove(obj);
          ref.canvas.discardActiveObject().renderAll();
        }
      });
    }
  });
}

export function crearControlesTexto(ref) {
  const container = document.createElement("div");
  container.className = "controles-texto";
  container.style.display = "flex";
  container.style.gap = "2px";
  container.style.alignItems = "center";
  
  const fontSelector = document.createElement("select");
  ["Arial", "Verdana", "Times New Roman", "Courier New", "Georgia", "Calibri"].forEach(font => {
    const option = document.createElement("option");
    option.value = font;
    option.textContent = font;
    fontSelector.appendChild(option);
  });

  // Estilos para que sea cuadrado y pequeño, ocultando el texto visible
  fontSelector.style.width = "30px";
  fontSelector.style.height = "30px";
  fontSelector.style.gap = "2px";
  fontSelector.style.padding = "0";
  fontSelector.style.textIndent = "-9999px"; // Oculta texto visible
  fontSelector.style.borderRadius = "6px";
  fontSelector.style.cursor = "pointer";
  fontSelector.title = "Seleccionar fuente de texto";

  fontSelector.onchange = () => {
    const active = ref.canvas.getActiveObject();
    if (active && (active.type === "textbox" || active.type === "text")) {
      active.set("fontFamily", fontSelector.value);
      ref.canvas.requestRenderAll();
    }
  };

  const colorPicker = document.createElement("input");
  colorPicker.type = "color";
  colorPicker.value = "#000000";

  // Estilos para que sea cuadrado y pequeño
  // colorPicker.style.width = "40px";
  // colorPicker.style.height = "40px";
  // colorPicker.style.padding = "0";
  // colorPicker.style.borderRadius = "6px";
  // colorPicker.style.cursor = "pointer";
  colorPicker.title = "Seleccionar color de texto";

  // Quitar apariencia nativa para poder personalizar (funciona en Chrome, Firefox)
  // colorPicker.style.webkitAppearance = "none";
  // colorPicker.style.mozAppearance = "none";
  // colorPicker.style.appearance = "none";
  
  // Añadir borde interior para simular que el cuadro de color es más pequeño
  //colorPicker.style.border = "none";
  //colorPicker.style.boxShadow = "inset 0 0 0 6px white"; // espacio blanco interno para reducir cuadro visible

  colorPicker.oninput = () => {
    const active = ref.canvas.getActiveObject();
    if (active && (active.type === "textbox" || active.type === "text")) {
      active.set("fill", colorPicker.value);
      ref.canvas.requestRenderAll();
    }
  };
  
  // Controles para sombra
  const shadowColorPicker = document.createElement("input");
  shadowColorPicker.type = "color";
  shadowColorPicker.value = "#000000";
  shadowColorPicker.title = "Color de sombra";
  shadowColorPicker.style.width = "30px";
  shadowColorPicker.style.height = "30px";
  shadowColorPicker.style.gap = "2px";
  shadowColorPicker.style.padding = "0";
  shadowColorPicker.style.borderRadius = "6px";
  shadowColorPicker.style.cursor = "pointer";
  //shadowColorPicker.style.marginLeft = "6px";

  const shadowOpacitySlider = document.createElement("input");
  shadowOpacitySlider.type = "range";
  shadowOpacitySlider.min = "0";
  shadowOpacitySlider.max = "1";
  shadowOpacitySlider.step = "0.05";
  shadowOpacitySlider.value = "0.3";
  shadowOpacitySlider.title = "Opacidad sombra";
  shadowOpacitySlider.style.width = "60px";
  //shadowOpacitySlider.style.marginLeft = "6px";
  shadowOpacitySlider.style.cursor = "pointer";

  const shadowToggle = document.createElement("button");
  shadowToggle.textContent = "🌗";
  shadowToggle.style.width = "30px";
  shadowToggle.style.height = "30px";
  shadowToggle.style.gap = "2px";
  shadowToggle.style.borderRadius = "6px";
  shadowToggle.style.cursor = "pointer";
  shadowToggle.title = "Alternar sombra en texto";

  shadowToggle.onclick = () => {
    const active = ref.canvas.getActiveObject();
    if (active && (active.type === "textbox" || active.type === "text")) {
      const hasShadow = !!active.shadow;
      if (hasShadow) {
        active.set("shadow", null);
      } else {
        active.set("shadow", {
          color: shadowColorPicker.value + toHexAlpha(parseFloat(shadowOpacitySlider.value)),
          blur: 5,
          offsetX: 2,
          offsetY: 2
        });
      }
      ref.canvas.requestRenderAll();
    }
  };

  shadowColorPicker.oninput = () => {
    const active = ref.canvas.getActiveObject();
    if (active && active.shadow) {
      const hex = shadowColorPicker.value;
      const alpha = parseFloat(shadowOpacitySlider.value);
      active.set("shadow", {
        color: hex + toHexAlpha(alpha),
        blur: 5,
        offsetX: 2,
        offsetY: 2
      });
      ref.canvas.requestRenderAll();
    }
  };

  shadowOpacitySlider.oninput = () => {
    const active = ref.canvas.getActiveObject();
    if (active && active.shadow) {
      const hex = shadowColorPicker.value;
      const alpha = parseFloat(shadowOpacitySlider.value);
      active.set("shadow", {
        color: hex + toHexAlpha(alpha),
        blur: 5,
        offsetX: 2,
        offsetY: 2
      });
      ref.canvas.requestRenderAll();
    }
  };

  // Función para convertir opacidad 0-1 a hex (2 dígitos)
  function toHexAlpha(alpha) {
    const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return hex;
  }

  container.appendChild(fontSelector);
  container.appendChild(colorPicker);
  container.appendChild(shadowToggle);
  container.appendChild(shadowColorPicker);
  container.appendChild(shadowOpacitySlider);

  return container;
}

export function agregarForma(canvas, tipo = "rectangulo") {
  let forma;

  switch (tipo) {
    case "circulo":
      forma = new fabric.Circle({
        radius: 40,
        fill: "#00aaff",
        left: 50,
        top: 50,
        stroke: "#000",
        strokeWidth: 2,
        shadow: null,
        selectable: true,
      });
      break;

    case "rectanguloRedondeado":
      forma = new fabric.Rect({
        width: 100,
        height: 60,
        fill: "#ffaa00",
        left: 50,
        top: 50,
        stroke: "#000",
        strokeWidth: 2,
        rx: 12,
        ry: 12,
        shadow: null,
        selectable: true,
      });
      break;

    case "rectangulo":
    default:
      forma = new fabric.Rect({
        width: 100,
        height: 60,
        fill: "#ff5500",
        left: 50,
        top: 50,
        stroke: "#000",
        strokeWidth: 2,
        shadow: null,
        selectable: true,
      });
      break;
  }

  canvas.add(forma);
  canvas.setActiveObject(forma);
  canvas.requestRenderAll();
}

export function crearControlesFormas(ref) {
  // Selector tipo de forma (dropdown)
  const shapeSelector = document.createElement("select");
  ["rectangulo", "circulo", "cuadrado", "rectanguloRedondeado"].forEach(tipo => {
    const option = document.createElement("option");
    option.value = tipo;
    option.textContent = {
      rectangulo: "⬛",
      circulo: "⚪",
      cuadrado: "⬜",
      rectanguloRedondeado: "▭"
    }[tipo];
    shapeSelector.appendChild(option);
  });
  shapeSelector.style.width = "30px";
  shapeSelector.style.height = "30px";
  shapeSelector.style.gap = "2px";
  shapeSelector.style.borderRadius = "6px";
  shapeSelector.style.cursor = "pointer";
  shapeSelector.title = "Seleccionar forma";

  // Color de relleno
  const fillColorPicker = document.createElement("input");
  fillColorPicker.type = "color";
  fillColorPicker.value = "#000000";
  fillColorPicker.style.width = "30px";
  fillColorPicker.style.height = "30px";
  fillColorPicker.style.gap = "2px";
  fillColorPicker.style.borderRadius = "6px";
  fillColorPicker.style.cursor = "pointer";
  fillColorPicker.title = "Color de relleno";

  // Color borde
  const strokeColorPicker = document.createElement("input");
  strokeColorPicker.type = "color";
  strokeColorPicker.value = "#000000";
  strokeColorPicker.style.width = "30px";
  strokeColorPicker.style.height = "30px";
  strokeColorPicker.style.gap = "2px";
  strokeColorPicker.style.borderRadius = "6px";
  strokeColorPicker.style.cursor = "pointer";
  strokeColorPicker.title = "Color del borde";

  // Grosor borde
  const strokeWidthSlider = document.createElement("input");
  strokeWidthSlider.type = "range";
  strokeWidthSlider.min = "0";
  strokeWidthSlider.max = "20";
  strokeWidthSlider.value = "1";
  strokeWidthSlider.style.width = "60px";
  //strokeWidthSlider.style.marginLeft = "6px";
  strokeWidthSlider.style.cursor = "pointer";
  strokeWidthSlider.title = "Grosor del borde";

  // Sombra: toggle, color y opacidad (reusa los controles de texto)
  const shadowColorPicker = document.createElement("input");
  shadowColorPicker.type = "color";
  shadowColorPicker.value = "#000000";
  shadowColorPicker.title = "Color de sombra";
  shadowColorPicker.style.width = "30px";
  shadowColorPicker.style.height = "30px";
  shadowColorPicker.style.gap = "2px";
  shadowColorPicker.style.borderRadius = "6px";
  shadowColorPicker.style.cursor = "pointer";
  //shadowColorPicker.style.marginLeft = "6px";

  const shadowOpacitySlider = document.createElement("input");
  shadowOpacitySlider.type = "range";
  shadowOpacitySlider.min = "0";
  shadowOpacitySlider.max = "1";
  shadowOpacitySlider.step = "0.05";
  shadowOpacitySlider.value = "0.3";
  shadowOpacitySlider.title = "Opacidad sombra";
  shadowOpacitySlider.style.width = "60px";
  //shadowOpacitySlider.style.marginLeft = "6px";
  shadowOpacitySlider.style.cursor = "pointer";

  const shadowToggle = document.createElement("button");
  shadowToggle.textContent = "🌗";
  shadowToggle.style.width = "30px";
  shadowToggle.style.height = "30px";
  shadowToggle.style.gap = "2px";
  shadowToggle.style.borderRadius = "6px";
  shadowToggle.style.cursor = "pointer";
  shadowToggle.title = "Alternar sombra en forma";

  // Eventos para actualizar la forma seleccionada
  shapeSelector.onchange = () => {
    const active = ref.canvas.getActiveObject();
    if (!active) return;
    const tipo = shapeSelector.value;

    // Crear nueva forma y reemplazar la actual
    const left = active.left;
    const top = active.top;
    const width = active.width * active.scaleX;
    const height = active.height * active.scaleY;

    let nuevaForma;
    if (tipo === "rectangulo") {
      nuevaForma = new fabric.Rect({ left, top, width, height, fill: active.fill, stroke: active.stroke, strokeWidth: active.strokeWidth, rx: 0, ry: 0 });
    } else if (tipo === "circulo") {
      const radio = Math.min(width, height) / 2;
      nuevaForma = new fabric.Circle({ left, top, radius: radio, fill: active.fill, stroke: active.stroke, strokeWidth: active.strokeWidth });
    } else if (tipo === "cuadrado") {
      const lado = Math.min(width, height);
      nuevaForma = new fabric.Rect({ left, top, width: lado, height: lado, fill: active.fill, stroke: active.stroke, strokeWidth: active.strokeWidth, rx: 0, ry: 0 });
    } else if (tipo === "rectanguloRedondeado") {
      nuevaForma = new fabric.Rect({ left, top, width, height, fill: active.fill, stroke: active.stroke, strokeWidth: active.strokeWidth, rx: 10, ry: 10 });
    }

    // Copiar sombra si tiene
    if (active.shadow) {
      nuevaForma.set("shadow", active.shadow);
    }

    ref.canvas.remove(active);
    ref.canvas.add(nuevaForma);
    ref.canvas.setActiveObject(nuevaForma);
    ref.canvas.requestRenderAll();
  };

  function actualizarPropiedades() {
    const active = ref.canvas.getActiveObject();
    if (!active) return;

    active.set({
      fill: fillColorPicker.value,
      stroke: strokeColorPicker.value,
      strokeWidth: parseFloat(strokeWidthSlider.value),
    });

    if (shadowToggle.dataset.sombraActiva === "true") {
      active.set("shadow", {
        color: shadowColorPicker.value + toHexAlpha(parseFloat(shadowOpacitySlider.value)),
        blur: 5,
        offsetX: 2,
        offsetY: 2,
      });
    } else {
      active.set("shadow", null);
    }

    ref.canvas.requestRenderAll();
  }

  fillColorPicker.oninput = actualizarPropiedades;
  strokeColorPicker.oninput = actualizarPropiedades;
  strokeWidthSlider.oninput = actualizarPropiedades;
  shadowColorPicker.oninput = actualizarPropiedades;
  shadowOpacitySlider.oninput = actualizarPropiedades;

  shadowToggle.dataset.sombraActiva = "false";
  shadowToggle.onclick = () => {
    const activo = shadowToggle.dataset.sombraActiva === "true";
    shadowToggle.dataset.sombraActiva = activo ? "false" : "true";
    actualizarPropiedades();
  };

  // Función para convertir opacidad 0-1 a hex (2 dígitos)
  function toHexAlpha(alpha) {
    const hex = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return hex;
  }

  return [shapeSelector, fillColorPicker, strokeColorPicker, strokeWidthSlider, shadowToggle, shadowColorPicker, shadowOpacitySlider];
}
