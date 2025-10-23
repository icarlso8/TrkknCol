// Anunciante/TQ/js/auth.js
// ⚠️ Recomendaciones:
// Importación como <script type="module">
// Importar dentro dentro y antes de cerrar </head> con <script type="module" src="./js/auth.js"></script>
// 📌 Es decir, se busca un archivo auth.js dentro de una carpeta js que está en el mismo nivel del .html
// Asegúrate de que en tu HTML el <body> esté inicialmente oculto inmediatamente después de </head>
// Así: <body style="display:none"> () (De esta forma el <body> no se muestra sin autenticación.
// Cualquier archivo JavaScript estático cargado desde GitHub Pages o cualquier servidor público es público
// o visible desde consola (DevTools / F12) >>> No hay riesgo de seguridad.
// El objeto firebaseConfig siempre es visible desde el cliente (está diseñado para ser público)
// porque el frontend necesita esos datos para conectarse con Firebase.
// La seguridad real depende de las reglas de seguridad de Firebase, no de ocultar el código en el frontend.
// No mostrar en el front credenciales sensibles, secretos, tokens privados, etc.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; //  Trae los módulos de Firebase desde el CDN oficial
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; //  Trae los módulos de Firebase desde el CDN oficial
import { firebaseConfig } from "../../../firebase-config.js"; //Ruta Relativa al firebase-config.js (Configuración)

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, user => {
  if (!user) {
    alert("🔒 Inicia sesión Trkkie!");
    window.location.href = "../../auth.html";
  } else {
    console.log("✅ Usuario autenticado:", user.email);
    document.body.style.display = "block";
  }
});

