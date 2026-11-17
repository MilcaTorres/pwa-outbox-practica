const listaOutbox = document.getElementById("lista-outbox");
const badgeRed = document.getElementById("badge-red");
const formIncidencia = document.getElementById("form-incidencia");
const tituloInput = document.getElementById("titulo");
const descripcionInput = document.getElementById("descripcion");

function actualizarIndicadorRed() {
  if (navigator.onLine) {
    badgeRed.textContent = "En Línea";
    badgeRed.className = "badge online";
  } else {
    badgeRed.textContent = "Sin Conexión";
    badgeRed.className = "badge offline";
  }
}

function renderizarColaOutbox() {
  return obtenerTodosLosRegistros().then((registros) => {
    listaOutbox.innerHTML = "";
    registros.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.titulo} - ${item.estado} - ${new Date(item.fechaCreacion).toLocaleString("es-MX")}`;
      listaOutbox.appendChild(li);
    });
  });
}

function procesarEnvioReporte(datosFormulario) {
  const endpoint = "https://jsonplaceholder.typicode.com/posts";

  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datosFormulario),
  })
    .then((respuesta) => {
      if (!respuesta.ok) throw new Error("Error HTTP del servidor");
      return respuesta.json();
    })
    .then(() => {
      // Envío exitoso en vivo: registrar en bitácora local como sincronizado
      return guardarRegistro({
        ...datosFormulario,
        estado: "sincronizado",
        fechaCreacion: Date.now(),
      });
    })
    .catch(() => {
      console.warn(
        "[Outbox] Sin conexión. Encolando transacción localmente...",
      );
      // Falla de red: guardar en IndexedDB como pendiente para reenvío posterior
      return guardarRegistro({
        ...datosFormulario,
        estado: "pendiente",
        fechaCreacion: Date.now(),
      });
    })
    .then(() => {
      // Actualizar la lista visual en ambos escenarios
      return renderizarColaOutbox();
    });
}

formIncidencia.addEventListener("submit", (e) => {
  e.preventDefault();
  const datosFormulario = {
    titulo: tituloInput.value,
    descripcion: descripcionInput.value,
  };
  procesarEnvioReporte(datosFormulario).then(() => {
    formIncidencia.reset();
  });
});

actualizarIndicadorRed();
renderizarColaOutbox();
