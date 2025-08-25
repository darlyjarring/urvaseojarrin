const API = "https://urvaseo-backend.onrender.com";

// 🔹 Cargar y mostrar todas las placas
async function cargarPlacas() {
  const res = await fetch(`${API}/placas`);
  const placas = await res.json();
  const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
  tablaPlacasBody.innerHTML = "";
  const placaSelect = document.getElementById("placaSelect");
  placaSelect.innerHTML = "";

  placas.forEach((p, i) => {
    // Populate the table
    const tr = document.createElement("tr");
    const estadoTexto = p.activo ? "Activo" : "Inactivo";
    const estadoClase = p.activo ? "status-active" : "status-inactive";
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.placa}</td>
      <td class="status-cell ${estadoClase}">${estadoTexto}</td>
      <td>
        <button onclick="editarPlaca('${p._id}', ${p.activo})">Editar</button>
      </td>
    `;
    tablaPlacasBody.appendChild(tr);

    // Populate the dropdown menu
    const option = document.createElement("option");
    option.value = p.placa;
    option.text = p.placa;
    placaSelect.add(option);
  });
}

// 🔹 Registrar nueva placa
async function registrarPlaca() {
  const placa = document.getElementById("nuevaPlaca").value.trim();
  const activo = document.getElementById("estadoPlaca").value === "true";

  if (!placa) {
    alert("Debe ingresar una placa");
    return;
  }

  const res = await fetch(`${API}/placas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placa, activo })
  });

  if (res.ok) {
    document.getElementById("nuevaPlaca").value = "";
    cargarPlacas();
  } else {
    alert("Error al registrar la placa.");
  }
}

// 🔹 Editar estado de placa
async function editarPlaca(id, estadoActual) {
  const nuevoEstadoPrompt = prompt("Ingrese el nuevo estado (activo/inactivo):", estadoActual ? "activo" : "inactivo");
  
  if (!nuevoEstadoPrompt) {
    return; // User canceled the prompt
  }
  const nuevoEstadoLower = nuevoEstadoPrompt.toLowerCase();
  
  if (nuevoEstadoLower !== "activo" && nuevoEstadoLower !== "inactivo") {
    alert("Estado inválido. Por favor use 'activo' o 'inactivo'.");
    return;
  }

  const activo = nuevoEstadoLower === "activo";

  await fetch(`${API}/placas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activo })
  });

  cargarPlacas();
}

// 🔹 Asignar tarea
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

// 🔹 Cargar tareas asignadas
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
