const API = "https://urvaseo-backend.onrender.com"; // URL de tu backend

// Tomamos placa y turno asignados al chofer
const placa = localStorage.getItem("placa");
const turno = localStorage.getItem("turno");

// Inicializar mapa
const map = L.map('map').setView([-2.2, -79.9], 13); // Coordenadas ejemplo
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let tareas = []; // Array global de tareas
let markers = []; // Array global de marcadores

// Cargar tareas del chofer
async function cargarTareas() {
  try {
    const res = await fetch(`${API}/tareas?placa=${placa}&turno=${turno}`);
    if (!res.ok) throw new Error("Error al obtener tareas del servidor");
    tareas = await res.json();

    const tbody = document.querySelector("#tablaTareas tbody");
    tbody.innerHTML = "";

    tareas.forEach((t, i) => {
      // Color inicial según estado
      const color = getColorEstado(t.estado);

      // Crear marcador y guardarlo en array
      const marker = L.circleMarker([t.ubicacion.lat, t.ubicacion.lng], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`<b>Punto ${i+1}</b><br>Sector: ${t.sector}<br>Estado: ${t.estado}<br>Observaciones: ${t.observaciones || "Sin novedad"}`);
      markers[i] = marker; // Guardamos referencia para actualizar color luego

      // Agregar a tabla
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${t.sector}</td>
        <td id="estado-${i}">${t.estado}</td>
        <td>${t.observaciones || "Sin novedad"}</td>
        <td>
          <button onclick="cambiarEstado(${i}, 'pendiente')">Pendiente</button>
          <button onclick="cambiarEstado(${i}, 'en proceso')">En Proceso</button>
          <button onclick="cambiarEstado(${i}, 'cumplida')">Cumplida</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al cargar tareas:", err);
    alert("No se pudieron cargar las tareas. Revisa la consola.");
  }
}

// Función para obtener color según estado
function getColorEstado(estado) {
  switch (estado.toLowerCase()) {
    case "pendiente": return "blue";
    case "en proceso": return "orange";
    case "cumplida": return "green";
    case "reportada": return "red";
    default: return "gray";
  }
}

// Cambiar estado de tarea y actualizar color en mapa y tabla
async function cambiarEstado(i, nuevoEstado) {
  tareas[i].estado = nuevoEstado;

  // Actualizar marcador
  const color = getColorEstado(nuevoEstado);
  markers[i].setStyle({ color: color, fillColor: color });

  // Actualizar tabla
  document.getElementById(`estado-${i}`).innerText = nuevoEstado;

  // Enviar actualización al backend
  try {
    const data = {
      choferId: localStorage.getItem("choferId") || "chofer_demo",
      placa,
      ubicacion: tareas[i].ubicacion,
      estado: nuevoEstado
    };
    await fetch(`${API}/reporte`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("Error al actualizar estado en backend:", err);
  }
}

// Inicializar
cargarTareas();
