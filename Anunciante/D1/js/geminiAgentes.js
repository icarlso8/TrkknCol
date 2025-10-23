// === Config: backend GAS ===
const GAS_URL   = window.GAS_URL   || "https://script.google.com/macros/s/AKfycbwVXklQ2ljmMUxys7fCh5ygUyS3jheoHQO3SIYvLr9ETQcOABgrMdaLrCEiiDBpStmW/exec";
const OMNI_TOKEN = window.OMNI_TOKEN || "gIe1TET33hc4i1w9K0WvcS6DHMIYjCgm5fgRqUWS";

// === Ruta del prompts.json (CORREGIDA) ===
const PROMPTS_URL = "../../Anunciante/D1/json/prompts.json";
// === Ruta del factores.json ===
const FACTORES_URL = "../../Anunciante/D1/json/factores.json";

// --- utilidades ---
const byId = (id) => document.getElementById(id);
const getVal = (...ids) => {
  for (const id of ids) { 
    const el = byId(id);
    if (el && typeof el.value === "string") return el.value.trim();
  }
  return "";
};
const getCheckedValuesByName = (name) =>
  Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(el => (el.value || "").trim()).filter(Boolean);

// Función helper para encontrar elementos por texto
const findElementByText = (text, tagName = '*') => {
  const elements = document.getElementsByTagName(tagName);
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].textContent.includes(text)) {
      return elements[i];
    }
  }
  return null;
};

// Obtener texto de la opción seleccionada en un select
const getSelectedText = (selectId) => {
  const select = byId(selectId);
  if (!select) return "";
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption ? selectedOption.text.trim() : "";
};

// Intenta deducir el anunciante por la ruta /Anunciante/{X}/
const detectarAnunciante = () => {
  const m = location.pathname.match(/\/Anunciante\/([^\/]+)/i);
  return (m && m[1]) ? decodeURIComponent(m[1]) : "Anunciante";
};

// Obtener textos de checkboxes seleccionados
const getCheckedTextsByName = (name) => {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
    .map(el => {
      // Buscar el label asociado al checkbox para obtener el texto
      const label = el.closest('label');
      return label ? label.textContent.trim() : el.value;
    })
    .filter(Boolean);
};

// Factores contextuales en forma { factor: [opciones...] }
const getFactoresSeleccionados = () => {
  const factores = {};
  const inputs = document.querySelectorAll('fieldset.form-group input[type="checkbox"]');
  inputs.forEach(input => {
    const name = input.name;
    if (!name) return;
    if (!factores[name]) factores[name] = [];
    if (input.checked) factores[name].push(input.value);
  });
  delete factores["audiencia"];
  delete factores["tamanos"];
  return factores;
};

// Reemplaza {{placeholder}}
const fillTemplate = (template, map) =>
  (template || "").replace(/\{\{([^}]+)\}\}/g, (_, rawKey) => {
    const key = rawKey.trim();
    return (map[key] ?? map[normalizarClave(key)] ?? "");
  });

// Normaliza llaves
const normalizarClave = (k) =>
  k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // quita tildes
   .replace(/[^\w]/g, "_")                            // espacios/raros -> _
   .toLowerCase();

// Obtener el texto completo de la campaña seleccionada (con emojis) desde el DOM
const getCampaniaTextoCompleto = () => {
  const campanaSelect = byId("campana");
  if (!campanaSelect) return getVal("campana");
  
  const selectedOption = campanaSelect.options[campanaSelect.selectedIndex];
  return selectedOption ? selectedOption.text.trim() : getVal("campana");
};

// Cargar factores.json
async function loadFactores() {
  try {
    const resp = await fetch(FACTORES_URL, { cache: "no-store" });
    if (!resp.ok) throw new Error("No se pudo cargar factores.json");
    return await resp.json();
  } catch (error) {
    console.error("Error cargando factores.json:", error);
    return [];
  }
}

