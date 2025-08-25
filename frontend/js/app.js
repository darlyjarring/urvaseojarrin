const API = "https://urvaseo-backend.onrender.com"; // tu backend

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

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
    
    // Si aún no han ingresado la placa, pedimos que la escriban
    const placa = document.getElementById("placa").value;
    if (!placa) {
      alert("Por favor ingresa la placa del vehículo 🚛");
      return;
    }

    // Guardamos los datos necesarios en localStorage
    localStorage.setItem("choferId", data.id); // Asumiendo que el backend devuelve 'id'
    localStorage.setItem("chofer", data.nombre || username);
    localStorage.setItem("placa", placa);
    localStorage.setItem("turno", data.turno);

    // Redirigir a vista chofer
    window.location = "chofer.html";

  } else if (data.role === "supervisor") {
    window.location = "supervisor.html";
  } else if (data.role === "admin") {
    window.location = "admin.html";
  } else {
    alert("Rol desconocido ❓");
  }
}
