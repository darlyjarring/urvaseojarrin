const API = "https://urvaseo-backend.onrender.com";
let placaSeleccionada = null;

// Espera a que el DOM esté completamente cargado antes de ejecutar el código
document.addEventListener("DOMContentLoaded", () => {
  const emailInput = document.getElementById("email");
  const loginButton = document.querySelector("button");

  // Evento que se dispara cuando el campo de email pierde el foco
  emailInput.addEventListener("blur", async () => {
    const email = emailInput.value;
    if (email.trim() === "") return;

    try {
      const res = await fetch(`${API}/check-role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.role === "chofer") {
          document.getElementById("placaInputBox").classList.remove("hidden");
          cargarPlacasActivas();
        } else {
          document.getElementById("placaInputBox").classList.add("hidden");
        }
      } else {
        // Si el usuario no existe, ocultamos el campo de la placa
        document.getElementById("placaInputBox").classList.add("hidden");
      }
    } catch (err) {
      console.error("Error al verificar rol:", err);
      document.getElementById("placaInputBox").classList.add("hidden");
    }
  });

  // Lógica de login
  async function login() {
    const email = emailInput.value;
    const password = document.getElementById("password").value;
    
    // Si la placa no fue seleccionada de la lista, se toma el valor del input
    const placa = placaSeleccionada || document.getElementById("placa").value;

    if (email.trim() === "" || password.trim() === "") {
      // Reemplazado con un modal para evitar el alert()
      mostrarMensaje("Todos los campos son obligatorios.");
      return;
    }
    
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, placa })
    });

    const data = await res.json();

    if (data.ok) {
      if (data.role === "chofer") {
        localStorage.setItem("userId", data.id);
        localStorage.setItem("chofer", data.nombres + " " + data.apellidos);
        localStorage.setItem("placa", data.placa);
        localStorage.setItem("turno", data.turno);
        window.location = "chofer.html";
      } else if (data.role === "supervisor") {
        localStorage.setItem("userId", data.id);
        localStorage.setItem("supervisorName", data.nombres + " " + data.apellidos);
        window.location = "supervisor.html";
      } else if (data.role === "admin") {
        localStorage.setItem("userId", data.id);
        localStorage.setItem("adminName", data.nombres + " " + data.apellidos);
        window.location = "admin.html";
      }
    } else {
      // Reemplazado con un modal para evitar el alert()
      mostrarMensaje(data.error);
    }
  }

  // Cargar y filtrar placas activas
  async function cargarPlacasActivas() {
    const res = await fetch(`${API}/placas`);
    const placas = await res.json();
    const placaInput = document.getElementById("placa");
    const placaList = document.getElementById("placa-list");

    // Filtrado dinámico
    placaInput.addEventListener("keyup", () => {
      const query = placaInput.value.toLowerCase();
      placaList.innerHTML = "";
      placas.filter(p => p.placa.toLowerCase().includes(query))
        .forEach(p => {
          const li = document.createElement("li");
          li.innerText = p.placa;
          li.addEventListener("click", () => {
            placaInput.value = p.placa;
            placaSeleccionada = p.placa;
            placaList.innerHTML = "";
          });
          placaList.appendChild(li);
        });
    });
  }
  
  // Asignamos la función de login al botón de "Ingresar"
  loginButton.addEventListener("click", login);
  
  function mostrarMensaje(mensaje) {
    const loginContainer = document.querySelector(".login-container");
    let modal = document.querySelector(".custom-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "custom-modal";
      modal.innerHTML = `
        <div class="modal-content">
          <p class="modal-text"></p>
          <button class="modal-button">Cerrar</button>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector(".modal-button").addEventListener("click", () => {
        modal.style.display = "none";
      });
    }

    modal.querySelector(".modal-text").textContent = mensaje;
    modal.style.display = "flex";
  }
});
