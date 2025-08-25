const API = "https://urvaseo-backend.onrender.com";

async function cargarChoferes() {
  const res = await fetch(`${API}/supervisor/choferes-activos`);
  const choferes = await res.json();

  const div = document.getElementById("choferes");
  div.innerHTML = "";

  choferes.forEach(c => {
    const item = document.createElement("div");
    item.classList.add("chofer");
    item.innerText = `${c.nombre} - Placa: ${c.placa}`;
    item.onclick = () => verTareas(c._id);
    div.appendChild(item);
  });
}

let map = L.map("map").setView([-3.26, -79.95], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

async function verTareas(choferId) {
  const res = await fetch(`${API}/supervisor/tareas/${choferId}`);
  const tareas = await res.json();

  const div = document.getElementById("tareas");
  div.innerHTML = "";

  map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });

  tareas.forEach(t => {
    const p = document.createElement("p");
    p.innerText = `Sector: ${t.sector} - Estado: ${t.estado}`;
    p.classList.add(t.estado);
    div.appendChild(p);

    // Marcador en el mapa
    L.marker([t.ubicacion.lat, t.ubicacion.lng])
      .addTo(map)
      .bindPopup(`${t.sector} - ${t.estado}`);
  });

  // Generar gráfico
  generarGrafico(tareas);
}

function generarGrafico(tareas) {
  const ejecutadas = tareas.filter(t => t.estado === "ejecutada").length;
  const ejecutando = tareas.filter(t => t.estado === "ejecutando").length;
  const pendientes = tareas.filter(t => t.estado === "pendiente").length;

  const ctx = document.getElementById("grafico").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Ejecutadas", "En proceso", "Pendientes"],
      datasets: [{
        data: [ejecutadas, ejecutando, pendientes],
        backgroundColor: ["green", "orange", "red"]
      }]
    }
  });
}

cargarChoferes();
