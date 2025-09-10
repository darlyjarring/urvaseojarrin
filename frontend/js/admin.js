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
    
//añadido para poner placas por turno y q no se repitan
    //const filtroFechaInput = document.getElementById("fechaInput");
  //  const filtroTurnoSelect = document.getElementById("turnoSelect");
    const filtroFechaInput = document.getElementById("filtroFecha");
    const filtroTurnoSelect = document.getElementById("filtroTurno")
    const botonReplicar = document.getElementById("btnReplicarTurno");;

    //añadido placa no repetir
     const selectPlaca = document.getElementById("placaSelect");

    filtroFechaInput.addEventListener('change', () => {
        const fecha = filtroFechaInput.value;
        const turno = filtroTurnoSelect.value;
        if (fecha && turno) {
            cargarPlacasParaSelect(fecha, turno);
        }
    });

    filtroTurnoSelect.addEventListener('change', () => {
        const fecha = filtroFechaInput.value;
        const turno = filtroTurnoSelect.value;
        if (fecha && turno) {
            cargarPlacasParaSelect(fecha, turno);
        }
    });
    // fin placas por turno y no se repitan

    
    const filtroFechaInput = document.getElementById("filtroFecha");
    const filtroTurnoSelect = document.getElementById("filtroTurno")
    const botonReplicar = document.getElementById("btnReplicarTurno");;

    //añadido placa no repetir
     const selectPlaca = document.getElementById("placaSelect");
     let placasDisponibles = [];

     async function cargarPlacasParaSelect(fecha, turno) {
        try {
            const res = await fetch(`${API}/placas-disponibles?fecha=${fecha}&turno=${turno}`);
            if (!res.ok) {
                throw new Error("Error al cargar placas disponibles");
            }
            const placas = await res.json();
            selectPlaca.innerHTML = "<option value=''>Seleccione una placa</option>";
            placasDisponibles = placas;
            placas.forEach(p => {
                const option = document.createElement("option");
                option.value = p._id;
                option.textContent = p.placa;
                selectPlaca.appendChild(option);
            });
        } catch (err) {
            console.error(err);
            alert("Error al cargar las placas disponibles.");
        }
    }
    // fin añadido placa no repetir
    
    
    if (filtroFechaInput && filtroTurnoSelect) {
        filtroFechaInput.addEventListener('change', cargarTareas);
        filtroTurnoSelect.addEventListener('change', cargarTareas);
        
        const hoy = new Date().toISOString().split('T')[0];
        filtroFechaInput.value = hoy;
    }

    if (botonReplicar) {
        botonReplicar.addEventListener('click', replicarTurno);
    }
});

async function cargarPlacas() {
  const res = await fetch(`${API}/placas`);
  const placas = await res.json();
  const tablaPlacasBody = document.querySelector("#tablaPlacas tbody");
  tablaPlacasBody.innerHTML = "";

  placas.forEach((p, i) => {
    const estadoTexto = p.estado === "activo" ? "Activa" : "Inactiva";
    const estadoClase = p.estado === "activo" ? "status-active" : "status-inactive";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.placa}</td>
      <td class="${estadoClase}">${estadoTexto}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="editarPlaca('${p._id}', '${p.estado}')">Editar</button>
      </td>
    `;
    tablaPlacasBody.appendChild(tr);
  });
}
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

async function editarPlaca(id, estadoActual) {
    const nuevoEstadoPrompt = prompt("Ingrese el nuevo estado (activo/inactivo):", estadoActual ? "activo" : "inactivo");
    if (!nuevoEstadoPrompt) return;
    const nuevoEstadoLower = nuevoEstadoPrompt.toLowerCase();
    if (nuevoEstadoLower !== "activo" && nuevoEstadoLower !== "inactivo") {
        alert("Estado inválido. Por favor use 'activo' o 'inactivo'.");
        return;
    }

    const estado  = nuevoEstadoLower === "activo";
    await fetch(`${API}/placas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: estado ? "activo" : "inactivo" })
    });
    cargarPlacas();
}

async function cargarPlacasParaSelect() {
    const res = await fetch(`${API}/placas`);
    const placas = await res.json();
    const placaSelect = document.getElementById("placaSelect");
    placaSelect.innerHTML = "";
    
    // ✅ CORRECCIÓN: Filtramos las placas para mostrar solo las que están activas
    const placasActivas = placas.filter(p => p.estado === "activo");

    placasActivas.forEach(p => {
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
    // ✅ CORRECCIÓN: Usamos los IDs correctos de tu archivo HTML
    const placa = document.getElementById("placaSelect").value;
    const sector = document.getElementById("sectorInput").value;
    const turno = document.getElementById("turnoSelect").value;
    const fecha = document.getElementById("fechaInput").value;
    const userId = localStorage.getItem('anonUserId');

    // Generamos el título y la descripción
    const titulo = `Tarea para ${placa} - ${sector}`;
    const descripcion = `Limpieza y recolección en el sector ${sector} en el turno ${turno} del ${fecha}.`;

    // Asume que ya tienes la función 'obtenerRutaIdPorNombre' definida
    // Si no la tienes, asegúrate de agregarla.
    const rutaId = await obtenerRutaIdPorNombre(sector);

    if (!placa || !sector || !turno || !fecha || !userId || !rutaId) {
        alert("Todos los campos (placa, sector, turno, fecha) son obligatorios.");
        return;
    }

    try {
        const res = await fetch(`${API}/tareas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Enviamos los campos obligatorios al servidor
            body: JSON.stringify({ titulo, descripcion, placa, sector, turno, fecha, userId, rutaId })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Tarea asignada con éxito ✅");
             // ✅ NUEVO: Lógica para limpiar los campos del formulario
            document.getElementById("placaSelect").value = "";          
            document.getElementById("sectorInput").value = "";
            // Vuelve a cargar la lista de placas para reflejar el cambio**inicio
        const fecha = document.getElementById("fechaInput").value;
        const turno = document.getElementById("turnoSelect").value;
        if (fecha && turno) {
            cargarPlacasParaSelect(fecha, turno);
        }
            //  ***fin
            cargarTareas();
        } else {
            console.error(data);
            alert(`Error al asignar la tarea: ${data.error}`);
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
        
        // ✅ Lógica de filtrado
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
        
        // ✅ Se añade la columna de Porcentaje
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

        // ✅ Lógica para calcular y mostrar el estado y porcentaje
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

// Agrega esta función a tu archivo admin (13).js para buscar el ID de la ruta
async function obtenerRutaIdPorNombre(nombreRuta) {
    try {
        const res = await fetch(`${API}/rutas`);
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        const rutas = await res.json();
        const rutaEncontrada = rutas.find(r => r.nombre === nombreRuta);
        return rutaEncontrada ? rutaEncontrada._id : null;
    } catch (error) {
        console.error("Error al obtener el ID de la ruta:", error);
        return null;
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
            const nuevaTarea = { placa: tarea.placa, 
                                sector: tarea.sector, 
                                turno: turnoDestino, 
                                fecha: fechaDestinoStr, 
                                userId: userId, 
                                titulo: tarea.titulo, 
                                descripcion: tarea.descripcion, 
                                rutaId: tarea.rutaId 
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