// Obtener textos completos de factores contextuales desde el JSON
const getFactoresTextoCompleto = async (facObj) => {
  const factoresData = await loadFactores();
  const factoresConTextos = {};
  
  Object.entries(facObj).forEach(([factorId, opcionIds]) => {
    // Buscar el factor en el JSON
    const factorData = factoresData.find(f => f.id === factorId);
    
    let factorTexto = factorId;
    if (factorData) {
      factorTexto = `${factorData.emoji} ${factorData.nombre}`;
    }
    
    // Convertir IDs de opciones a textos completos
    const opcionesTextos = opcionIds.map(opcionId => {
      if (factorData) {
        // Buscar la opción en el JSON
        const opcionData = factorData.opciones.find(o => o.id === opcionId);
        if (opcionData) {
          return `${opcionData.emoji} ${opcionData.nombre}`;
        }
      }
      
      // Fallback: buscar en el DOM si no se encuentra en el JSON
      const checkbox = document.querySelector(`input[name="${factorId}"][value="${opcionId}"]`);
      if (checkbox) {
        const label = checkbox.closest('label');
        return label ? label.textContent.trim() : opcionId;
      }
      
      return opcionId;
    });
    
    factoresConTextos[factorTexto] = opcionesTextos;
  });
  
  return factoresConTextos;
};

// Construye el contexto
const buildContext = async () => {
  const anunciante = detectarAnunciante();
  
  // Obtener textos en lugar de valores (IDs) para selects
  const segmentoText = getSelectedText("segmento");
  const negocioText = getSelectedText("negocio");
  const productoText = getSelectedText("producto");
  
  // Para la campaña, obtener el texto completo con emojis desde el DOM
  const campaniaTexto = getCampaniaTextoCompleto();
  const descripcionText = getVal("descripcion");

  // Obtener textos de checkboxes (audiencias)
  const audSel = getCheckedTextsByName("audiencia");
  // Quitar bullets y saltos de línea innecesarios
  const audTexto = audSel.join(", ");

  // Para factores contextuales, usar el JSON para obtener textos completos
  const facObj = getFactoresSeleccionados();
  const factoresConTextos = await getFactoresTextoCompleto(facObj);

  const facNombres = Object.keys(factoresConTextos).join(", ");
  const facDetalle = Object.entries(factoresConTextos)
    .map(([factor, opciones]) => `${factor}: ${Array.isArray(opciones) ? opciones.join(", ") : opciones}`)
    .join("; ");

  const values = {
    "anunciante": anunciante,
    "segmento": segmentoText,
    "negocio": negocioText,
    "producto": productoText,
    "campaña": campaniaTexto,
    "campania": campaniaTexto, // Mantener ambas versiones por compatibilidad
    "descripcion": descripcionText,
    "audiencia": audTexto,
    "factores_contextuales": facNombres,
    "factores_contextuales_seleccion": facDetalle
  };

  const normalized = {};
  Object.entries(values).forEach(([k, v]) => normalized[normalizarClave(k)] = v);
  
  // Asegurar que todas las variantes de "campaña" y "factores_contextuales" estén disponibles
  // en el objeto normalizado para compatibilidad con los templates
  if (!normalized.campania && normalized.campana) {
    normalized.campania = normalized.campana;
  }
  if (!normalized.campana && normalized.campania) {
    normalized.campana = normalized.campania;
  }
  
  // Asegurar variantes de factores_contextuales
  if (normalized.factores_contextuales) {
    normalized.factores_contextuales_seleccion = normalized.factores_contextuales_seleccion || "";
  }

  return { raw: values, norm: normalized, textos: values };
};

// Llama a GAS
async function callGemini(promptText) {
  const resp = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ omniToken: OMNI_TOKEN, action: "geminiPrompt", prompt: promptText })
  });
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || "Error desconocido");
  return data.output || "";
}

// Carga prompts.json
async function loadPrompts() {
  const resp = await fetch(PROMPTS_URL, { cache: "no-store" });
  if (!resp.ok) throw new Error("No se pudo cargar prompts.json");
  const data = await resp.json();
  
  // Convertir el array a un objeto con claves por id
  const promptsMap = {};
  data.prompts.forEach(prompt => {
    promptsMap[prompt.id] = {
      template: prompt.plantilla,
      titulo: prompt.titulo,
      descripcion: prompt.descripcion
    };
  });
  
  return promptsMap;
}

