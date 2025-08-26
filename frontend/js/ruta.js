const API = "https://urvaseo-backend.onrender.com";

const map = L.map('map').setView([-2.2, -79.9], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let puntos = [];
let markers = [];

map.on('click', function(e) {
  const nombre = prompt("Nombre del punto (Ej: Recolector 1)");
  if (!nombre) return;

  const direccion = prompt("Dirección del punto:");
  if (!direccion) return;

  const nuevoPunto = {
    nombre: nombre,
    direccion: direccion,
    estado: "Pendiente",
    lat: e.latlng.lat,
    lng: e.latlng.lng,
  };
  puntos.push(nuevoPunto);

  const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
  marker.bindPopup(`<b>${nombre}</b><br>${direccion}`).openPopup();
  markers.push(marker);
  
  marker.on('dragend', function(event) {
    const latlng = event.target.getLatLng();
    const index = markers.indexOf(marker);
    if (index !== -1) {
      puntos[index].lat = latlng.lat;
      puntos[index].lng = latlng.lng;
    }
  });

  actualizarListaPuntos();
});

function actualizarListaPuntos() {
  const container = document.getElementById("puntosContainer");
  container.innerHTML = "";
  puntos.forEach((p, i) => {
    const div = document.createElement("div");
    div.classList.add("punto-item");
    div.innerHTML = `
      <span>${p.nombre} - ${p.direccion}</span>
      <select onchange="cambiarEstadoPunto(${i}, this.value)">
        <option value="Pendiente" ${p.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>        
        <option value="dañado" ${p.estado === 'dañado' ? 'selected' : ''}>Bloqueado obras</option>
      </select>
    `;
    container.appendChild(div);
  });
}

function cambiarEstadoPunto(index, nuevoEstado) {
  puntos[index].estado = nuevoEstado;
}

async function guardarRuta() {
  const nombreRuta = document.getElementById("nombreRuta").value.trim();
  if (!nombreRuta) {
    return alert("Debe ingresar un nombre para la ruta.");
  }

  if (puntos.length === 0) {
    return alert("Debe agregar al menos un punto a la ruta.");
  }

  try {
    const res = await fetch(`${API}/rutas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombreRuta,
        puntos: puntos,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      alert("Ruta guardada con éxito ✅");
      puntos = [];
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      actualizarListaPuntos();
      document.getElementById("nombreRuta").value = "";
    } else {
      alert("Error al guardar la ruta: " + data.error);
    }
  } catch (err) {
    console.error("Error al guardar la ruta:", err);
    alert("Error de conexión. Intenta de nuevo más tarde.");
  }
}
