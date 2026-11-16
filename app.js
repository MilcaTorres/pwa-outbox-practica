const listaOutbox = document.getElementById("lista-outbox");
const badgeRed = document.getElementById("badge-red");

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

actualizarIndicadorRed();
renderizarColaOutbox();
