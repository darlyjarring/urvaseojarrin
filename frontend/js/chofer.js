const API = "https://urvaseo-backend.onrender.com"; // URL de tu backend

// Tomamos placa y turno asignados al chofer
const placa = localStorage.getItem("placa");
const turno = localStorage.getItem("turno");

// Inicializar mapa
const map = L.map('map').setView([-2.2, -79.9], 13); // Coordenadas ejemplo
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Cargar tareas del chofer
async function cargarTareas() {
  try {
    const res = await fetch(`${API}/tareas?placa=${placa}&turno=${turno}`);
    if (!res.ok) throw new Error("Error al obtener tareas del servidor");
    const tareas = await res.json();

    const tbody = document.querySelector("#tablaTareas tbody");
    tbody.innerHTML = "";

    tareas.forEach((t, i) => {
      // Normalizar estados y colores
      let estadoTexto = t.estado.toLowerCase();
      let color;
      switch (estadoTexto) {
        case "pendiente": color = "blue"; break;
        case "en proceso":
        case "ejecutando": 
          color = "orange"; 
          estadoTexto = "en proceso"; 
          break;
        case "cumplida":
        case "ejecutada": 
          color = "green"; 
          estadoTexto = "cumplida"; 
          break;
        case "reportada": color = "red"; break;
        default: color = "gray";
      }

      // Marker en el mapa
      const marker = L.circleMarker([t.ubicacion.lat, t.ubicacion.lng], {
        radius: 8,
        color: color,
        fillColor: color,
        fillOpacity: 0.8
      }).addTo(map);

      marker.bindPopup(`
        <b>Punto ${i+1}</b><br>
        Sector: ${t.sector}<br>
        Estado: ${estadoTexto}<br>
        Observaciones: ${t.observaciones || "Sin novedad"}
      `);

      // Agregar a tabla
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${t.sector}</td>
        <td>${estadoTexto}</td>
        <td>${t.observaciones || "Sin novedad"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error al cargar tareas:", err);
    alert("No se pudieron cargar las tareas. Revisa la consola.");
  }
}

// Inicializar
cargarTareas();
