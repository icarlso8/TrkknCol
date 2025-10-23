import { cargarTamanosYCanvas } from "./canvasLoader.js";

export async function cargarAudienciaFactores(productoId) {
  const jsonPath = "../../Anunciante/Tigo/json/";
  const form = document.getElementById("formulario");

  let section = form.querySelector("fieldset#audienciaFactores");
  if (section) {
    section.innerHTML = "";
  } else {
    section = document.createElement("fieldset");
    section.id = "audienciaFactores";
    section.className = "form-group";
    form.appendChild(section);
  }

  section.innerHTML = `<legend>🌐 Audiencias (Factores Contextuales)</legend>`;

  if (!productoId) {
    const msg = document.createElement("div");
    msg.textContent = "Selecciona el producto para validar audiencias y factores contextuales disponibles ✅";
    msg.style.fontSize = "14px";
    msg.style.fontStyle = "normal";
    section.appendChild(msg);
    return;
  }

  // Cargo audiencias, factores y tamaños desde JSON
  const todasAudiencias = await fetch(`${jsonPath}audiencias.json`).then(r => r.json());
  const factores = await fetch(`${jsonPath}factores.json`).then(r => r.json());
  const tamanosJson = await fetch(`${jsonPath}tamaños.json`).then(r => r.json());

  // Obtengo solo las audiencias para el productoId
  const audiencias = todasAudiencias[productoId] || [];

  // Rellenar audiencias con checkboxes
  const tituloAud = document.createElement("div");
  tituloAud.className = "form-section";
  tituloAud.innerHTML = `<strong>🎯 Audiencias:</strong>`;
  section.appendChild(tituloAud);

  const divAud = document.createElement("div");
  divAud.className = "form-section checkbox-opciones";

  // Función para actualizar factores basados en audiencias seleccionadas
  function actualizarFactores() {
    const factoresSection = section.querySelector("#factores-section");
    if (factoresSection) factoresSection.remove();
    
    const factoresContainer = document.createElement("div");
    factoresContainer.id = "factores-section";
    section.appendChild(factoresContainer);

    // Obtener audiencias seleccionadas
    const audienciasSeleccionadas = Array.from(section.querySelectorAll('input[name="audiencia"]:checked'))
      .map(cb => cb.value);

    // Si no hay audiencias seleccionadas, no mostrar factores
    if (audienciasSeleccionadas.length === 0) {
      return;
    }

    // Obtener todos los factores disponibles para las audiencias seleccionadas
    const factoresDisponiblesIds = new Set();
    audienciasSeleccionadas.forEach(audId => {
      const audiencia = audiencias.find(a => a.id === audId);
      if (audiencia && audiencia.factores_disponibles) {
        if (Array.isArray(audiencia.factores_disponibles)) {
          audiencia.factores_disponibles.forEach(factorId => factoresDisponiblesIds.add(factorId));
        } else if (audiencia.factores_disponibles === "ninguno") {
          factoresDisponiblesIds.add("ninguno");
        }
      }
    });

    // Mostrar solo los factores disponibles
    factores.forEach(factor => {
      if (factoresDisponiblesIds.has(factor.id)) {
        const tituloFactor = document.createElement("div");
        tituloFactor.className = "form-section";
        tituloFactor.innerHTML = `<strong>${factor.emoji} ${factor.nombre}:</strong>`;
        factoresContainer.appendChild(tituloFactor);

        const divOpciones = document.createElement("div");
        divOpciones.className = "form-section checkbox-opciones";

        if (factor.tipo === "checkbox") {
          factor.opciones.forEach(op => {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = factor.id;
            checkbox.value = op.id;

            const span = document.createElement("span");
            span.textContent = `${op.emoji || ""} ${op.nombre}`;

            const wrapper = document.createElement("label");
            wrapper.appendChild(checkbox);
            wrapper.appendChild(span);
            wrapper.style.marginRight = "16px";

            divOpciones.appendChild(wrapper);
          });
        }

        factoresContainer.appendChild(divOpciones);
      }
    });

    // Actualizar tamaños disponibles basados en los factores mostrados
    actualizarTamanos(factoresDisponiblesIds);
  }

  // Función para actualizar tamaños disponibles
  function actualizarTamanos(factoresDisponiblesIds) {
    const tamanosSection = section.querySelector("#tamanos-section");
    if (tamanosSection) tamanosSection.remove();
    
    const tamanosContainer = document.createElement("div");
    tamanosContainer.id = "tamanos-section";
    section.appendChild(tamanosContainer);

    // Crear set con tamaños disponibles desde los factores mostrados
    const tamañosSet = new Set();
    factores.forEach(factor => {
      if (factoresDisponiblesIds.has(factor.id) && factor.tamanos_disponibles && factor.tamanos_disponibles.length > 0) {
        factor.tamanos_disponibles.forEach(t => tamañosSet.add(t));
      }
    });

    // Filtrar y ordenar los tamaños que realmente están disponibles, usando 'id'
    const tamañosDisponiblesOrdenados = tamanosJson
      .filter(t => tamañosSet.has(t.id));

    const tituloTamanos = document.createElement("div");
    tituloTamanos.className = "form-section";
    tituloTamanos.innerHTML = `<strong>📐 Tamaños:</strong>`;
    tamanosContainer.appendChild(tituloTamanos);

    const divTamanos = document.createElement("div");
    divTamanos.className = "form-section checkbox-opciones";
    divTamanos.style.display = "flex";
    divTamanos.style.flexWrap = "wrap";
    divTamanos.style.gap = "16px";

    tamañosDisponiblesOrdenados.forEach(tamaño => {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "tamanos";
      checkbox.value = tamaño.id;
      checkbox.id = `tamaño_${tamaño.id}`;
      checkbox.checked = false;

      checkbox.addEventListener("change", () => {
        if (typeof cargarTamanosYCanvas === "function") {
          cargarTamanosYCanvas();
        }
      });

      const label = document.createElement("label");
      label.setAttribute("for", checkbox.id);
      label.textContent = ` ${tamaño.nombre}`;

      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);

      divTamanos.appendChild(wrapper);
    });

    tamanosContainer.appendChild(divTamanos);
  }

  // Crear checkboxes de audiencias con event listeners
  audiencias.forEach(aud => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "audiencia";
    checkbox.value = aud.id;
    checkbox.addEventListener("change", actualizarFactores);

    const span = document.createElement("span");
    span.textContent = ` ${aud.emoji || ""} ${aud.nombre}`;

    const wrapper = document.createElement("label");
    wrapper.appendChild(checkbox);
    wrapper.appendChild(span);
    wrapper.style.marginRight = "16px";
    divAud.appendChild(wrapper);
  });

  section.appendChild(divAud);
}
