const API = "https://urvaseo-backend.onrender.com";
let placaSeleccionada = null;

document.getElementById("username").addEventListener("keyup", async (e) => {
  if (e.key === 'Enter') {
    const username = document.getElementById("username").value;
    if (username.trim() === "") return;

    const res = await fetch(`${API}/check-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.role === "chofer") {
        document.getElementById("passwordBox").classList.add("hidden");
        document.getElementById("loginButton").classList.add("hidden");
        document.getElementById("placaInputBox").classList.remove("hidden");
        cargarPlacasActivas();
      } else {
        document.getElementById("passwordBox").classList.remove("hidden");
        document.getElementById("loginButton").classList.remove("hidden");
        document.getElementById("placaInputBox").classList.add("hidden");
      }
    } else {
      alert("Usuario no encontrado.");
    }
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
          document.getElementById("passwordBox").classList.remove("hidden");
          document.getElementById("loginButton").classList.remove("hidden");
        });
        placaList.appendChild(li);
      });
  });
}

// Lógica de login
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const placa = placaSeleccionada;

  if (username.trim() === "" || password.trim() === "") {
    return alert("Todos los campos son obligatorios.");
  }
  
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, placa })
  });

  const data = await res.json();

  if (data.ok) {
    if (data.role === "chofer") {
      localStorage.setItem("choferId", data.id);
      localStorage.setItem("chofer", data.nombre);
      localStorage.setItem("placa", data.placa);
      localStorage.setItem("turno", data.turno);
      window.location = "chofer.html";
    } else if (data.role === "supervisor") {
      window.location = "supervisor.html";
    } else if (data.role === "admin") {
      window.location = "admin.html";
    }
  } else {
    alert(data.error);
  }
}