// === SOLUCIÓN COMPLETA: Función setupClearButtons corregida ===
function setupClearButtons() {
  // Función para borrar contenido de un área específica
  const clearOutput = (outputSelector) => {
    const outputElement = document.querySelector(outputSelector);
    if (outputElement) {
      outputElement.textContent = "";
      console.log(`✅ Contenido borrado: ${outputSelector}`);
    }
  };

  // Mapeo de botones de borrado y sus áreas correspondientes
  const clearButtonsConfig = {
    "btn-clear-copies": "#agente-output-copies",
    "btn-clear-insights": "#agente-output-insights",
    "btn-clear-competencia": "#agente-output-competencia",
    "btn-clear-tendencias": "#agente-output-tendencias"
  };

  // Función para configurar un botón individual (VERSIÓN CORREGIDA)
  const setupButton = (buttonId, outputSelector) => {
    const button = document.getElementById(buttonId);
    if (button) {
      // ✅ ELIMINAR TODA la sobrescritura de estilos - dejar que CSS controle todo
      // SOLO agregar el evento de clic
      
      // Configurar el evento de clic
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        clearOutput(outputSelector);
      });
      
      return true;
    }
    return false;
  };

  // Configurar botones existentes inmediatamente
  let buttonsConfigured = 0;
  Object.entries(clearButtonsConfig).forEach(([buttonId, outputSelector]) => {
    if (setupButton(buttonId, outputSelector)) {
      buttonsConfigured++;
    }
  });

  // Si no encontramos botones, usar un observador más agresivo
  if (buttonsConfigured === 0) {
    console.log("⏳ Botones de borrado no encontrados, iniciando observador...");
    
    const observer = new MutationObserver(() => {
      let foundCount = 0;
      Object.entries(clearButtonsConfig).forEach(([buttonId, outputSelector]) => {
        if (document.getElementById(buttonId) && setupButton(buttonId, outputSelector)) {
          foundCount++;
        }
      });
      
      if (foundCount === Object.keys(clearButtonsConfig).length) {
        observer.disconnect();
        console.log("✅ Todos los botones de borrado configurados");
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // También intentar después de un delay por si los botones se cargan async
    setTimeout(() => {
      Object.entries(clearButtonsConfig).forEach(([buttonId, outputSelector]) => {
        if (!document.getElementById(buttonId)?.hasAttribute('data-listener-set')) {
          setupButton(buttonId, outputSelector);
        }
      });
    }, 1000);
  } else {
    console.log(`✅ ${buttonsConfigured} botones de borrado configurados`);
  }
}

// Vincula botones
function wireButtons(prompts) {
  const mapSeccion = {
    "btn-copies":      { key: "copies",      out: "#agente-output-copies" },
    "btn-insights":    { key: "insights",    out: "#agente-output-insights" },
    "btn-competencia": { key: "competencia", out: "#agente-output-competencia" },
    "btn-tendencias":  { key: "tendencias",  out: "#agente-output-tendencias" }
  };

  Object.entries(mapSeccion).forEach(([btnId, { key, out }]) => {
    const btn = document.getElementById(btnId);
    const outDiv = document.querySelector(out);
    if (!btn || !outDiv) return;

    btn.addEventListener("click", async () => {
      const pdef = prompts[key];
      if (!pdef || !pdef.template) {
        outDiv.textContent = "⚠️ No hay template para esta sección en prompts.json";
        return;
      }

      const ctx = await buildContext(); // Ahora es async
      const promptFinal = fillTemplate(pdef.template, { ...ctx.raw, ...ctx.norm });

      // ✅ Mostrar en consola el prompt inicial y el final
      console.log("=== PROMPT ANALYSIS ===");
      console.log(`🔍 Sección: ${key}`);
      console.log("📋 Prompt inicial (template):");
      console.log(pdef.template);
      console.log("🔄 Prompt final (con placeholders reemplazados):");
      console.log(promptFinal);
      console.log("📊 Contexto utilizado:");
      console.log(ctx.norm);
      console.log("=======================");

      outDiv.textContent = "⏳ Generando...";
      btn.disabled = true;
      try {
        const texto = await callGemini(promptFinal);
        outDiv.textContent = texto || "Sin respuesta";
      } catch (err) {
        console.error(err);
        outDiv.textContent = `❌ Error: ${err.message || err}`;
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const prompts = await loadPrompts();
    wireButtons(prompts);
    
    // Esperar un poco más para asegurar que los botones de borrado estén en el DOM
    setTimeout(() => {
      setupClearButtons();
    }, 300);
    
    console.log("✅ Agentes Gemini listos.");
  } catch (e) {
    console.error("❌ Error iniciando agentes:", e);
  }
});

