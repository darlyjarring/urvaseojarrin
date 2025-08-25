const API = "https://urvaseo-backend.onrender.com";

// 🔹 Cargar todas las placas
async function cargarPlacas() {
  const res = await fetch(`${API}/placas`);
  const placas = await res.json();

  const tbody = document.querySelector("#tablaPlacas tbody");
  tbody.innerHTML = "";

  placas.forEach((p, i) => {
    const tr = document.createElement("tr");
    // Corregimos: Usamos 'p.activo' en lugar de 'p.estado'
    const estadoTexto = p.activo ? "Activa" : "Inactiva";
    const estadoClase = p.activo ? "Activa" : "Inactiva";
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.placa}</td>
      <td class="${estadoClase}">${estadoTexto}</td>
      <td>
        <button onclick="editarPlaca('${p._id}', ${p.activo})">Editar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 🔹 Registrar nueva placa
async function registrarPlaca() {
  const placa = document.getElementById("nuevaPlaca").value.trim();
  // Corregimos: Obtenemos el valor del select y lo convertimos a booleano
  const activo = document.getElementById("estadoPlaca").value === "true";

  if (!placa) {
    alert("Debe ingresar una placa");
    return;
  }

  await fetch(`${API}/placas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // Corregimos: Enviamos 'activo' en lugar de 'estado'
    body: JSON.stringify({ placa, activo })
  });

  document.getElementById("nuevaPlaca").value = "";
  cargarPlacas();
}

// 🔹 Editar estado de placa
async function editarPlaca(id, estadoActual) {
  const nuevoEstadoPrompt = prompt("Ingrese nuevo estado (activo/inactivo):", estadoActual ? "activo" : "inactivo");
  if (!nuevoEstadoPrompt || (nuevoEstadoPrompt.toLowerCase() !== "activo" && nuevoEstadoPrompt.toLowerCase() !== "inactivo")) {
    alert("Estado inválido. Use 'activo' o 'inactivo'");
    return;
  }

  // Corregimos: Convertimos el texto del prompt a un valor booleano
  const activo = nuevoEstadoPrompt.toLowerCase() === "activo";

  await fetch(`${API}/placas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    // Corregimos: Enviamos 'activo' en lugar de 'estado'
    body: JSON.stringify({ activo: activo })
  });

  cargarPlacas();
}

// Inicializar tabla al cargar página
cargarPlacas();
