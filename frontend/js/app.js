const API = "https://urvaseo-backend.onrender.com";

async function verificarRol() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    if (data.role === "chofer") {
      // Si el rol es chofer, mostramos el campo para la placa
      const loginButton = document.getElementById("loginButton");
      loginButton.innerText = "Ingresar";
      loginButton.onclick = loginConPlaca; // Cambia la función del botón
      
      const placaBox = document.createElement("div");
      placaBox.className = "form-box";
      placaBox.innerHTML = '<input id="placa" placeholder="Placa del vehículo">';
      document.querySelector('body > h1').after(placaBox);

      // Guardamos la información del chofer temporalmente
      localStorage.setItem("temp_choferData", JSON.stringify(data));
      alert("Por favor, ingresa la placa de tu vehículo y presiona 'Ingresar'.");
    } else {
      // Si no es chofer, completamos el login directamente
      manejarLoginExitoso(data);
    }
  } catch (err) {
    console.error("Error al verificar el rol:", err);
    alert("Error de conexión. Intenta de nuevo más tarde.");
  }
}

async function loginConPlaca() {
  const placa = document.getElementById("placa").value;
  if (!placa) {
    alert("Debes ingresar la placa del vehículo 🚛");
    return;
  }
  
  const tempChoferData = JSON.parse(localStorage.getItem("temp_choferData"));
  
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: tempChoferData.nombre,
      password: "", // La contraseña ya fue validada
      placa: placa
    })
  });
  
  const data = await res.json();
  if (data.ok) {
    manejarLoginExitoso(data);
  } else {
    alert(data.error);
  }
}

function manejarLoginExitoso(data) {
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
  localStorage.removeItem("temp_choferData");
}
