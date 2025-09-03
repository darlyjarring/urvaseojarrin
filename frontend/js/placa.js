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
        <button id="confirmBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Sí</button>
        <button id="cancelBtn" class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("confirmBtn").onclick = () => {
    onConfirm(true);
    modal.remove();
  };

  document.getElementById("cancelBtn").onclick = () => {
    onConfirm(false);
    modal.remove();
  };
}

// 🔹 Cargar y mostrar todas las placas
async function cargarPlacas() {
  const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
  tablaPlacasBody.innerHTML = "";
  try {
    const res = await fetch(`${API}/placas`);
    if (!res.ok) throw new Error("Error al cargar las placas");
    const placas = await res.json();

    placas.forEach((p, i) => {
      // Usamos p.estado en lugar de p.activo
      const estadoTexto = p.estado === "activo" ? "Activa" : "Inactiva";
      const estadoClase = p.estado === "activo" ? "status-active" : "status-inactive";
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${p.placa}</td>
        <td class="${estadoClase}">${estadoTexto}</td>
        <td>
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="editarPlaca('${p._id}', '${p.estado}')">
            Cambiar estado
          </button>
        </td>
      `;
      tablaPlacasBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error al cargar las placas:", error);
    showNotification("Error al cargar las placas. Revisa la consola.");
  }
}

// 🔹 Registrar nueva placa
async funa) {
    showNotification("Debe ingresar una placa.");
    return;
  }

  try {
    const res = await fetch(`${API}/placas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placa, estado })
    });

    if (res.ok) {
      showNotification("Placa registrada con éxito.", false);
      document.getElementById("nuevaPlaca").value = "";
      cargarPlacas();
    } else {
      const errorData = await res.json();
      showNotification(`Error: ${errorData.error || res.statusText}`);
    }
  } catch (err) {
    console.error("Error al registrar la placa:", err);
    showNoction registrarPlaca() {
  const placa = document.getElementById("nuevaPlaca").value.trim();
  const estado = document.getElementById("estadoPlaca").value; // Ahora el valor es un string

  if (!plactification("Error de conexión. Intenta de nuevo más tarde.");
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

