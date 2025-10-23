// infoProduct.js (cargarJerarquia() + crearPlaceholder() (función utilitaria) )

export function crearPlaceholder(texto) {
  const opt = document.createElement("option");
  opt.value = "";
  opt.textContent = texto;
  opt.disabled = true;
  opt.selected = true;
  return opt;
}

export async function cargarJerarquia() {
  const jsonPath = "../../Anunciante/D1/json/";
  const form = document.getElementById("formulario");

  const section = document.createElement("fieldset");
  section.className = "form-group";
  section.innerHTML = `<legend>📋 Información del producto</legend>`;
  form.appendChild(section);

  const [segmentos, negocios, productos, campañas] = await Promise.all([
    fetch(`${jsonPath}segmentos.json`).then(r => r.json()),
    fetch(`${jsonPath}negocios.json`).then(r => r.json()),
    fetch(`${jsonPath}productos.json`).then(r => r.json()),
    fetch(`${jsonPath}campañas.json`).then(r => r.json())
  ]);

  const selects = {
    segmento: { label: "🏗️ Segmento", opciones: segmentos },
    negocio: { label: "📊 Línea de Negocio" },
    producto: { label: "🛒 Producto" },
    campana: { label: "📣 Campaña" }
  };

  const elements = {};

  for (const [id, data] of Object.entries(selects)) {
    const div = document.createElement("div");
    div.className = "form-section";
  
    const wrapper = document.createElement("div");
    wrapper.className = "label-wrapper";
  
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.innerHTML = `<strong>${data.label}:</strong>`;
  
    const select = document.createElement("select");
    select.id = id;
    elements[id] = select;
  
    wrapper.appendChild(label);
    wrapper.appendChild(select);
    div.appendChild(wrapper);
    section.appendChild(div);
  
    const placeholderText = `Selecciona ${data.label.split(' ')[1].toLowerCase()}`;
    select.appendChild(crearPlaceholder(placeholderText));
  
    if (data.opciones) {
      data.opciones.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.id;
        option.textContent = opt.nombre;
        select.appendChild(option);
      });
    }
  }

  // Campo de descripción
  const descripcionSection = document.createElement("div");
  descripcionSection.className = "form-section";

  const descripcionWrapper = document.createElement("div");
  descripcionWrapper.className = "label-wrapper";

  const label = document.createElement("label");
  label.setAttribute("for", "descripcion");
  label.innerHTML = `<strong>📝 Descripción:</strong>`;

  const textarea = document.createElement("textarea");
  textarea.classList.add("textarea-jerarquia"); // Clase específica del tetxarea de infoProduct
  textarea.id = "descripcion";
  textarea.name = "descripcion";
  textarea.rows = 3;
  textarea.placeholder = "Escribe detalles clave sobre el producto, campaña, temporada, tendencias, etc.";
  //textarea.style.width = "492px"; " está forzando que ese elemento sea casi tan ancho como el contenedor.
  textarea.style.resize = "vertical";

  descripcionWrapper.appendChild(label);
  descripcionWrapper.appendChild(textarea);
  descripcionSection.appendChild(descripcionWrapper);
  section.appendChild(descripcionSection);

  // Cascadas
  elements.segmento.addEventListener("change", () => {
    const segID = elements.segmento.value;
    elements.negocio.innerHTML = "";
    elements.producto.innerHTML = "";
    elements.campana.innerHTML = "";

    elements.negocio.appendChild(crearPlaceholder("Selecciona negocio/marca"));
    elements.producto.appendChild(crearPlaceholder("Selecciona producto"));
    elements.campana.appendChild(crearPlaceholder("Selecciona campaña"));

    if (negocios[segID]) {
      negocios[segID].forEach(n => {
        const opt = document.createElement("option");
        opt.value = n.id;
        opt.textContent = n.nombre;
        elements.negocio.appendChild(opt);
      });
    }
  });

  elements.negocio.addEventListener("change", () => {
    const segID = elements.segmento.value;
    const negID = elements.negocio.value;
    elements.producto.innerHTML = "";
    elements.campana.innerHTML = "";

    elements.producto.appendChild(crearPlaceholder("Selecciona producto"));
    elements.campana.appendChild(crearPlaceholder("Selecciona campaña"));

    if (productos[segID]?.[negID]) {
      productos[segID][negID].forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = p.nombre;
        elements.producto.appendChild(opt);
      });
    }
  });

  elements.producto.addEventListener("change", () => {
    const segID = elements.segmento.value;
    const negID = elements.negocio.value;
    const prodID = elements.producto.value;
    elements.campana.innerHTML = "";
    elements.campana.appendChild(crearPlaceholder("Selecciona un campaña"));

    if (campañas[segID]?.[negID]?.[prodID]) {
      campañas[segID][negID][prodID].forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nombre;
        elements.campana.appendChild(opt);
      });
    }
  });
}
