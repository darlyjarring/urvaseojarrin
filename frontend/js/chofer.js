const API = "https://urvaseo-backend.onrender.com";

const choferId = localStorage.getItem("choferId");
const placa = localStorage.getItem("placa");
const turno = localStorage.getItem("turno");

const map = L.map('map').setView([-2.2, -79.9], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
let polyline = null;
let rutaIdActual = null;

// --- Definición de Íconos de GPS Personalizados ---
const getIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const pendienteIcon = getIcon('blue');
const enProcesoIcon = getIcon('orange');
const completadaIcon = getIcon('red');
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
      case "completada":
        icon = completadaIcon;
        break;
      case "dañado":
        icon = danadoIcon;
        break;
      default: // 'pendiente' o cualquier otro
        icon = pendienteIcon;
    }
    
    const marker = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);

    // Manejar el evento de doble clic para reportar novedad
    marker.on('dblclick', (e) => {
      // Evita que la novedad se reporte en puntos completados
      if (p.estado.toLowerCase() === 'ejecutada' || p.estado.toLowerCase() === 'completada') {
        alert("No se puede reportar una novedad en un punto ya completado.");
      } else {
        reportarNovedad(p._id, p.lat, p.lng);
      }
    });

    // Manejar el evento de clic para cambiar estado
    marker.on('click', async (e) => {
      let popupContent = `
        <b>Punto ${i + 1}</b><br>
        Nombre: ${p.nombre}<br>
        Dirección: ${p.direccion}<br>
        Estado: ${p.estado}
        <hr>
      `;

      if (p.estado.toLowerCase() === 'pendiente') {
        // Si el estado es pendiente, cambiar a 'en proceso' con el primer clic
        await marcarPunto(p._id, 'en proceso');
      } else if (p.estado.toLowerCase() === 'en proceso') {
        // Si el estado es en proceso, mostrar los botones para completar la tarea
        popupContent += `
          <button onclick="marcarPunto('${p._id}', 'ejecutada')" style="background-color: #28a745; color: white;">Marcar como completada</button>
        `;
        marker.setPopupContent(popupContent).openPopup();
      } else if (p.estado.toLowerCase() === 'ejecutada') {
        // Si el estado es ejecutada, mostrar mensaje de finalización
        popupContent += `<span>Este punto ya ha sido completado ✅</span>`;
        marker.setPopupContent(popupContent).openPopup();
      } else if (p.estado.toLowerCase() === 'dañado') {
        // Si el estado es dañado, mostrar mensaje
        popupContent += `<span>Este punto tiene una novedad y no puede ser completado.</span>`;
        marker.setPopupContent(popupContent).openPopup();
      } else {
        // Para cualquier otro estado, mostrar el estado actual
        marker.setPopupContent(popupContent).openPopup();
      }
    });
    
    markers.push(marker);
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
      // Opcionalmente, puedes cambiar el estado del punto a 'dañado' después de reportar
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
