const API = "https://urvaseo-backend.onrender.com";

let map = null;
let puntos = [];
let markers = [];
let userId = localStorage.getItem('anonUserId') || crypto.randomUUID();
localStorage.setItem('anonUserId', userId);

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
                const fecha = document.getElementById("fechaInput").value;
                const turno = document.getElementById("turnoSelect").value;
                cargarPlacasParaSelect(fecha, turno);
                cargarRutasParaDatalist();
                cargarTareas();
            }
        });
    });

    // Cargar la sección inicial
    cargarPlacas();

    const filtroFechaInput = document.getElementById("filtroFecha");
    const filtroTurnoSelect = document.getElementById("filtroTurno");

    const fechaInput = document.getElementById("fechaInput");
    const turnoSelect = document.getElementById("turnoSelect");

    // Event Listeners para actualizar las placas disponibles
    fechaInput.addEventListener('change', () => {
        cargarPlacasParaSelect(fechaInput.value, turnoSelect.value);
    });
    turnoSelect.addEventListener('change', () => {
        cargarPlacasParaSelect(fechaInput.value, turnoSelect.value);
    });

    const botonReplica = document.getElementById("btnReplicarTurno");
    if (botonReplica) {
        botonReplica.addEventListener('click', replicarTurnoAnterior);
    }
});

// --------------------- FUNCIONES DE TAREAS ---------------------

async function cargarPlacasParaSelect(fecha, turno) {
    const select = document.getElementById("placaSelect");
    if (!select) return;
    select.innerHTML = "<option value=\"\">Cargando...</option>";

    try {
        const [resPlacas, resTareas] = await Promise.all([
            fetch(`${API}/placas`),
            fetch(`${API}/tareas`)
        ]);

        if (!resPlacas.ok || !resTareas.ok) {
            throw new Error("Error al obtener datos del servidor.");
        }

        const placas = await resPlacas.json();
        const tareas = await resTareas.json();

        const placasOcupadas = new Set();
        if (fecha && turno) {
            const fechaFormateada = new Date(fecha).toISOString().split('T')[0];
            tareas.forEach(tarea => {
                const tareaFechaFormateada = new Date(tarea.fecha).toISOString().split('T')[0];
                if (tareaFechaFormateada === fechaFormateada && tarea.turno === turno) {
                    placasOcupadas.add(tarea.placa);
                }
            });
        }
        
        const placasDisponibles = placas.filter(p => !placasOcupadas.has(p.placa) && p.estado === "activo");

        select.innerHTML = "<option value=\"\">-- Seleccione una placa --</option>";
        if (placasDisponibles.length > 0) {
            placasDisponibles.forEach(p => {
                const option = document.createElement("option");
                option.value = p.placa;
                option.textContent = p.placa;
                select.appendChild(option);
            });
        } else {
            select.innerHTML = "<option value=\"\">No hay placas disponibles para este turno y fecha</option>";
        }

    } catch (error) {
        console.error("Error al cargar placas:", error);
        select.innerHTML = "<option value=\"\">Error al cargar placas</option>";
    }
}

