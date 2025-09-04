const API = "https://urvaseo-backend.onrender.com";

// Función para mostrar notificaciones personalizadas en lugar de alert()
function showNotification(message, isError = true) {
  const notification = document.createElement("div");
  notification.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-transform duration-300 ease-out transform translate-y-full ${isError ? 'bg-red-500' : 'bg-green-500'} z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animar la entrada
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
  }, 100);

  // Animar la salida y eliminar después de 3 segundos
  setTimeout(() => {
    notification.style.transform = 'translateY(100%)';
    notification.addEventListener('transitionend', () => notification.remove());
  }, 3000);
}

// Función para mostrar un modal de confirmación
function showConfirmationModal(message, onConfirm) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50";
  modal.innerHTML = `
    <div class="bg-white p-6 rounded-lg shadow-xl w-80 text-center">
      <p class="mb-4 text-lg font-semibold">${message}</p>
      <div class="flex justify-around">
        <button id="confirm-btn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Sí</button>
        <button id="cancel-btn" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const confirmBtn = document.getElementById("confirm-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  confirmBtn.addEventListener("click", () => {
    modal.remove();
    onConfirm(true);
  });

  cancelBtn.addEventListener("click", () => {
    modal.remove();
    onConfirm(false);
  });
}

// 🔹 Cargar y mostrar todas las placas
async function cargarPlacas() {
  const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
  tablaPlacasBody.innerHTML = `<tr><td colspan="4" class="text-center">Cargando...</td></tr>`;
  try {
    const res = await fetch(`${API}/placas`);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    const placas = await res.json();
    
    tablaPlacasBody.innerHTML = "";
    if (placas.length === 0) {
        tablaPlacasBody.innerHTML = `<tr><td colspan="4" class="text-center">No hay placas registradas.</td></tr>`;
        return;
    }

    placas.forEach((p, i) => {
      const tr = document.createElement("tr");
      const estadoTexto = p.estado === "activo" ? "Activo" : "Inactivo";
      const estadoClase = p.estado === "activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
      tr.innerHTML = `
        <td class="py-2 px-4 border-b border-gray-200">${i + 1}</td>
        <td class="py-2 px-4 border-b border-gray-200">${p.placa}</td>
        <td class="py-2 px-4 border-b border-gray-200"><span class="inline-block px-2 py-1 text-sm font-semibold rounded-full ${estadoClase}">${estadoTexto}</span></td>
        <td class="py-2 px-4 border-b border-gray-200">
          <button onclick="editarPlaca('${p._id}', '${p.estado}')" class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-600 transition duration-300">Cambiar Estado</button>
        </td>
      `;
      tablaPlacasBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error al cargar las placas:", error);
    tablaPlacasBody.innerHTML = `<tr><td colspan="4" class="text-center text-red-500">Error al cargar las placas.</td></tr>`;
    showNotification("Error de conexión. Intenta de nuevo más tarde.");
  }
}

// 🔹 Registrar nueva placa
async function registrarPlaca() {
  const placa = document.getElementById("nuevaPlaca").value.trim();
  const estado = document.getElementById("estadoPlaca").value;

  if (!placa) {
    showNotification("Debe ingresar una placa.");
    return;
  }

  try {
    const res = await fetch(`${API}/placas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa, estado })
    });

    const data = await res.json();

    if (res.ok) {
      showNotification("Placa registrada con éxito.", false);
      document.getElementById("nuevaPlaca").value = "";
      cargarPlacas();
    } else {
      showNotification(`Error: ${data.error || "No se pudo registrar la placa."}`);
    }
  } catch (err) {
    console.error("Error al registrar la placa:", err);
    showNotification("Error de conexión. Intenta de nuevo más tarde.");
  }
}

// 🔹 Editar estado de placa
async function editarPlaca(id, estadoActual) {
  const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";
  
  showConfirmationModal(`¿Estás seguro de que quieres cambiar el estado de la placa a '${nuevoEstado}'?`, async (confirmed) => {
    if (confirmed) {
      try {
        const res = await fetch(`${API}/placas/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (res.ok) {
          showNotification("Estado de la placa actualizado con éxito.", false);
          cargarPlacas();
        } else {
          const errorData = await res.json();
          showNotification(`Error: ${errorData.error || res.statusText}`);
        }
      } catch (err) {
        console.error("Error al actualizar la placa:", err);
        showNotification("Error de conexión. Intenta de nuevo más tarde.");
      }
    }
  });
}

// Inicialización de la página
document.addEventListener("DOMContentLoaded", cargarPlacas);

// Hago las funciones globales para que puedan ser llamadas desde el HTML
window.cargarPlacas = cargarPlacas;
window.registrarPlaca = registrarPlaca;
window.editarPlaca = editarPlaca;
window.showNotification = showNotification;
window.showConfirmationModal = showConfirmationModal;
