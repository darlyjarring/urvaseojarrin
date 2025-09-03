// -------------------- VARIABLES GLOBALES --------------------
const API = "https://urvaseo-backend.onrender.com";

let map = null;
let puntos = [];
let markers = [];
let userId = localStorage.getItem('anonUserId') || crypto.randomUUID();
localStorage.setItem('anonUserId', userId);

// -------------------- EVENTO DE CARGA DE PÁGINA --------------------
document.addEventListener("DOMContentLoaded", async () => {
    console.log("ID de usuario anónimo:", userId);

    const links = document.querySelectorAll(".header-links a");
    const sections = document.querySelectorAll(".section");

    // Lógica para cambiar de sección al hacer clic en los enlaces del menú
    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute("href").substring(1);

            links.forEach(l => l.classList.remove("active"));
            e.target.classList.add("active");

            sections.forEach(s => s.classList.remove("active"));
            document.getElementById(targetId + "-section").classList.add("active");

            // Cargar datos específicos para cada sección
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

    // Cargar la sección inicial por defecto
    cargarPlacas();

    const botonReplicarTareas = document.getElementById("botonReplicarTareas");
    if(botonReplicarTareas) {
        botonReplicarTareas.addEventListener("click", replicarTareas);
    }

    // Event listeners para los modales
    document.querySelector("#modal .close-button").addEventListener("click", cerrarModal);
    document.querySelector("#edit-placa-modal .close-button").addEventListener("click", cerrarModal);
});

// -------------------- Funciones de Modales --------------------

function mostrarModal(mensaje, titulo = "Mensaje") {
    document.getElementById("modal-title").textContent = titulo;
    document.getElementById("modal-message").textContent = mensaje;
    document.getElementById("modal").classList.remove("hidden");
}

function cerrarModal() {
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("edit-placa-modal").classList.add("hidden");
}

// -------------------- Funciones de Placas --------------------

async function cargarPlacas() {
    try {
        const res = await fetch(`${API}/placas`);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const placas = await res.json();
        const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
        tablaPlacasBody.innerHTML = "";

        placas.forEach((p, i) => {
            const tr = document.createElement("tr");
            const estadoTexto = p.estado === "activo" ? "Activa" : "Inactiva";
            const estadoClase = p.estado === "activo" ? "status-active" : "status-inactive";
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${p.placa}</td>
                <td class="${estadoClase}">${estadoTexto}</td>
                <td><button class="btn btn-sm btn-info" onclick="editarPlaca('${p._id}', '${p.estado}')">Editar</button></td>
            `;
            tablaPlacasBody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las placas:", error);
        mostrarModal("Error al cargar las placas. Revisa la consola para más detalles.", "Error");
    }
}

async function registrarPlaca() {
    const placa = document.getElementById("nuevaPlaca").value.trim();
    const estado = document.getElementById("estadoPlaca").value;

    if (!placa) {
        mostrarModal("Debe ingresar una placa.", "Error");
        return;
    }

    try {
        const res = await fetch(`${API}/placas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ placa, estado })
        });

        if (res.ok) {
            document.getElementById("nuevaPlaca").value = "";
            mostrarModal("Placa registrada con éxito.", "Éxito");
            cargarPlacas();
        } else {
            const errorData = await res.json();
            mostrarModal("Error al registrar la placa: " + errorData.error, "Error");
        }
    } catch (err) {
        console.error("Error al registrar la placa:", err);
        mostrarModal("Error de conexión. Intenta de nuevo más tarde.", "Error");
    }
}

