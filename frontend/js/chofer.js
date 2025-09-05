const API = "https://urvaseo-backend.onrender.com";

const choferId = localStorage.getItem("choferId");
const placa = localStorage.getItem("placa");

function obtenerTurnoActual() {
    const ahora = new Date();
    const hora = ahora.getHours();
    
    if (hora >= 7 && hora < 15) {
        return "Mañana";
    } else if (hora >= 15 && hora < 23) {
        return "Tarde";
    } else {
        return "Noche";
    }
}

const turno = obtenerTurnoActual();

let map = null;
let markers = [];
let polyline = null;
let tareaActual = null;

// --- Definición de Íconos SVG Personalizados ---
const getIcon = (color) => {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style=\"color: ${color}; font-size: 24px; position: relative;\"><i class=\"fas fa-map-marker-alt\"></i></div>`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    });
};

const estadoIconos = {
    "pendiente": getIcon('blue'),
    "en proceso": getIcon('orange'),
    "ejecutada": getIcon('green'),
    "terminada": getIcon('green')
};

// --- Lógica principal ---
document.addEventListener("DOMContentLoaded", () => {
    if (placa && turno) {
        cargarTareas();
    } else {
        alert("No se encontró información del chofer. Inicia sesión de nuevo.");
        window.location.href = "index.html";
    }
});

async function cargarTareas() {
    if (!placa || !turno) {
        alert("Error: Falta información del chofer. Inicia sesión nuevamente.");
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch(`${API}/tareas/chofer/${placa}/${turno}`);
        const tareasLista = document.getElementById('tareas-lista');
        
        if (!res.ok) {
            if (res.status === 404) {
                tareasLista.innerHTML = "<p>No tienes tareas asignadas para este turno y fecha.</p>";
                return;
            }
            throw new Error(`Error al cargar las tareas: ${res.statusText}`);
        }
        tareaActual = await res.json();
        
        mostrarDetalleTarea();
        actualizarMapa();

    } catch (err) {
        console.error("Error al cargar las tareas:", err);
        alert("Error al cargar las tareas. Revisa la consola.");
    }
}

// ✅ Función para crear el contenido del popup dinámicamente
function crearContenidoPopup(punto, puntoEstado, tareaId) {
    let botonesHTML = '';
    
    // Botón para reportar siempre está disponible
    const botonObservacion = `<button class="btn btn-sm btn-outline-info" onclick="reportarObservacion('${tareaId}', '${puntoEstado.puntoId}')">Observación</button>`;

    if (puntoEstado.estado === 'pendiente') {
        botonesHTML = `
            <button class="btn btn-sm btn-outline-warning" onclick="marcarPunto('${tareaId}', '${puntoEstado.puntoId}', 'en proceso')">En Proceso</button>
            ${botonObservacion}
        `;
    } else if (puntoEstado.estado === 'en proceso') {
        botonesHTML = `
            <button class="btn btn-sm btn-outline-success" onclick="marcarPunto('${tareaId}', '${puntoEstado.puntoId}', 'ejecutada')">Terminada</button>
            ${botonObservacion}
        `;
    } else if (puntoEstado.estado === 'ejecutada') {
        botonesHTML = `
            <span class="text-success fw-bold">Punto Completado</span>
            ${botonObservacion}
        `;
    }

    return `
        <div class="popup-content">
            <b>${punto.nombre}</b><br>
            Estado: <b>${puntoEstado.estado}</b>
            <hr>
            ${botonesHTML}
        </div>
    `;
}

function mostrarDetalleTarea() {
    // Esta función ya no es necesaria si todo se maneja desde el mapa
    // pero la mantendremos para compatibilidad si el usuario la usa en otro lado
    if (!tareaActual) return;
    const listaContainer = document.getElementById('tareas-lista');
    listaContainer.innerHTML = "";
    const titulo = document.createElement("h3");
    titulo.textContent = tareaActual.rutaId.nombre;
    listaContainer.appendChild(titulo);
}

// ✅ Función actualizada para crear marcadores con popups interactivos
function actualizarMapa() {
    if (!tareaActual || !tareaActual.rutaId || !tareaActual.rutaId.puntos) return;

    if (!map) {
        map = L.map('map').setView([-2.2, -79.9], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    }
    
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];

    const puntosRuta = tareaActual.rutaId.puntos.map(p => [p.lat, p.lng]);
    const estadosPuntos = tareaActual.estados_detareaxelemntoderuta;

    puntosRuta.forEach((punto, index) => {
        const estadoPunto = estadosPuntos[index].estado;
        const icon = estadoIconos[estadoPunto] || estadoIconos["pendiente"];
        const puntoData = tareaActual.rutaId.puntos[index];

        const popupContent = crearContenidoPopup(puntoData, estadosPuntos[index], tareaActual._id);

        const marker = L.marker(punto, { icon }).addTo(map)
            .bindPopup(popupContent);
        markers.push(marker);
    });

    polyline = L.polyline(puntosRuta, { color: 'blue' }).addTo(map);
    map.fitBounds(polyline.getBounds());
}

async function marcarPunto(tareaId, puntoId, nuevoEstado) {
    try {
        const res = await fetch(`${API}/tareas/${tareaId}/puntos/${puntoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado }),
        });
        if (res.ok) {
            await res.json();
            alert("Estado de la tarea actualizado con éxito.");
            cargarTareas();
        } else {
            throw new Error("Error al actualizar el estado del punto.");
        }
    } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado. Intenta de nuevo más tarde.");
    }
}

async function reportarObservacion(tareaId, puntoId) {
    const descripcion = prompt("Por favor, describe la observación:");
    if (!descripcion) return;

    const data = {
        chofer: choferId,
        tarea: tareaId,
        punto: puntoId,
        descripcion,
    };

    try {
        const res = await fetch(`${API}/observaciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.ok) {
            alert("Observación enviada con éxito ✅");
        } else {
            alert("Error al enviar la observación.");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión. Intenta de nuevo más tarde.");
    }
}
