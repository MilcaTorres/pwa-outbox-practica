// Importar el mini-wrapper de IndexedDB en el contexto del Service Worker
importScripts("./db-helper.js");

const CACHE_STATIC_NAME = "static-outbox-v2";
const STATIC_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./db-helper.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

function notificarClientesActualizacion() {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientes) => {
      clientes.forEach((cliente) => {
        cliente.postMessage({
          tipo: "OUTBOX_SINCRONIZADO",
          timestamp: Date.now(),
        });
      });
    });
}

function sincronizarPendientesSW() {
  console.log("[SW-Sync] Ejecutando barrido de transacciones pendientes...");

  return obtenerTodosLosRegistros().then((registros) => {
    const pendientes = registros.filter((item) => item.estado === "pendiente");

    if (pendientes.length === 0) {
      console.log("[SW-Sync] Cola limpia. Nada por sincronizar.");
      return;
    }

    const promesasDeEnvio = pendientes.map((item) => {
      return fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.titulo,
          body: item.descripcion,
        }),
      }).then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(
            `Error HTTP ${respuesta.status} al sincronizar ID ${item.id}`,
          );
        }
        return actualizarEstadoRegistro(item.id, "sincronizado");
      });
    });

    return Promise.all(promesasDeEnvio).then(() =>
      notificarClientesActualizacion(),
    );
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cacheOpen) => {
      return cacheOpen.addAll(STATIC_FILES);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cachesNames) => {
      return Promise.all(
        cachesNames.map((nameCache) => {
          if (nameCache !== CACHE_STATIC_NAME) {
            return caches.delete(nameCache);
          }
        }),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((respCache) => {
      if (respCache) {
        return respCache;
      }
      return fetch(event.request);
    }),
  );
});

self.addEventListener("sync", (event) => {
  console.log("[SW-Sync] Evento sync disparado con etiqueta:", event.tag);

  if (event.tag === "sync-reportes") {
    event.waitUntil(
      sincronizarPendientesSW().catch((error) => {
        console.error(
          "[SW-Sync] Falla en sincronización; el navegador reintentará luego:",
          error,
        );
        // Relanzar el error indica al navegador que debe programar un reintento automático
        throw error;
      }),
    );
  }
});
