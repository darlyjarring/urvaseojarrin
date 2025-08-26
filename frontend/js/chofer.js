const API = "https://urvaseo-backend.onrender.com";

const choferId = localStorage.getItem("choferId");
const placa = localStorage.getItem("placa");
const turno = localStorage.getItem("turno");

const map = L.map('map').setView([-2.2, -79.9], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
let polyline = null;
let rutaIdActual = null;

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
    
    // 💡 Paso crucial: Accedemos a los puntos a través de la rutaId
    const tarea = tareasAsignadas[0];
    const puntosRuta = tarea.rutaId.puntos;
    rutaIdActual = tarea.rutaId._id;
    
    // Dibujar en el mapa y en la tabla
    dibujarRecorrido(puntosRuta);
    dibujarPuntos(puntosRuta);
    dibujarTabla(puntosRuta); // 💡 Nueva llamada para llenar la tabla

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
    const color = getColorEstado(p.estado);
    const marker = L.circleMarker([p.lat, p.lng], {
      radius: 8,
      color: color,
      fillColor: color,
      fillOpacity: 0.8
    }).addTo(map);

    let popupContent = `
      <b>Punto ${i + 1}</b><br>
      Nombre: ${p.nombre}<br>
      Dirección: ${p.direccion}<br>
      Estado: ${p.estado}
      <hr>
    `;

    if (p.estado === 'operativo' || p.estado === 'dañado') {
      popupContent += `
        <button onclick="marcarPunto('${p._id}', 'ejecutada')" style="background-color: #28a745; color: white;">Marcar como ejecutada</button>
        <button onclick="reportarNovedad('${p._id}', '${p.lat}', '${p.lng}')" style="background-color: #dc3545; color: white;">Reportar Incidente</button>
      `;
    } else {
      popupContent += `<span>Este punto ya ha sido procesado ✅</span>`;
    }
    
    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

function dibujarTabla(puntos) {
  const tbody = document.querySelector("#tareas-tabla tbody");
  tbody.innerHTML = ""; // Limpiar tabla

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

function getColorEstado(estado) {
  switch (estado.toLowerCase()) {
    case "operativo": return "green";
    case "dañado": return "red";
    case "ejecutada": return "blue";
    default: return "gray";
  }
}

async function reportarNovedad(puntoId, lat, lng) {
  const novedad = prompt("¿Qué tipo de novedad desea reportar? (Ej: daño, robo, secuestro, atentado, muerte, accidente)");
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
