// -------------------- VARIABLES GLOBALES --------------------
const API = "https://urvaseo-backend.onrender.com";

let map = null;
let puntos = [];
let markers = [];
let userId = localStorage.getItem('anonUserId') || crypto.randomUUID();
localStorage.setItem('anonUserId', userId);

// -------------------- FUNCIONES DE UTILIDAD --------------------

// Función para mostrar notificaciones personalizadas
function showNotification(message, isError = true) {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white transition-transform duration-300 ease-out transform translate-y-full ${isError ? 'bg-red-500' : 'bg-green-500'} z-50`;
    notification.textContent = message;
    document.getElementById('notification-container').appendChild(notification);

    // Animar entrada
    setTimeout(() => {
        notification.style.transform = 'translateY(0)';
    }, 100);

    // Animar salida y eliminar
    setTimeout(() => {
        notification.style.transform = 'translateY(100%)';
        notification.addEventListener('transitionend', () => notification.remove());
    }, 3000);
}

// Modal de confirmación
function showConfirmationModal(message, onConfirm) {
    const modalContainer = document.getElementById('modal-container');
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl w-80 text-center">
        <p class="mb-4 text-lg font-semibold">${message}</p>
        <div class="flex justify-around">
          <button id="confirm-yes" class="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition">Sí</button>
          <button id="confirm-no" class="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition">No</button>
        </div>
      </div>
    `;
    modalContainer.appendChild(modal);

    document.getElementById('confirm-yes').onclick = () => {
        onConfirm(true);
        modal.remove();
    };
    document.getElementById('confirm-no').onclick = () => {
        onConfirm(false);
        modal.remove();
    };
}

// -------------------- INICIALIZACIÓN --------------------
document.addEventListener("DOMContentLoaded", async () => {
    console.log("ID de usuario anónimo:", userId);

    const links = document.querySelectorAll(".header-links a");
    const sections = document.querySelectorAll(".section");

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute("href").substring(1);

            links.forEach(l => l.classList.remove("active"));
            e.target.classList.add("active");

            sections.forEach(s => s.classList.remove("active"));
            document.getElementById(targetId + "-section").classList.add("active");

            if (targetId === "placas") {
                cargarPlacas();
            } else if (targetId === "rutas") {
                inicializarMapa();
                cargarRutas();
            } else if (targetId === "tareas") {
                cargarPlacasParaSelect();
                cargarRutasParaDatalist();
                cargarTareas();
            }
        });
    });

    // Cargar sección inicial
    cargarPlacas();

    const filtroFechaInput = document.getElementById("filtroFecha");
    const filtroTurnoSelect = document.getElementById("filtroTurno");
    const botonReplicar = document.getElementById("btnReplicarTurno");

    if (filtroFechaInput && filtroTurnoSelect) {
        filtroFechaInput.addEventListener('change', cargarTareas);
        filtroTurnoSelect.addEventListener('change', cargarTareas);

        const hoy = new Date().toISOString().split('T')[0];
        filtroFechaInput.value = hoy;
    }

    if (botonReplicar) {
        botonReplicar.addEventListener('click', replicarTurno);
    }

    // Registrar evento para botón de registrar placa
    const btnRegistrar = document.getElementById('btnRegistrar');
    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', registrarPlaca);
    }
});

// -------------------- GESTIÓN DE PLACAS --------------------

