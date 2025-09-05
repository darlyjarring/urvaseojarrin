const API = "https://urvaseo-backend.onrender.com";
const choferId = localStorage.getItem("choferId");
const placa = localStorage.getItem("placa");
const turno = localStorage.getItem("turno");

const map = L.map('map').setView([-2.2, -79.9], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
let polyline = null;
let tareaActual = null; // Almacenaremos la tarea completa aquí

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
    // Verificamos si la placa o el turno son 'undefined'
    if (!placa || !turno || turno === 'undefined') {
        alert("Error: Falta información del chofer. Inicia sesión nuevamente.");
        window.location.href = "index.html"; // Redirecciona al login
        return;
    }

    try {
        const res = await fetch(`${API}/tareas/chofer/${placa}/${turno}`);
        
        if (!res.ok) {
            const tareasLista = document.getElementById('tareas-lista');
            if (res.status === 404) {
                // ✅ Corrección: Ahora `tareasLista` no será nulo
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

function mostrarDetalleTarea() {
    if (!tareaActual) return;

    const listaContainer = document.getElementById('tareas-lista-container');
    listaContainer.innerHTML = ""; // Limpia el contenedor

    // Título de la ruta
    const titulo = document.createElement("h3");
    titulo.textContent = tareaActual.rutaId.nombre;
    listaContainer.appendChild(titulo);

    // Lista de puntos
    const ul = document.createElement("ul");
    ul.className = "list-unstyled";

    tareaActual.estados_detareaxelemntoderuta.forEach(puntoEstado => {
        const punto = tareaActual.rutaId.puntos.find(p => p._id === puntoEstado.puntoId);
        if (!punto) return; // Asegura que el punto exista

        const li = document.createElement("li");
        li.className = "punto-item";
        li.innerHTML = `
            <strong>${punto.nombre}</strong> - Estado: ${puntoEstado.estado}
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-warning" onclick="marcarPunto('${tareaActual._id}', '${puntoEstado.puntoId}', 'en proceso')">En Proceso</button>
                <button class="btn btn-sm btn-outline-success" onclick="marcarPunto('${tareaActual._id}', '${puntoEstado.puntoId}', 'ejecutada')">Terminada</button>
                <button class="btn btn-sm btn-outline-info" onclick="reportarObservacion('${tareaActual._id}', '${puntoEstado.puntoId}')">Observación</button>
            </div>
        `;
        ul.appendChild(li);
    });

    listaContainer.appendChild(ul);
}

function actualizarMapa() {
    if (!tareaActual || !tareaActual.rutaId || !tareaActual.rutaId.puntos) return;

    // Limpia marcadores y polilínea anteriores
    markers.forEach(m => map.removeLayer(m));
    if (polyline) map.removeLayer(polyline);
    markers = [];

    const puntosRuta = tareaActual.rutaId.puntos.map(p => [p.lat, p.lng]);
    const estadosPuntos = tareaActual.estados_detareaxelemntoderuta;

    // Agrega marcadores con el icono correcto según el estado
    puntosRuta.forEach((punto, index) => {
        const estadoPunto = estadosPuntos[index].estado;
        const icon = estadoIconos[estadoPunto] || estadoIconos["pendiente"];
        const puntoData = tareaActual.rutaId.puntos[index];

        const marker = L.marker(punto, { icon }).addTo(map)
            .bindPopup(`<b>${puntoData.nombre}</b><br>Estado: ${estadoPunto}`);
        markers.push(marker);
    });

    // Dibuja la polilínea
    polyline = L.polyline(puntosRuta, { color: 'blue' }).addTo(map);

    // Ajusta la vista del mapa para que se adapte a la ruta
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
            cargarTareas(); // Recarga las tareas para reflejar los cambios
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
