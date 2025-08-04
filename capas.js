document.addEventListener("DOMContentLoaded", function () {
  if (typeof L === "undefined" || typeof map === "undefined") {
    console.error("Leaflet o el mapa no están definidos.");
    return;
  }

  // 👉 Estilos agregados desde JS (imagen con zoom + etiqueta compacta)
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
    .etiqueta-nombre-punto {
      background-color: rgba(0, 0, 0, 0.8);
      color: #fff;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
      pointer-events: none;
    }
  `;
  document.head.appendChild(estiloZoom);

  // 👉 Mostrar modal pantalla completa
  function mostrarModalPantalla(html) {
    const modal = document.getElementById("modalPantalla");
    const contenido = document.getElementById("contenidoModalPantalla");
    contenido.innerHTML = html;
    modal.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 👉 Cerrar modal
  document.getElementById("cerrarModalPantalla").addEventListener("click", () => {
    document.getElementById("modalPantalla").style.display = "none";
    document.getElementById("contenidoModalPantalla").innerHTML = "";
  });

  // 👉 Zoom en imagen del modal
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
          const nombre = feature.properties.Name || "Sin nombre";

          const marcador = L.marker(latlng, {
            icon: iconoPersonalizado,
            pane: "capasPuntosPane"
          });

          // 👉 Offset dinámico para reducir traslape
          const offsetY = Math.floor((latlng.lat * 1000) % 14) - 7;

          const tooltip = L.tooltip({
            permanent: true,
            direction: "down",
            offset: [0, -10],
            className: "etiqueta-nombre-punto"
          })
          .setContent(nombre)
          .setLatLng(latlng);

          marcador.bindTooltip(tooltip).openTooltip();

          return marcador;
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