// Cargar placas
async function cargarPlacas() {
    const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
    tablaPlacasBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">Cargando placas...</td></tr>`;
    try {
        const res = await fetch(`${API}/placas`);
        const placas = await res.json();

        if (!res.ok || !Array.isArray(placas)) {
            throw new Error(`Error del servidor: ${placas.error || res.statusText}`);
        }

        tablaPlacasBody.innerHTML = "";

        if (placas.length === 0) {
            tablaPlacasBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-gray-500">No hay placas registradas.</td></tr>`;
            return;
        }

        placas.forEach((p, i) => {
            const tr = document.createElement("tr");
            const estadoTexto = p.estado === "activo" ? "Activa" : "Inactiva";
            const estadoClase = p.estado === "activo" ? "text-green-600 font-bold" : "text-red-600 font-bold";
            tr.className = `border-b border-gray-200 hover:bg-gray-50`;
            tr.innerHTML = `
              <td class="py-3 px-6 text-left whitespace-nowrap">${i + 1}</td>
              <td class="py-3 px-6 text-left">${p.placa}</td>
              <td class="py-3 px-6 text-left ${estadoClase}">${estadoTexto}</td>
              <td class="py-3 px-6 text-left">
                <button onclick="editarPlaca('${p._id}', '${p.estado}')" class="bg-yellow-500 text-white py-1 px-3 rounded-lg hover:bg-yellow-600 transition duration-300 shadow-md">
                  ${p.estado === "activo" ? "Desactivar" : "Activar"}
                </button>
              </td>
            `;
            tablaPlacasBody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error al cargar las placas:", err);
        tablaPlacasBody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-red-500">Error al cargar placas. Intenta de nuevo.</td></tr>`;
        showNotification(`Error al cargar placas. ${err.message}`, true);
    }
}

// Registrar placa
async function registrarPlaca() {
    const placaInput = document.getElementById("nuevaPlaca");
    const estadoSelect = document.getElementById("estadoPlaca");
    const placa = placaInput.value.trim();
    const estado = estadoSelect.value;

    if (!placa) {
        showNotification("Debe ingresar una placa.");
        return;
    }

    // Validación formato: ABC-1234
    const regexPlaca = /^[A-Z]{3}-\d{4}$/;
    if (!regexPlaca.test(placa)) {
        showNotification("Formato de placa inválido. Ejemplo: ABC-1234");
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
            placaInput.value = "";
            showNotification("Placa registrada con éxito.", false);
            cargarPlacas();
        } else {
            showNotification(`Error: ${data.error || res.statusText}`);
        }
    } catch (err) {
        console.error("Error al registrar la placa:", err);
        showNotification("Error de conexión. Intenta de nuevo más tarde.");
    }
}

// Editar estado de placa
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

// -------------------- (AQUÍ SIGUEN IGUALES TODAS LAS FUNCIONES DE TAREAS Y RUTAS) --------------------


async function cargarPlacasParaSelect() {
    const res = await fetch(`${API}/placas`);
    const placas = await res.json();
    const placaSelect = document.getElementById("placaSelect");
    placaSelect.innerHTML = "";
    placas.forEach(p => {
        const option = document.createElement("option");
        option.value = p.placa;
        option.text = p.placa;
        placaSelect.add(option);
    });
}

async function cargarRutasParaDatalist() {
    const res = await fetch(`${API}/rutas`);
    const rutas = await res.json();
    const rutaList = document.getElementById("rutaList");
    rutaList.innerHTML = "";
    rutas.forEach(r => {
        const option = document.createElement("option");
        option.value = r.nombre;
        rutaList.appendChild(option);
    });
}

async function asignarTarea() {
    const placa = document.getElementById("placaSelect").value;
    const sector = document.getElementById("sectorInput").value;
    const turno = document.getElementById("turnoSelect").value;
    
    const fechaStr = document.getElementById("fechaInput").value;
    const [year, month, day] = fechaStr.split('-').map(Number);
    const fecha = new Date(Date.UTC(year, month - 1, day)).toISOString();

    if (!placa || !sector || !fecha) {
        alert("Placa, sector y fecha son campos obligatorios");
        return;
    }
    
    const res = await fetch(`${API}/tareas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, sector, turno, fecha, userId })
    });

    const data = await res.json();
    if (data.ok) alert("Tarea asignada ✅");
    cargarTareas();
}

async function cargarTareas() {
    const tbody = document.querySelector("#tablaTareas tbody");
    const thead = document.querySelector("#tablaTareas thead");
    try {
        const filtroFechaStr = document.getElementById("filtroFecha").value;
        const filtroTurno = document.getElementById("filtroTurno").value;

        const res = await fetch(`${API}/tareas`);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        let tareas = await res.json();
        
        if (filtroFechaStr) {
            const [year, month, day] = filtroFechaStr.split('-').map(Number);
            const dateToFilter = new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
            
            tareas = tareas.filter(t => {
                const taskDate = new Date(t.fecha).toISOString().split('T')[0];
                return taskDate === dateToFilter;
            });
        }

        if (filtroTurno) {
            tareas = tareas.filter(t => t.turno === filtroTurno);
        }
        
        thead.innerHTML = `
            <tr>
                <th>Placa</th>
                <th>Sector</th>
                <th>Turno</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Usuario</th>
            </tr>
        `;
        tbody.innerHTML = "";

        tareas.forEach(t => {
            const tr = document.createElement("tr");
            
            const fechaObj = new Date(t.fecha);
            const year = fechaObj.getUTCFullYear();
            const month = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getUTCDate()).padStart(2, '0');
            const fecha = `${day}/${month}/${year}`;
            
            tr.innerHTML = `
                <td>${t.placa}</td>
                <td>${t.sector}</td>
                <td>${t.turno}</td>
                <td>${fecha}</td>
                <td>${t.estado}</td>
                <td>${t.userId || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las tareas:", error);
        tbody.innerHTML = "<tr><td colspan='6'>Error al cargar las tareas. Revisa la consola para más detalles.</td></tr>";
    }
}

async function replicarTurno() {
    const filtroFechaStr = document.getElementById("filtroFecha").value;
    const filtroTurno = document.getElementById("filtroTurno").value;
    
    if (!filtroFechaStr || !filtroTurno) {
        return alert("Por favor, selecciona la fecha y turno de origen para replicar.");
    }
    
    let fechaOrigen, turnoOrigen;
    let fechaDestino, turnoDestino;
    const fechaFiltro = new Date(`${filtroFechaStr}T00:00:00Z`);

    // Determinar fecha y turno de origen y destino
    if (filtroTurno === "Mañana") {
        fechaOrigen = new Date(fechaFiltro);
        fechaOrigen.setUTCDate(fechaOrigen.getUTCDate() - 1); 
        turnoOrigen = "Noche";
        fechaDestino = fechaFiltro;
        turnoDestino = "Mañana";
    } else if (filtroTurno === "Tarde") {
        fechaOrigen = fechaFiltro;
        turnoOrigen = "Mañana";
        fechaDestino = fechaFiltro;
        turnoDestino = "Tarde";
    } else if (filtroTurno === "Noche") {
        fechaOrigen = fechaFiltro;
        turnoOrigen = "Tarde";
        fechaDestino = fechaFiltro;
        turnoDestino = "Noche";
    } else {
        return alert("Selecciona un turno específico para replicar.");
    }
    
    const fechaOrigenStr = fechaOrigen.toISOString().split('T')[0];
    const fechaDestinoStr = fechaDestino.toISOString().split('T')[0];

    // Paso 1: Verificar si el turno de destino ya tiene tareas
    try {
        const urlDestino = `${API}/tareas`;
        const resDestino = await fetch(urlDestino);
        const allTareas = await resDestino.json();
        const tareasDestino = allTareas.filter(t => {
            const taskDate = new Date(t.fecha).toISOString().split('T')[0];
            return taskDate === fechaDestinoStr && t.turno === turnoDestino;
        });

        if (tareasDestino.length > 0) {
            return alert("No se puede replicar. El turno de destino ya tiene tareas asignadas.");
        }

    } catch (error) {
        console.error("Error al verificar tareas en el destino:", error);
        return alert("Ocurrió un error al verificar el turno de destino. Por favor, intenta de nuevo.");
    }
    
    // Paso 2: Obtener las tareas del turno de origen
    try {
        const urlOrigen = `${API}/tareas`;
        const resOrigen = await fetch(urlOrigen);
        const allTareas = await resOrigen.json();
        const tareasOrigen = allTareas.filter(t => {
            const taskDate = new Date(t.fecha).toISOString().split('T')[0];
            return taskDate === fechaOrigenStr && t.turno === turnoOrigen;
        });

        if (tareasOrigen.length === 0) {
            return alert("No se encontraron tareas en el turno de origen para replicar.");
        }

        // Paso 3: Replicar las tareas
        const replicadas = [];
        for (const tarea of tareasOrigen) {
            const nuevaTarea = {
                placa: tarea.placa,
                sector: tarea.sector,
                turno: turnoDestino,
                fecha: fechaDestinoStr,
                userId: userId 
            };
            
            const resReplica = await fetch(`${API}/tareas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nuevaTarea)
            });
            const data = await resReplica.json();
            if (data.ok) {
                replicadas.push(nuevaTarea);
            } else {
                console.error("Error al replicar la tarea:", nuevaTarea, data.error);
            }
        }
        
        alert(`Se han replicado ${replicadas.length} tareas del turno ${turnoOrigen} (${fechaOrigenStr}) al turno ${turnoDestino} (${fechaDestinoStr}).`);
        cargarTareas();
    } catch (error) {
        console.error("Error al replicar el turno:", error);
        alert("Ocurrió un error al replicar las tareas. Por favor, intenta de nuevo.");
    }
}

function inicializarMapa() {
    if (map) {
        map.remove();
    }
    map = L.map('map').setView([-2.2, -79.9], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    puntos = [];
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    actualizarListaPuntos();

    map.on('click', function(e) {
        const nombre = prompt("Nombre del punto (Ej: Recolector 1)");
        if (!nombre) return;

        const direccion = prompt("Dirección del punto:");
        if (!direccion) return;

        const nuevoPunto = {
            nombre: nombre,
            direccion: direccion,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
        };
        puntos.push(nuevoPunto);

        const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
        marker.bindPopup(`<b>${nombre}</b><br>${direccion}`).openPopup();
        markers.push(marker);
        
        marker.on('dragend', function(event) {
            const latlng = event.target.getLatLng();
            const index = markers.indexOf(marker);
            if (index !== -1) {
                puntos[index].lat = latlng.lat;
                puntos[index].lng = latlng.lng;
            }
        });
        actualizarListaPuntos();
    });
}

function actualizarListaPuntos() {
    const container = document.getElementById("puntosContainer");
    container.innerHTML = "";
    puntos.forEach((p, i) => {
        const div = document.createElement("div");
        div.classList.add("punto-item");
        div.innerHTML = `
            <span>${p.nombre} - ${p.direccion}</span>
        `;
        container.appendChild(div);
    });
}

async function guardarRuta() {
    const nombreRuta = document.getElementById("nombreRuta").value.trim();
    if (!nombreRuta) {
        return alert("Debe ingresar un nombre para la ruta.");
    }

    if (puntos.length === 0) {
        return alert("Debe agregar al menos un punto a la ruta.");
    }

    try {
        const res = await fetch(`${API}/rutas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nombre: nombreRuta,
                puntos: puntos,
            }),
        });
        const data = await res.json();
        if (data.ok) {
            alert("Ruta guardada con éxito ✅");
            puntos = [];
            markers.forEach(m => map.removeLayer(m));
            markers = [];
            actualizarListaPuntos();
            document.getElementById("nombreRuta").value = "";
            cargarRutas();
        } else {
            alert("Error al guardar la ruta: " + data.error);
        }
    } catch (err) {
        console.error("Error al guardar la ruta:", err);
        alert("Error de conexión. Intenta de nuevo más tarde.");
    }
}

async function cargarRutas() {
    const tbody = document.querySelector("#tablaRutas tbody");
    try {
        const res = await fetch(`${API}/rutas`);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const rutas = await res.json();

        tbody.innerHTML = "";

        rutas.forEach(r => {
            const tr = document.createElement("tr");
            
            tr.innerHTML = `
                <td>${r.nombre}</td>
                <td>
                    <ul class="list-unstyled">
                        ${r.puntos.map(p => `
                            <li>
                                <strong>${p.nombre}</strong><br>
                                Lat: ${p.lat.toFixed(4)}, Lng: ${p.lng.toFixed(4)}
                            </li>
                        `).join('')}
                    </ul>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las rutas:", error);
        tbody.innerHTML = "<tr><td colspan='2'>Error al cargar las rutas. Revisa la consola para más detalles.</td></tr>";
    }
}
