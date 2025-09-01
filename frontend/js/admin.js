onst API = "https://urvaseo-backend.onrender.com";

let map = null;
let puntos = [];
let markers = [];

// Lógica de navegación por pestañas
document.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".navbar a");
    const sections = document.querySelectorAll(".section");

    links.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = e.target.getAttribute("href").substring(1);

            links.forEach(l => l.classList.remove("active"));
            e.target.classList.add("active");

            sections.forEach(s => s.classList.remove("active"));
            document.getElementById(targetId + "-section").classList.add("active");

            // Cargar datos según la sección
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

    // Cargar la sección de placas por defecto al iniciar
    cargarPlacas();
});

// 🔹 Funciones para la sección de PLACAS
async function cargarPlacas() {
    const res = await fetch(`${API}/placas`);
    const placas = await res.json();
    const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
    tablaPlacasBody.innerHTML = "";

    placas.forEach((p, i) => {
        const tr = document.createElement("tr");
        const estadoTexto = p.activo ? "Activa" : "Inactiva";
        const estadoClase = p.activo ? "status-active" : "status-inactive";
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${p.placa}</td>
            <td class="${estadoClase}">${estadoTexto}</td>
            <td><button class="btn btn-sm btn-info" onclick="editarPlaca('${p._id}', ${p.activo})">Editar</button></td>
        `;
        tablaPlacasBody.appendChild(tr);
    });
}

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

async function editarPlaca(id, estadoActual) {
    const nuevoEstadoPrompt = prompt("Ingrese el nuevo estado (activo/inactivo):", estadoActual ? "activo" : "inactivo");
    if (!nuevoEstadoPrompt) return;
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

// 🔹 Funciones para la sección de TAREAS
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

async function cargarTareas() {
    const tbody = document.querySelector("#tablaTareas tbody");
    try {
        const res = await fetch(`${API}/tareas`);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const tareas = await res.json();
        
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

            if (t.rutaId && t.rutaId.puntos && t.rutaId.puntos.length > 0) {
                const trDetalle = document.createElement("tr");
                trDetalle.classList.add("detalle-fila");
                const tdDetalle = document.createElement("td");
                tdDetalle.setAttribute("colspan", "4");
                
                let puntosHTML = `<ul class="list-unstyled">`;
                
                if (t.estados_detareaxelemntoderuta) {
                  t.estados_detareaxelemntoderuta.forEach(puntoEstado => {
                      const puntoEnRuta = t.rutaId.puntos.find(p => p._id === puntoEstado.puntoId);
                      const nombrePunto = puntoEnRuta ? puntoEnRuta.nombre : 'Desconocido';
                      puntosHTML += `<li><strong>${nombrePunto}:</strong> ${puntoEstado.estado}</li>`;
                  });
                }
                puntosHTML += `</ul>`;
                
                tdDetalle.innerHTML = puntosHTML;
                trDetalle.appendChild(tdDetalle);
                tbody.appendChild(trDetalle);
            }
        });
    } catch (error) {
        console.error("Error al cargar las tareas:", error);
        tbody.innerHTML = "<tr><td colspan='4'>Error al cargar las tareas. Revisa la consola para más detalles.</td></tr>";
    }
}


// 🔹 Funciones para la sección de RUTAS
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
            cargarRutas(); // Vuelve a cargar la tabla de rutas después de guardar
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
