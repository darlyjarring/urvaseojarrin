const API = "https://urvaseo-backend.onrender.com";
let placaSeleccionada = null;

// Evento que se dispara al hacer clic/tocar o presionar tab en el campo de contraseña
document.getElementById("password").addEventListener("focus", async () => {
  const email = document.getElementById("email").value;
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
      // Si el usuario no existe, ocultamos todo lo que se necesite
      document.getElementById("placaInputBox").classList.add("hidden");
    }
  } catch (err) {
    console.error("Error al verificar rol:", err);
    document.getElementById("placaInputBox").classList.add("hidden");
  }
});

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

// Lógica de login
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const placa = placaSeleccionada;

  if (email.trim() === "" || password.trim() === "") {
    return alert("Todos los campos son obligatorios.");
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
    alert(data.error);
  }
}
