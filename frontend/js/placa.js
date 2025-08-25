const API = "https://urvaseo-backend.onrender.com"; // tu backend con MongoDB

// 🔹 Cargar todas las placas
async function cargarPlacas() {
  const res = await fetch(`${API}/placas`);
  const placas = await res.json();

  const tbody = document.querySelector("#tablaPlacas tbody");
  tbody.innerHTML = "";

  placas.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.placa}</td>
      <td class="${p.estado}">${p.estado}</td>
      <td>
        <button onclick="editarPlaca('${p._id}', '${p.estado}')">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 🔹 Registrar nueva placa
async function registrarPlaca() {
  const placa = document.getElementById("nuevaPlaca").value.trim();
  const estado = document.getElementById("estadoPlaca").value;

  if (!placa) {
    alert("Debe ingresar una placa");
    return;
  }

  await fetch(`${API}/placas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ placa, estado })
  });

  document.getElementById("nuevaPlaca").value = "";
  cargarPlacas();
}

// 🔹 Editar estado de placa
async function editarPlaca(id, estadoActual) {
  const nuevoEstado = prompt("Ingrese nuevo estado (activo/inactivo):", estadoActual);
  if (!nuevoEstado || (nuevoEstado !== "activo" && nuevoEstado !== "inactivo")) {
    alert("Estado inválido. Use 'activo' o 'inactivo'");
    return;
  }

  await fetch(`${API}/placas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ estado: nuevoEstado })
  });

  cargarPlacas();
}

// Inicializar tabla al cargar página
cargarPlacas();
