const API = "https://urvaseo-backend.onrender.com";

const choferId = localStorage.getItem("choferId");
const placa = localStorage.getItem("placa");
const turno = localStorage.getItem("turno");

const map = L.map('map').setView([-2.2, -79.9], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
let polyline = null;
let rutaIdActual = null;

// --- Definición de Íconos SVG Personalizados ---
const getIcon = (color) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="color: ${color}; font-size: 24px; position: relative;"><i class="fas fa-map-marker-alt"></i></div>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
};

const pendienteIcon = getIcon('blue');
const enProcesoIcon = getIcon('orange');
const completadaIcon = getIcon('green');
const danadoIcon = getIcon('red');

// --- Lógica principal ---
document.addEventListener("DOMContentLoaded", () => {
  if (choferId && placa && turno) {
    cargarTareas();
  } else {
    alert("No se encontró información del chofer. Inicia sesión de nuevo.");
    window.location.href = "index.html";
  }
});

async function cargarTareas() {
  try {
    const res = await fetch(`${API}/tareas?placa=${placa}&turno=${turno}`);
    if (!res.ok) {
        throw new Error("Error al obtener tareas del servidor");
    }

    const tareasAsignadas = await res.json();
    if (tareasAsignadas.length === 0) {
      document.getElementById("message").innerText = "No tienes tareas asignadas para este turno.";
      return;
    }
    
    const tarea = tareasAsignadas[0];
    const puntosRuta = tarea.rutaId.puntos;
    rutaIdActual = tarea.rutaId._id;
    
    dibujarRecorrido(puntosRuta);
    dibujarPuntos(puntosRuta);
    dibujarTabla(puntosRuta);
    
  } catch (err) {
    console.error("Error al cargar tareas:", err);
    alert("No se pudieron cargar las tareas.");
  }
}

function dibujarRecorrido(puntos) {
  if (polyline) {
    map.removeLayer(polyline);
  }
  const latlngs = puntos.map(p => [p.lat, p.lng]);
  polyline = L.polyline(latlngs, { color: 'blue', weight: 5, opacity: 0.7 }).addTo(map);
  map.fitBounds(polyline.getBounds());
}

function dibujarPuntos(puntos) {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  
  puntos.forEach((p, i) => {
    let icon;
    const estadoMinusculas = p.estado.toLowerCase();
    
    switch (estadoMinusculas) {
      case "en proceso":
        icon = enProcesoIcon;
        break;
      case "ejecutada":
      case "terminada": // Aceptamos 'terminada' también
        icon = completadaIcon;
        break;
      case "dañado":
        icon = danadoIcon;
        break;
      default:
        icon = pendienteIcon;
    }
    
    const marker = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);

    // Manejar el evento de doble clic para reportar novedad
    marker.on('dblclick', (e) => {
      const estadoActual = p.estado.toLowerCase();
      if (estadoActual === 'ejecutada' || estadoActual === 'terminada') {
        alert("No se puede reportar una novedad en un punto ya terminado.");
      } else {
        reportarNovedad(p._id, p.lat, p.lng);
      }
    });

    // Manejar el evento de clic para cambiar estado y mostrar opciones
    marker.on('click', async (e) => {
      const estadoActual = p.estado.toLowerCase();

      if (estadoActual === 'pendiente') {
        // Primer clic: cambia el estado a 'en proceso'
        await marcarPunto(p._id, 'en proceso');
      } else if (estadoActual === 'en proceso') {
        // Segundo clic: muestra el popup para finalizar la tarea
        let popupContent = `
          <b>Punto ${i + 1}</b><br>
          Nombre: ${p.nombre}<br>
          Dirección: ${p.direccion}<br>
          Estado: ${p.estado}
          <hr>
          <button onclick="marcarPunto('${p._id}', 'ejecutada')" style="background-color: #28a745; color: white;">Marcar como terminada</button>
        `;
        marker.setPopupContent(popupContent).openPopup();
      } else if (estadoActual === 'ejecutada' || estadoActual === 'terminada') {
        // Si ya está terminada, muestra un mensaje de confirmación
        let popupContent = `<span>Este punto ya ha sido completado ✅</span>`;
        marker.setPopupContent(popupContent).openPopup();
      } else {
        // Para cualquier otro estado, muestra el popup sin botones de acción
        let popupContent = `
          <b>Punto ${i + 1}</b><br>
          Nombre: ${p.nombre}<br>
          Dirección: ${p.direccion}<br>
          Estado: ${p.estado}
        `;
        marker.setPopupContent(popupContent).openPopup();
      }
    });
    
    markers.push(marker);
  });
}

function dibujarTabla(puntos) {
  const tbody = document.querySelector("#tareas-tabla tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  puntos.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.nombre}</td>
      <td>${p.direccion}</td>
      <td>${p.estado}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function reportarNovedad(puntoId, lat, lng) {
  const novedad = prompt("¿Qué tipo de novedad desea reportar? (Ej: daño, robo, accidente)");
  if (!novedad) return;

  const descripcion = prompt("Describa el incidente (opcional):");

  const data = {
    choferId,
    placa,
    novedad,
    descripcion,
    ubicacion: { lat: parseFloat(lat), lng: parseFloat(lng) },
  };

  try {
    const res = await fetch(`${API}/reporte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.ok) {
      alert("Reporte enviado con éxito ✅");
      await marcarPunto(puntoId, 'dañado');
    } else {
      alert("Error al enviar el reporte.");
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión. Intenta de nuevo más tarde.");
  }
}

async function marcarPunto(puntoId, nuevoEstado) {
  if (!rutaIdActual) {
    return alert("Error: No se encontró el ID de la ruta.");
  }

  try {
    const res = await fetch(`${API}/rutas/${rutaIdActual}/puntos/${puntoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const result = await res.json();
    if (result.ok) {
      alert(`Punto marcado como: ${nuevoEstado}`);
      cargarTareas();
    } else {
      alert("Error al actualizar el estado del punto.");
    }
  } catch (err) {
    console.error(err);
    alert("Error de conexión. Intenta de nuevo más tarde.");
  }
}