async function editarPlaca(id, estadoActual) {
    const modal = document.getElementById("edit-placa-modal");
    const estadoSelect = document.getElementById("nuevoEstadoPlaca");
    
    // Configurar el valor inicial del select
    estadoSelect.value = estadoActual;
    
    // Asignar el evento al botón del modal
    document.getElementById("editar-placa-btn").onclick = async () => {
        const nuevoEstadoLower = estadoSelect.value;
        if (nuevoEstadoLower !== "activo" && nuevoEstadoLower !== "inactivo") {
            mostrarModal("Estado inválido. Por favor use 'activo' o 'inactivo'.", "Error");
            return;
        }

        try {
            const res = await fetch(`${API}/placas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ estado: nuevoEstadoLower })
            });

            if (res.ok) {
                cerrarModal();
                cargarPlacas();
            } else {
                const errorData = await res.json();
                mostrarModal("Error al actualizar la placa: " + errorData.error, "Error");
            }
        } catch (err) {
            console.error("Error al actualizar la placa:", err);
            mostrarModal("Error de conexión. Intenta de nuevo más tarde.", "Error");
        }
    };
    
    modal.classList.remove("hidden");
}

async function cargarPlacasParaSelect() {
    try {
        const res = await fetch(`${API}/placas`);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const placas = await res.json();
        const placaSelect = document.getElementById("placaSelect");
        placaSelect.innerHTML = "";
        placas.forEach(p => {
            const option = document.createElement("option");
            option.value = p.placa;
            option.text = p.placa;
            placaSelect.add(option);
        });
    } catch (error) {
        console.error("Error al cargar las placas para el select:", error);
    }
}

// -------------------- Funciones de Rutas --------------------

function inicializarMapa() {
    if (map === null) {
        map = L.map('map').setView([-2.14, -79.96], 13); // Guayaquil, Ecuador
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        map.on('click', function(e) {
            puntos.push({
                nombre: `Punto ${puntos.length + 1}`,
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                estado: "Pendiente"
            });
            const marker = L.marker(e.latlng).addTo(map);
            marker.bindPopup(`<b>Punto ${puntos.length}</b>`).openPopup();
            markers.push(marker);
            actualizarListaPuntos();
        });
    }
}

function actualizarListaPuntos() {
    const lista = document.getElementById("listaPuntos");
    lista.innerHTML = "";
    puntos.forEach((p, index) => {
        const li = document.createElement("li");
        li.innerText = `${index + 1}. Lat: ${p.lat.toFixed(4)}, Lng: ${p.lng.toFixed(4)}`;
        lista.appendChild(li);
    });
}

async function guardarRuta(e) {
    e.preventDefault();
    const nombreRuta = document.getElementById("nombreRuta").value;
    if (puntos.length === 0 || !nombreRuta) {
        return mostrarModal("Introduce un nombre y selecciona al menos un punto en el mapa.", "Error");
    }

    try {
        const res = await fetch(`${API}/rutas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: nombreRuta, puntos })
        });
        const data = await res.json();
        if (res.ok) {
            mostrarModal("Ruta guardada con éxito!", "Éxito");
            puntos = [];
            markers.forEach(m => map.removeLayer(m));
            markers = [];
            actualizarListaPuntos();
            document.getElementById("nombreRuta").value = "";
            cargarRutas();
        } else {
            mostrarModal("Error al guardar la ruta: " + data.error, "Error");
        }
    } catch (err) {
        console.error("Error al guardar la ruta:", err);
        mostrarModal("Error de conexión. Intenta de nuevo más tarde.", "Error");
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

// -------------------- Funciones de Tareas y Asignaciones --------------------

async function cargarRutasParaDatalist() {
    const datalist = document.getElementById("rutasDatalist");
    try {
        const res = await fetch(`${API}/rutas`);
        const rutas = await res.json();
        datalist.innerHTML = '';
        rutas.forEach(r => {
            const option = document.createElement("option");
            option.value = r.nombre;
            option.setAttribute("data-id", r._id);
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar las rutas para datalist:", error);
    }
}

async function guardarTarea(e) {
    e.preventDefault();
    const titulo = document.getElementById("tituloTarea").value;
    const descripcion = document.getElementById("descripcionTarea").value;
    const placa = document.getElementById("placaTarea").value;
    const sector = document.getElementById("sectorTarea").value;
    const turno = document.getElementById("turnoTarea").value;
    const rutaNombre = document.getElementById("rutaTarea").value;

    const rutaDatalist = document.getElementById("rutasDatalist");
    const rutaId = [...rutaDatalist.options].find(opt => opt.value === rutaNombre)?.getAttribute("data-id");

    if (!titulo || !descripcion || !placa || !sector || !turno || !rutaId) {
        return mostrarModal("Por favor, completa todos los campos.", "Error");
    }

    try {
        const res = await fetch(`${API}/tareas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, descripcion, placa, sector, turno, rutaId })
        });
        if (res.ok) {
            mostrarModal("Tarea creada con éxito!", "Éxito");
            document.getElementById("formularioTareas").reset();
            cargarTareas();
        } else {
            const errorData = await res.json();
            mostrarModal("Error al crear la tarea: " + errorData.error, "Error");
        }
    } catch (err) {
        console.error("Error al crear la tarea:", err);
        mostrarModal("Error de conexión. Intenta de nuevo más tarde.", "Error");
    }
}

async function cargarTareas() {
    const tbody = document.querySelector("#tablaTareas tbody");
    try {
        const res = await fetch(`${API}/tareas`);
        const tareas = await res.json();
        tbody.innerHTML = "";
        tareas.forEach(t => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${t.titulo}</td>
                <td>${t.descripcion}</td>
                <td>${t.placa}</td>
                <td>${t.sector}</td>
                <td>${t.turno}</td>
                <td>${t.estado}</td>
                <td>
                    <button class="btn btn-warning" onclick="eliminarTarea('${t._id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las tareas:", error);
        tbody.innerHTML = "<tr><td colspan='7'>Error al cargar las tareas. Revisa la consola.</td></tr>";
    }
}

async function eliminarTarea(tareaId) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    try {
        const res = await fetch(`${API}/tareas/${tareaId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            cargarTareas();
        } else {
            const errorData = await res.json();
            mostrarModal("Error al eliminar la tarea: " + errorData.error, "Error");
        }
    } catch (error) {
        console.error("Error al eliminar la tarea:", error);
        mostrarModal("Error de conexión. Intenta de nuevo más tarde.", "Error");
    }
}

async function replicarTareas() {
    const filtroFecha = document.getElementById("filtroFecha").value;
    const filtroTurno = document.getElementById("filtroTurno").value;

    if (!filtroFecha || !filtroTurno) {
        return mostrarModal("Selecciona una fecha y un turno para replicar las tareas.", "Atención");
    }

    try {
        const res = await fetch(`${API}/tareas`);
        const tareas = await res.json();
        
        const tareasFiltradas = tareas.filter(t => t.turno === filtroTurno);
        
        if (tareasFiltradas.length === 0) {
            return mostrarModal("No se encontraron tareas para replicar en el turno seleccionado.", "Atención");
        }

        const asignacionesExistentes = await (await fetch(`${API}/asignaciones`)).json();
        
        for (const tarea of tareasFiltradas) {
            const yaAsignada = asignacionesExistentes.some(a => a.tarea._id === tarea._id && a.fecha.startsWith(filtroFecha));
            
            if (!yaAsignada) {
                const nuevaAsignacion = {
                    placa: tarea.placa,
                    tarea: tarea._id,
                    chofer: null, // Asignar chofer después
                    fecha: filtroFecha,
                    turno: filtroTurno
                };
                
                await fetch(`${API}/asignaciones`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevaAsignacion)
                });
            }
        }
        mostrarModal("Tareas replicadas y asignadas con éxito.", "Éxito");
    } catch (error) {
        console.error("Error al replicar y asignar tareas:", error);
        mostrarModal("Error al replicar y asignar tareas. Revisa la consola para más detalles.", "Error");
    }
}
