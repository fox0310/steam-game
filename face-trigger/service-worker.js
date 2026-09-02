const CACHE_NAME = "face-trigger-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./trigger-state.js",
  "./manifest.webmanifest",
  "./assets/app-icon.svg",
  "./vendor/qrcode.min.js",
  "./vendor/face_mesh/face_mesh.binarypb",
  "./vendor/face_mesh/face_mesh.js",
  "./vendor/face_mesh/face_mesh_solution_packed_assets.data",
  "./vendor/face_mesh/face_mesh_solution_packed_assets_loader.js",
  "./vendor/face_mesh/face_mesh_solution_simd_wasm_bin.data",
  "./vendor/face_mesh/face_mesh_solution_simd_wasm_bin.js",
  "./vendor/face_mesh/face_mesh_solution_simd_wasm_bin.wasm",
  "./vendor/face_mesh/face_mesh_solution_wasm_bin.js",
  "./vendor/face_mesh/face_mesh_solution_wasm_bin.wasm",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => {
        if (event.request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      });
    }),
  );
});
