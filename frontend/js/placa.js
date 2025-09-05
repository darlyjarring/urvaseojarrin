doconst API = "https://urvaseo-backend.onrender.com";

// 🔹 Cargar y mostrar todas las placas
async function cargarPlacas() {
  const res = await fetch(`${API}/placas`);
  const placas = await res.json();
  const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
  tablaPlacasBody.innerHTML = "";

  placas.forEach((p, i) => {
    // Poblar la tabla de placas
    const tr = document.createElement("tr");
    const estadoTexto = p.estado ? "Activa" : "Inactiva";
    const estadoClase = p.estado ? "status-active" : "status-inactive";
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.placa}</td>
      <td class="${estadoClase}">${estadoTexto}</td>
      <td>
        <button onclick="editarPlaca('${p._id}', ${p.estado})">Editar</button>
      </td>
    `;
    tablaPlacasBody.appendChild(tr);
  });
}

// 🔹 Registrar nueva placa
async function registrarPlaca() {
  const placa = document.getElementById("nuevaPlaca").value.trim();
  const estado = document.getElementById("estadoPlaca").value === "true";

  if (!placa) {
    alert("Debe ingresar una placa");
    return;
  }

  const res = await fetch(`${API}/placas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placa, estado: estado ? "activo" : "inactivo" })
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
    return;
  }
  const nuevoEstadoLower = nuevoEstadoPrompt.toLowerCase();
  
  if (nuevoEstadoLower !== "activo" && nuevoEstadoLower !== "inactivo") {
    alert("Estado inválido. Por favor use 'activo' o 'inactivo'.");
    return;
  }

  const estado = nuevoEstadoLower === "activo";

  await fetch(`${API}/placas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
     JSON.stringify({ estado: estado ? "activo" : "inactivo" })
  });

  cargarPlacas();
}

// Inicialización
cargarPlacas();