async function cargarRutasParaDatalist() {
    const datalist = document.getElementById("rutas");
    if (!datalist) return;
    try {
        const res = await fetch(`${API}/rutas`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const rutas = await res.json();
        datalist.innerHTML = "";
        rutas.forEach(ruta => {
            const option = document.createElement("option");
            option.value = ruta.nombre;
            option.dataset.id = ruta._id;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar las rutas:", error);
    }
}

async function asignarTarea() {
    const placaSelect = document.getElementById("placaSelect");
    const rutaDatalist = document.getElementById("rutaDatalist");
    const sectorInput = document.getElementById("sectorInput");
    const turnoSelect = document.getElementById("turnoSelect");
    const fechaInput = document.getElementById("fechaInput");

    const placa = placaSelect.value;
    const rutaNombre = rutaDatalist.value;
    const sector = sectorInput.value;
    const turno = turnoSelect.value;
    const fecha = fechaInput.value;

    const rutaOption = document.querySelector(`#rutas option[value="${rutaNombre}"]`);
    if (!rutaOption) {
        return alert("Por favor, seleccione una ruta de la lista.");
    }
    const rutaId = rutaOption.dataset.id;

    if (!placa || !rutaId || !sector || !turno || !fecha) {
        return alert("Por favor, complete todos los campos para asignar la tarea.");
    }

    const data = { placa, rutaId, sector, turno, fecha };

    try {
        const res = await fetch(`${API}/tareas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("Tarea asignada con éxito ✅");
            
            // Limpia los campos del formulario
            if (placaSelect) placaSelect.value = "";
            if (rutaDatalist) {
                rutaDatalist.value = "";
                delete rutaDatalist.dataset.rutaId;
            }
            if (sectorInput) sectorInput.value = "";
            if (turnoSelect) turnoSelect.value = "";
            if (fechaInput) fechaInput.value = "";
            
            // Vuelve a cargar la lista de placas para reflejar el cambio
            cargarPlacasParaSelect(fecha, turno);
            cargarTareas();
        } else {
            const error = await res.json();
            alert(`Error al asignar la tarea: ${error.error}`);
        }
    } catch (err) {
        console.error("Error al asignar la tarea:", err);
        alert("Error de conexión. Intenta de nuevo más tarde.");
    }
}

async function cargarTareas() {
    const tbody = document.querySelector("#tablaTareas tbody");
    const thead = document.querySelector("#tablaTareas thead");
    try {
        const filtroFechaStr = document.getElementById("filtroFecha").value;
        const filtroTurno = document.getElementById("filtroTurno").value;
        
        tbody.innerHTML = "<tr><td colspan='7'>Cargando tareas...</td></tr>";

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
                <th>Avance</th>
                <th>Usuario</th>
                <th>Acciones</th>
            </tr>
        `;
        tbody.innerHTML = "";

        if (tareas.length === 0) {
            tbody.innerHTML = "<tr><td colspan='8'>No hay tareas que coincidan con los filtros.</td></tr>";
            return;
        }

        tareas.forEach(tarea => {
            let estadoGeneral = "Pendiente";
            let porcentajeCompletado = 0;
            const totalPuntos = tarea.estados_detareaxelemntoderuta.length;
            
            if (totalPuntos > 0) {
                const puntosEjecutados = tarea.estados_detareaxelemntoderuta.filter(p => p.estado === 'ejecutada').length;
                porcentajeCompletado = (puntosEjecutados / totalPuntos) * 100;

                if (porcentajeCompletado === 100) {
                    estadoGeneral = "Terminada";
                } else if (porcentajeCompletado > 0) {
                    estadoGeneral = "En Proceso";
                } else {
                    estadoGeneral = "Pendiente";
                }
            }
            
            const tr = document.createElement("tr");
            const fechaObj = new Date(tarea.fecha);
            const year = fechaObj.getUTCFullYear();
            const month = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
            const day = String(fechaObj.getUTCDate()).padStart(2, '0');
            const fecha = `${day}/${month}/${year}`;

            tr.innerHTML = `
                <td>${tarea.placa}</td>
                <td>${tarea.sector}</td>
                <td>${tarea.turno}</td>
                <td>${fecha}</td>
                <td>${estadoGeneral}</td>
                <td>${porcentajeCompletado.toFixed(0)}%</td>
                <td>${tarea.userId || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="mostrarPuntos('${tarea._id}')">Ver Puntos</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las tareas:", error);
        tbody.innerHTML = "<tr><td colspan='8'>Error al cargar las tareas. Revisa la consola para más detalles.</td></tr>";
    }
}

// --------------------- FUNCIONES DE PLACAS ---------------------
async function cargarPlacas() {
    const res = await fetch(`${API}/placas`);
    const placas = await res.json();
    const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
    if (!tablaPlacasBody) return;
    tablaPlacasBody.innerHTML = "";
    placas.forEach((p, i) => {
        const tr = document.createElement("tr");
        const estadoTexto = p.estado === "activo" ? "Activa" : "Inactiva";
        const estadoClase = p.estado === "activo" ? "status-active" : "status-inactive";
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${p.placa}</td>
            <td class="${estadoClase}">${estadoTexto}</td>
            <td>
                <button onclick="editarPlaca('${p._id}', '${p.estado}')">Editar</button>
            </td>
        `;
        tablaPlacasBody.appendChild(tr);
    });
}

async function registrarPlaca() {
    const placa = document.getElementById("nuevaPlaca").value.trim();
    const estado = document.getElementById("estadoPlaca").value;

    if (!placa) {
        alert("Debe ingresar una placa");
        return;
    }

    const res = await fetch(`${API}/placas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placa, estado }),
    });

    if (res.ok) {
        document.getElementById("nuevaPlaca").value = "";
        cargarPlacas();
    } else {
        alert("Error al registrar la placa.");
    }
}

async function editarPlaca(id, estadoActual) {
    const nuevoEstadoPrompt = prompt(`Ingrese el nuevo estado para la placa ${id} (activo/inactivo):`, estadoActual);
    if (!nuevoEstadoPrompt) {
        return;
    }

    const nuevoEstadoLower = nuevoEstadoPrompt.toLowerCase();
    const estadoValido = ["activo", "inactivo"].includes(nuevoEstadoLower);

    if (!estadoValido) {
        alert("Estado inválido. Por favor use 'activo' o 'inactivo'.");
        return;
    }

    try {
        const res = await fetch(`${API}/placas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstadoLower }),
        });
        if (res.ok) {
            cargarPlacas();
            alert("Estado de la placa actualizado con éxito.");
        } else {
            alert("Error al actualizar el estado de la placa.");
        }
    } catch (err) {
        console.error("Error de conexión:", err);
        alert("Error de conexión. Intenta de nuevo más tarde.");
    }
}

// --------------------- FUNCIONES DE RUTAS ---------------------

function inicializarMapa() {
    if (map) {
        map.remove();
    }
    map = L.map('map').setView([-2.2, -79.9], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('click', async function(e) {
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
    if (!container) return;
    container.innerHTML = "";
    puntos.forEach(p => {
        const div = document.createElement("div");
        div.classList.add("punto-item");
        div.innerHTML = `<span>${p.nombre} - ${p.direccion}</span>`;
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
            body: JSON.stringify({ nombre: nombreRuta, puntos: puntos }),
        });
        const data = await res.json();
        if (res.ok) {
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
    if (!tbody) return;
    try {
        const res = await fetch(`${API}/rutas`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const rutas = await res.json();
        tbody.innerHTML = "";
        rutas.forEach(r => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${r.nombre}</td>
                <td>
                    <ul class="list-unstyled">
                        ${r.puntos.map(p => `<li><strong>${p.nombre}</strong><br>Lat: ${p.lat.toFixed(4)}, Lng: ${p.lng.toFixed(4)}</li>`).join('')}
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

async function replicarTurnoAnterior() {
    alert("Función de replicar turno anterior en desarrollo.");
}

async function mostrarPuntos(id) {
    alert("Función para mostrar puntos en desarrollo.");
}
