document.addEventListener("DOMContentLoaded", function () {
  if (typeof L === "undefined" || typeof map === "undefined") {
    console.error("Leaflet o el mapa no están definidos.");
    return;
  }

  // 👉 Insertar estilos para zoom en imagen desde JS
  const estiloZoom = document.createElement("style");
  estiloZoom.textContent = `
    #contenidoModalPantalla img {
      transition: transform 0.3s ease;
      cursor: zoom-in;
    }
    .zoom-activo {
      transform: scale(2.2);
      cursor: zoom-out;
    }
  `;
  document.head.appendChild(estiloZoom);

  // 👉 Función para mostrar el modal pantalla completa
  function mostrarModalPantalla(html) {
    const modal = document.getElementById("modalPantalla");
    const contenido = document.getElementById("contenidoModalPantalla");
    contenido.innerHTML = html;
    modal.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 👉 Función para cerrar el modal
  document.getElementById("cerrarModalPantalla").addEventListener("click", () => {
    document.getElementById("modalPantalla").style.display = "none";
    document.getElementById("contenidoModalPantalla").innerHTML = "";
  });

  // 👉 Zoom en imagen del modal con clic
  document.addEventListener("click", function (e) {
    if (
      e.target.tagName === "IMG" &&
      e.target.parentElement &&
      e.target.parentElement.id === "contenidoModalPantalla"
    ) {
      e.target.classList.toggle("zoom-activo");
    }
  });

  // 👉 Crear pane personalizado
  if (!map.getPane("capasPuntosPane")) {
    map.createPane("capasPuntosPane");
    map.getPane("capasPuntosPane").style.zIndex = 650;
  }

  const capasPuntos = {};
  const controlCapasContainer = document.getElementById("controlCapasContainer");
  if (!controlCapasContainer) {
    console.error("No se encontró el contenedor #controlCapasContainer.");
    return;
  }

  // 👉 Ocultar visualmente sin eliminar funcionalidad
  controlCapasContainer.style.display = "none";

  const listaCapas = document.createElement("ul");
  listaCapas.className = "lista-capas";
  controlCapasContainer.appendChild(listaCapas);

  // 👉 Cargar GeoJSON
  fetch("archivos/vectores/Verano_MD.geojson")
    .then(response => response.json())
    .then(data => {
      const iconoPersonalizado = L.icon({
        iconUrl: "img/icono/modulo_verde.png",
        iconSize: [45, 45],
        iconAnchor: [35, 15],
        popupAnchor: [10, -32]
      });

      const capaGeojson = L.geoJSON(data, {
        pane: "capasPuntosPane",
        onEachFeature: function (feature, layer) {
          const nombre = feature.properties.Name || "Sin nombre";
          const enlace = feature.properties.link || "#";

          const htmlModal = `
            <h2 style="margin-bottom:20px;font-size:32px;">${nombre}</h2>
            <p><a href="${enlace}" target="_blank" style="color:#00e0ff;text-decoration:underline;font-size:18px;">Ver en Google Maps</a></p>
            <img 
              src="img/actividades/${nombre}.png" 
              alt="${nombre}" 
              style="max-width:90%;max-height:80vh;border-radius:10px;margin-top:30px;" 
              onerror="this.onerror=null;this.src='img/actividades/no_disponible.png';"
            />
          `;

          layer.on("click", function () {
            map.setView(layer.getLatLng(), map.getZoom(), { animate: true });
            mostrarModalPantalla(htmlModal);
          });
        },
        pointToLayer: function (feature, latlng) {
          return L.marker(latlng, {
            icon: iconoPersonalizado,
            pane: "capasPuntosPane"
          });
        }
      }).addTo(map);

      capasPuntos["Centros_Deportivos"] = capaGeojson;

      const item = document.createElement("li");
      item.textContent = "Centros Deportivos";
      item.className = "item-capa";
      item.onclick = () => {
        if (map.hasLayer(capaGeojson)) {
          map.removeLayer(capaGeojson);
        } else {
          map.addLayer(capaGeojson);
        }
      };
      listaCapas.appendChild(item);
    })
    .catch(error => console.error("Error al cargar el GeoJSON:", error));
});