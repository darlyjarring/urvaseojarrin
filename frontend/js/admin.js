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
                cargarPlacasParaSelect();
                cargarRutasParaDatalist();
                cargarTareas();
            }
        });
    });

    // Cargar la sección inicial
    cargarPlacas();

    const filtroFechaInput = document.getElementById("filtroFecha");
    const filtroTurnoSelect = document.getElementById("filtroTurno");
    const botonReplicar = document.getElementById("btnReplicar");
    const botonLimpiar = document.getElementById("btnLimpiar");
    const modal = document.getElementById("modalReplica");
    const span = document.getElementsByClassName("close")[0];

    botonReplica.onclick = function () {
        modal.style.display = "block";
    };

    span.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    // Funcionalidad de filtros y botones
    botonLimpiar.addEventListener("click", () => {
        filtroFechaInput.value = "";
        filtroTurnoSelect.value = "Todos";
        cargarAsignaciones();
    });

    filtroFechaInput.addEventListener("change", () => cargarAsignaciones());
    filtroTurnoSelect.addEventListener("change", () => cargarAsignaciones());

    document.getElementById("formReplica").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fechaOriginal = document.getElementById("fechaOriginal").value;
        const fechaDestino = document.getElementById("fechaDestino").value;

        if (!fechaOriginal || !fechaDestino) {
            alert("Por favor, selecciona ambas fechas.");
            return;
        }

        const asignacionesOriginales = await obtenerAsignacionesPorFecha(fechaOriginal);
        if (asignacionesOriginales.length === 0) {
            alert("No hay asignaciones para la fecha original.");
            return;
        }

        await replicarAsignaciones(asignacionesOriginales, fechaDestino);
        modal.style.display = "none";
    });

    async function obtenerAsignacionesPorFecha(fecha) {
        try {
            const res = await fetch(`${API}/asignaciones?fecha=${fecha}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        } catch (error) {
            console.error("Error al obtener asignaciones por fecha:", error);
            return [];
        }
    }

    async function replicarAsignaciones(asignaciones, fechaDestino) {
        for (const asignacion of asignaciones) {
            const nuevaAsignacion = {
                chofer: asignacion.chofer,
                placa: asignacion.placa,
                ruta: asignacion.ruta,
                fecha: fechaDestino,
                estado: "Pendiente"
            };
            try {
                await fetch(`${API}/asignaciones`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(nuevaAsignacion),
                });
            } catch (error) {
                console.error("Error al replicar la asignación:", error);
            }
        }
        alert("Asignaciones replicadas con éxito.");
        cargarAsignaciones();
    }
});

// Sección de Placas
async function cargarPlacas() {
    const tbody = document.querySelector("#tablaPlacas tbody");
    try {
        const res = await fetch(`${API}/placas`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const placas = await res.json();

        tbody.innerHTML = "";

        placas.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.placa}</td>
                <td>${p.activo ? "Sí" : "No"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las placas:", error);
        tbody.innerHTML = "<tr><td colspan='2'>Error al cargar las placas. Revisa la consola para más detalles.</td></tr>";
    }
}

// Sección de Rutas
async function guardarRuta() {
    const nombreRuta = document.getElementById("nombreRuta").value;
    if (nombreRuta.trim() === "") {
        alert("El nombre de la ruta es obligatorio.");
        return;
    }
    if (puntos.length === 0) {
        alert("Debe agregar al menos un punto a la ruta.");
        return;
    }

    try {
        const res = await fetch(`${API}/rutas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre: nombreRuta, puntos }),
        });
        const data = await res.json();
        if (data.ok) {
            alert("Ruta guardada con éxito.");
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

// Sección de Tareas
async function cargarPlacasParaSelect() {
    const select = document.getElementById("placaSelect");
    try {
        const res = await fetch(`${API}/placas`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const placas = await res.json();
        select.innerHTML = "<option value=''>Selecciona una placa</option>";
        placas.forEach(p => {
            if (p.activo) {
                const option = document.createElement("option");
                option.value = p._id;
                option.innerText = p.placa;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Error al cargar las placas:", error);
    }
}

async function cargarRutasParaDatalist() {
    const datalist = document.getElementById("rutasDatalist");
    try {
        const res = await fetch(`${API}/rutas`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const rutas = await res.json();
        datalist.innerHTML = "";
        rutas.forEach(r => {
            const option = document.createElement("option");
            option.value = r.nombre;
            option.dataset.rutaId = r._id;
            datalist.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar las rutas para datalist:", error);
    }
}

async function asignarTarea() {
    const chofer = document.getElementById("choferSelect").value;
    const placa = document.getElementById("placaSelect").value;
    const rutaNombre = document.getElementById("rutaInput").value;
    const fecha = document.getElementById("fechaInput").value;
    const estado = document.getElementById("estadoSelect").value;
    
    // Validación de campos
    if (!chofer || !placa || !rutaNombre || !fecha) {
        alert("Todos los campos son obligatorios. Por favor, completa el formulario.");
        return;
    }

    // Obtener el _id de la ruta a partir de su nombre
    const rutasDatalist = document.getElementById("rutasDatalist").options;
    let rutaId = null;
    for (let i = 0; i < rutasDatalist.length; i++) {
        if (rutasDatalist[i].value === rutaNombre) {
            rutaId = rutasDatalist[i].dataset.rutaId;
            break;
        }
    }

    if (!rutaId) {
        alert("La ruta seleccionada no es válida.");
        return;
    }

    try {
        const res = await fetch(`${API}/asignaciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chofer,
                placa,
                ruta: rutaId,
                fecha,
                estado
            }),
        });
        const data = await res.json();
        if (data.ok) {
            alert("Asignación de tarea exitosa.");
            cargarAsignaciones();
            document.getElementById("formAsignarTarea").reset();
        } else {
            alert("Error al asignar la tarea: " + data.error);
        }
    } catch (err) {
        console.error("Error al asignar la tarea:", err);
        alert("Error de conexión. Intenta de nuevo más tarde.");
    }
}

async function cargarAsignaciones() {
    const tbody = document.querySelector("#tablaAsignaciones tbody");
    const filtroFecha = document.getElementById("filtroFecha").value;
    const filtroTurno = document.getElementById("filtroTurno").value;

    try {
        const res = await fetch(`${API}/asignaciones`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        let asignaciones = await res.json();

        // Filtrado en el cliente (mejorar en el backend con parámetros de query)
        if (filtroFecha) {
            asignaciones = asignaciones.filter(a => {
                const fechaAsignacion = new Date(a.fecha).toISOString().split('T')[0];
                return fechaAsignacion === filtroFecha;
            });
        }
        if (filtroTurno !== "Todos") {
            asignaciones = asignaciones.filter(a => a.turno === filtroTurno);
        }

        const promesasDetalles = asignaciones.map(async (a) => {
            const [choferRes, placaRes, rutaRes] = await Promise.all([
                fetch(`${API}/users/${a.chofer}`),
                fetch(`${API}/placas/${a.placa}`),
                fetch(`${API}/rutas/${a.ruta}`),
            ]);

            const chofer = await choferRes.json();
            const placa = await placaRes.json();
            const ruta = await rutaRes.json();
            
            return {
                ...a,
                choferNombre: chofer.nombres,
                placaNombre: placa.placa,
                rutaNombre: ruta.nombre,
            };
        });

        const asignacionesConDetalles = await Promise.all(promesasDetalles);
        tbody.innerHTML = "";

        asignacionesConDetalles.forEach(a => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.choferNombre}</td>
                <td>${a.placaNombre}</td>
                <td>${a.rutaNombre}</td>
                <td>${new Date(a.fecha).toISOString().split('T')[0]}</td>
                <td>${a.estado}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editarAsignacion('${a._id}')">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarAsignacion('${a._id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error al cargar las asignaciones:", error);
        tbody.innerHTML = "<tr><td colspan='6'>Error al cargar las asignaciones. Revisa la consola para más detalles.</td></tr>";
    }
}

// Funciones de eliminación, edición y actualización
async function eliminarAsignacion(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta asignación?")) {
        try {
            const res = await fetch(`${API}/asignaciones/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("Asignación eliminada con éxito.");
                cargarAsignaciones();
            } else {
                alert("Error al eliminar la asignación.");
            }
        } catch (error) {
            console.error("Error al eliminar la asignación:", error);
            alert("Error de conexión. Intenta de nuevo más tarde.");
        }
    }
}

// Mapa y Puntos de ruta
function inicializarMapa() {
    if (map) return; // Evita inicializar el mapa múltiples veces
    map = L.map('map').setView([-2.1468, -79.9678], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('click', onMapClick);
}

function onMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const nombre = prompt("Ingresa un nombre para este punto:");
    if (nombre) {
        const punto = { lat, lng, nombre, estado: "Pendiente" };
        puntos.push(punto);
        const marker = L.marker([lat, lng]).addTo(map).bindPopup(nombre);
        markers.push(marker);
        actualizarPuntosLista();
    }
}

function actualizarPuntosLista() {
    const ul = document.getElementById("puntosLista");
    ul.innerHTML = "";
    puntos.forEach((p, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `
            <span>${p.nombre} (Lat: ${p.lat.toFixed(4)}, Lng: ${p.lng.toFixed(4)})</span>
            <button class="btn btn-danger btn-sm" onclick="eliminarPunto(${index})">Eliminar</button>
        `;
        ul.appendChild(li);
    });
}

function eliminarPunto(index) {
    map.removeLayer(markers[index]);
    puntos.splice(index, 1);
    markers.splice(index, 1);
    actualizarPuntosLista();
}
