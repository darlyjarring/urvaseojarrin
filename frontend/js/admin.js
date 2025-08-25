


async function cargarPlacas() {
  const res = await fetch(`${API}/placas`);
  const placas = await res.json();
  const placaSelect = document.getElementById("placaSelect");

  placas.forEach(p => {
    const option = document.createElement("option");
    option.value = p.placa;
    option.text = p.placa;
    placaSelect.add(option);
  });
}

async function asignarTarea() {
  const placa = document.getElementById("placaSelect").value;
  const sector = document.getElementById("sectorInput").value;
  const turno = document.getElementById("turnoSelect").value;

  if (!placa || !sector) {
    alert("Todos los campos son obligatorios");
    return;
  }

  const res = await fetch(`${API}/tareas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placa, sector, turno })
  });

  const data = await res.json();
  if (data.ok) alert("Tarea asignada ✅");
  cargarTareas();
}

async function cargarTareas() {
  const res = await fetch(`${API}/tareas`);
  const tareas = await res.json();
  const tbody = document.querySelector("#tablaTareas tbody");
  tbody.innerHTML = "";

  tareas.forEach(t => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.placa}</td>
      <td>${t.sector}</td>
      <td>${t.turno}</td>
      <td>${t.estado}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Inicialización
cargarPlacas();
cargarTareas();
