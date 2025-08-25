const API = "https://urvaseo-backend.onrender.com"; // tu backend

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // 1. Enviamos al backend para validar credenciales
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!data.role) {
    alert("Usuario o contraseña incorrectos ❌");
    return;
  }

  // 2. Si el rol es chofer -> mostrar input de placa
  if (data.role === "chofer") {
    const placaBox = document.getElementById("placaBox");
    placaBox.classList.remove("hidden");

    const placa = document.getElementById("placa").value;

    // Si aún no han ingresado la placa, pedimos que la escriban
    if (!placa) {
      alert("Por favor ingresa la placa del vehículo 🚛");
      return;
    }

    // Guardamos todo en localStorage
    localStorage.setItem("chofer", data.nombre || username);
    localStorage.setItem("placa", placa);

    // Redirigir a vista chofer
    window.location = "chofer.html";
  }
  else if (data.role === "supervisor") {
    window.location = "supervisor.html";
  }
  else {
    alert("Rol desconocido ❓");
  }
}
